import type { AuditProject } from '../data/auditProjects'
import type { Task } from '../data/types'
import type { AgentRun, AgentArtifact } from '../agents/types'
import { useAgentRuntimeStore } from '../agents/store'
import { useAuditProjectStore } from '../store/auditProjectStore'
import { useTaskDispatchStore } from '../store/taskDispatchStore'
import { useProjectDocumentStore } from '../store/projectDocumentStore'
import { useWorkpaperStore } from '../store/workpaperStore'
import { useResourceStore } from '../store/resourceStore'
import { currentVersion, usableResource } from '../data/resourceModel'
import { defaultReviewConfig, validateReviewConfig } from '../data/reviewConfig'
import { readProjectFile } from './projectFileStorage'
import { parsePlanFile } from './annual-plan/planFiles'

export function reviewTaskProject(task: Task, projects: AuditProject[]) {
  const owners = projects.filter((p) => task.projectId ? p.id === task.projectId : p.taskIds.includes(task.id))
  return owners.length === 1 ? owners[0] : undefined
}
function requireTask(taskId: string) {
  const task = useTaskDispatchStore.getState().tasks.find((t) => t.id === taskId)
  const project = task && reviewTaskProject(task, useAuditProjectStore.getState().projects)
  if (!task || !project) throw new Error('任务尚未明确所属项目，请先核对项目关联。')
  if (project.archivedAt || project.archivePending || project.auditReport?.status === '已签发') throw new Error('项目成果已封存，当前只能查看已有结果。')
  return { task, project }
}
export async function startReview(taskId: string, fileIds: string[], actor: string, progress: (text: string) => void) {
  const { task, project } = requireTask(taskId)
  const assets = useResourceStore.getState().assets
  const agent = assets.find((a) => a.id === 'AG02')
  if (!agent || !usableResource(agent)) throw new Error('审计数据分析智能体未发布、已停用或不在有效期内。')
  const version = currentVersion(agent)!
  const config = structuredClone(version.snapshot.reviewConfig ?? defaultReviewConfig)
  validateReviewConfig(config)
  const related = version.snapshot.relatedIds.map((id) => assets.find((a) => a.id === id))
  if (related.some((r) => !r || !usableResource(r))) throw new Error('智能体关联的依据或规则不可用，请先核对配置。')
  const files = [...new Set(fileIds)].map((id) => useProjectDocumentStore.getState().files.find((f) => f.id === id && f.projectId === project.id))
  if (!files.length || files.some((f) => !f)) throw new Error('请选择当前项目的原始资料。')
  const sources: NonNullable<AgentRun['reviewContext']>['sources'] = []
  const outputs: AgentArtifact[] = []
  const runId = `RUN-REVIEW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  for (const file of files) {
    progress(`读取 ${file!.name}`)
    const blob = await readProjectFile(file!)
    const raw = new File([blob], file!.name, { type: file!.mime })
    const parsed = /\.(txt|md|json|csv)$/i.test(file!.name)
      ? { passages: (await raw.text()).split(/\r?\n/).map((text, i) => ({ locator: `第 ${i + 1} 行`, text })) }
      : await parsePlanFile(raw, (text) => progress(`${file!.name} · ${text}`))
    const passages = parsed.passages.filter((p) => p.text.trim())
    const text = passages.map((p) => `${p.locator}：${p.text}`).join('\n')
    if (!text.trim()) throw new Error(`${file!.name} 没有可读取的文字，请先核对资料。`)
    if (text.length > 200000) throw new Error(`${file!.name} 内容较多，请拆分本次核查范围后运行。`)
    sources.push({ fileId: file!.id, name: file!.name, digest: file!.digest, text })
    for (const passage of passages) {
      const term = config.terms.find((term) => passage.text.toLowerCase().includes(term.toLowerCase()))
      if (!term || outputs.length >= config.maxClues) continue
      const id = `CLUE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
      outputs.push({ id, title: `${file!.name} · ${term}待核实`, kind: 'analysis-clue', status: 'pending', summary: passage.text.slice(0, 1200),
        reviewEvidence: { fileId: file!.id, locator: passage.locator, excerpt: passage.text, term }, reviewDisposition: '待核实',
        target: { label: '智能审查 / 线索核验', route: `/review-workbench?project=${project.id}&task=${task.id}&run=${runId}&clue=${id}`, recordId: id } })
    }
  }
  const fresh = requireTask(taskId)
  if (fresh.project.id !== project.id) throw new Error('任务所属项目已变化，请重新选择。')
  const at = new Date().toISOString()
  const run: AgentRun = { id: runId, agentId: 'AG02', projectId: project.id, projectName: project.name, status: 'completed', startedAt: at, completedAt: at, triggeredBy: actor, trigger: `审查任务：${task.name}`, currentStep: `${sources.length} 份资料 · ${outputs.length} 条待核实线索`,
    inputs: sources.map((s) => ({ label: s.name, version: s.digest, recordId: s.fileId })), outputs,
    reviewContext: { taskId: task.id, taskName: task.name, sources, agent: { id: agent.id, title: version.snapshot.title, version: version.version, config }, references: related.map((r) => ({ id: r!.id, title: currentVersion(r!)!.snapshot.title, version: currentVersion(r!)!.version, content: currentVersion(r!)!.snapshot.content })) } }
  useAgentRuntimeStore.setState((s) => ({ runs: [run, ...s.runs] }))
  return runId
}
export function disposeReviewClue(runId: string, clueId: string, opinion: string, actor: string, createPaper: boolean) {
  const run = useAgentRuntimeStore.getState().runs.find((r) => r.id === runId)
  const clue = run?.outputs.find((c) => c.id === clueId)
  if (!run?.reviewContext || !clue?.reviewEvidence) throw new Error('未找到该任务的审查线索。')
  const { task, project } = requireTask(run.reviewContext.taskId)
  if (project.id !== run.projectId) throw new Error('线索与当前项目归属不一致。')
  if (!opinion.trim()) throw new Error('请填写核验意见。')
  if (clue.paperId) return clue.paperId
  if (clue.reviewDisposition === '已排除') throw new Error('该线索已排除，请重新运行形成新的核验记录。')
  let paperId: string | undefined
  if (createPaper) {
    const source = run.reviewContext.sources.find((s) => s.fileId === clue.reviewEvidence!.fileId)
    const file = useProjectDocumentStore.getState().files.find((f) => f.id === source?.fileId && f.projectId === project.id)
    if (!file || file.digest !== source?.digest) throw new Error('原始文件缺失或版本变化，请重新核对资料。')
    const evidenceId = useProjectDocumentStore.getState().addEvidence({ projectId: project.id, title: `${file.name} · ${clue.reviewEvidence.locator}`, type: '审查线索核验', owner: actor, status: '已核实', capturedAt: new Date().toISOString(), sourceSystem: '智能审查', link: run.id, fileIds: [file.id], description: `${clue.reviewEvidence.excerpt}\n核验意见：${opinion}` })
    const papers = useWorkpaperStore.getState()
    paperId = papers.createPaper(project.id, task.programIds ?? [], actor, `${task.name} · 线索核查底稿`)
    papers.savePaper(paperId, { title: `${task.name} · 线索核查底稿`, type: '待判定', evidenceIds: [evidenceId], body: {
      procedure: `任务：${task.name}（${task.id}）\n核对 ${file.name} 的 ${clue.reviewEvidence.locator}，结合原件与适用标准进行人工核验。`, facts: `${clue.reviewEvidence.excerpt}\n核验意见：${opinion}`, conclusion: '待审计人员结合实际测试形成结论。', next: '补充测试过程与依据，提交底稿复核后再形成审计发现。' } }, actor)
  }
  useAgentRuntimeStore.setState((s) => ({ runs: s.runs.map((r) => r.id !== runId ? r : { ...r, outputs: r.outputs.map((c) => c.id !== clueId ? c : { ...c, status: 'draft', reviewDisposition: createPaper ? '已转底稿' : '已排除', reviewOpinion: opinion, acceptedBy: actor, acceptedAt: new Date().toISOString(), paperId }) }) }))
  return paperId
}
