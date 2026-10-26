import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, CircleHelp } from 'lucide-react'
import type { AuditProject } from '../data/auditProjects'

const guides: Record<string, { title: string; body: string; steps: string[]; next: string; link: string; help: string }> = {
 overview: {title:'从当前待办开始',body:'查看项目范围与进度，再进入对应环节办理。计划来源可以跨年度、多项承接。',steps:['方案批准','程序执行与取证','发现确认与报告','整改验证与归档'],next:'查看方案与分工',link:'preparation',help:'审批中的事项到审核待办办理。报告签发、整改销号、档案归集分别记录，不要求同时完成。'},
 preparation:{title:'先明确查什么、由谁查、依据什么查',body:'填写方案和通知，建立审计程序并分配执行人、复核人，再提交方案审核。',steps:['明确目标和范围','配置程序与人员','记录通知送达','提交方案审核'],next:'查看程序与任务',link:'execution',help:'目标、方法和进场安排旁都有“AI 生成 / 建议 / 修改”入口，可先预览演示初稿。你仍需确认抽样口径、人员和期限。批准后修改方案应发起变更。'},
 execution:{title:'按程序组织任务，留下证据和底稿',body:'执行任务管负责人、期限和交付；资料与取证管原件；底稿与复核记录测试过程和结论。',steps:['选程序、安排任务','收资料、登记证据','编底稿、引用证据','复核后形成发现'],next:'查看发现与沟通',link:'findings',help:'先在“程序与任务”选程序并编制底稿。底稿各字段旁有 AI 演示入口，生成时使用当前程序或所选证据；未核实内容不会自动认定为事实。'},
 findings:{title:'把审计发现核实清楚，再定级派发整改',body:'完善事实、依据、根因、影响和建议，登记被审计单位反馈，再提交定级审核。',steps:['完善发现要素','沟通并处理意见','确认与定级','形成整改事项'],next:'编制审计报告',link:'report',help:'问题来自已复核底稿。沟通记录是实际反馈的留痕；定级通过才形成整改。结论、等级和异议处理由审核人员决定。'},
 report:{title:'按章节编制，复核后签发',body:'每个章节旁都有辅助入口：先保存当前编辑，再整理草稿，核对后写入当前章节。',steps:['编写五个章节','登记征求意见','提交报告复核','填写意见并签发'],next:'查看结项归档条件',link:'archive',help:'每节的“AI 生成 / 建议 / 修改”只处理选中的章节。采用前可对照原文和来源；签发后保留固定版本。整改结果报告在整改事项中单独办理。'},
 rectification:{title:'围绕措施和效果验证办理整改',body:'确认整改责任、措施、期限和验收标准，提交佐证，经复核后销号。',steps:['编制整改方案','落实措施和佐证','核验整改效果','销号或退回补充'],next:'查看项目档案',link:'archive',help:'选择整改事项后，逐项关联实际上传的佐证文件。项目已经签发或归档，未完成整改仍可继续办理。销号须填写效果验证意见。'},
 archive:{title:'核对成果完整性，冻结审计档案',body:'补齐清单中的材料，说明未完成整改的跟踪安排，再提交归档审核。',steps:['核对六类归档条件','说明后续跟踪责任','提交归档审核','导出快照与原件'],next:'继续跟踪整改',link:'rectification',help:'清单根据当前业务记录检查，不自动补造材料。归档后保存固定快照，后续整改不改写已归档成果。'},
}
export function ProjectStageGuide({tab,project}:{tab:string;project:AuditProject}) {
 const {search}=useLocation(), guide=guides[tab] ?? guides.overview
 const href=(target:string) => {const p=new URLSearchParams(search);p.set('tab',target);p.delete('section');return '/projects/'+project.id+'?'+p}
 return <section className="project-stage-guide" aria-label="本环节办理指引"><div className="project-stage-guide-main"><div><strong>{guide.title}</strong><p>{guide.body}</p></div><Link to={href(guide.link)}>{guide.next}<ArrowRight size={14}/></Link></div><ol>{guide.steps.map((s,i)=><li key={s}><span>{i+1}</span>{s}</li>)}</ol><details><summary><CircleHelp size={14}/>怎么使用本环节</summary><p>{guide.help}</p>{['preparation','execution','report'].includes(tab) && <p className="project-assist-availability"><b>能力状态：</b>本地演示，不外发。模板生成初稿、规则检查缺项、格式修改文本；不调用 AI 模型。结果核对后采纳，不自动批准或签发。</p>}</details></section>
}

