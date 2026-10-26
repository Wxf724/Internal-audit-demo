export const resourceCategories = [
  { id: 'basis', title: '制度与依据', description: '适用条款、制度版本与引用来源', types: ['法规条款', '企业制度', '监管要求'] },
  { id: 'programs', title: '审计标准与程序', description: '风险、评价标准、程序方法与文书模板', types: ['风险控制矩阵', '审计程序', '文书模板', '抽样方法', '问题分级标准', '质量复核清单', '整改验收标准', '数据采集规范'] },
  { id: 'tools', title: '审查规则', description: '检测条件、适用范围与核查要求', types: ['检测规则', '智能体'] },
  { id: 'cases', title: '案例与经验', description: '典型发现、整改经验与误判提示', types: ['审计案例', '整改经验', '误判提示'] },
  { id: 'directory', title: '对象与人员', description: '审计对象覆盖与项目人员安排', types: ['审计对象', '人员目录'] },
] as const
export type ResourceCategory = (typeof resourceCategories)[number]['id']
export interface ResourceContent {
  reviewConfig?: import('./reviewConfig').ReviewConfig
  title: string; type: string; domain: string; summary: string; content: string
  owner: string; source: string; effectiveFrom: string; effectiveTo: string; relatedIds: string[]
}
export interface ResourceVersion { version: number; at: string; by: string; opinion: string; snapshot: ResourceContent }
export interface ResourceAsset {
  id: string; category: ResourceCategory; enabled: boolean; versions: ResourceVersion[]
  draft?: { content: ResourceContent; state: '草稿' | '待审核'; at: string; by: string }
  history: { at: string; by: string; action: string }[]
}
export interface ProjectResourceRef { resourceId: string; version: number; snapshot: ResourceContent; appliedAt: string; appliedBy: string }
export const currentVersion = (resource: ResourceAsset) => resource.versions.at(-1)
export const resourceContent = (resource: ResourceAsset) => currentVersion(resource)?.snapshot ?? resource.draft!.content
export const resourceStatus = (resource: ResourceAsset) => !resource.enabled ? '已停用' : currentVersion(resource) ? resource.draft ? '修订中' : '已发布' : resource.draft?.state ?? '草稿'
export const usableResource = (resource: ResourceAsset, today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })) => {
  const version = currentVersion(resource)
  return Boolean(resource.enabled && version && (!version.snapshot.effectiveFrom || version.snapshot.effectiveFrom <= today) && (!version.snapshot.effectiveTo || version.snapshot.effectiveTo >= today))
}
