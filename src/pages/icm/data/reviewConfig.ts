export interface ReviewConfig { terms: string[]; maxClues: number }
export const defaultReviewConfig: ReviewConfig = { terms: ['缺少', '未审批', '无审批', '未授权', '不一致', '逾期', '重复', '异常'], maxClues: 30 }
export function validateReviewConfig(config: ReviewConfig) {
  if (!config.terms.length || config.terms.length > 40 || config.terms.some((t) => !t.trim() || t.length > 30)) throw new Error('请填写 1—40 个关注词，每词不超过 30 字。')
  if (!Number.isInteger(config.maxClues) || config.maxClues < 1 || config.maxClues > 100) throw new Error('单次线索上限应为 1—100 的整数。')
}
