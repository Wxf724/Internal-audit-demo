export type ProjectAssistKind = 'preparation' | 'paper' | 'report'
export const preparationAssistFields = { objective: '方案目标与范围', procedures: '总体方法与抽样策略', notice: '进场安排' } as const
export const paperAssistFields = { procedure: '执行程序与抽样', facts: '审计事实', conclusion: '审计结论', next: '建议及后续处理' } as const
export type PreparationAssistField = keyof typeof preparationAssistFields
export type PaperAssistField = keyof typeof paperAssistFields
export function preparationAssistField(value?: string): PreparationAssistField { return value && value in preparationAssistFields ? value as PreparationAssistField : 'procedures' }
export function paperAssistField(value?: string): PaperAssistField { return value && value in paperAssistFields ? value as PaperAssistField : 'facts' }
export interface ProjectAssistRequest { kind: ProjectAssistKind; target?: string; field?: string }
export interface ProjectAssistProps { onAssist?: (request: ProjectAssistRequest) => void }
