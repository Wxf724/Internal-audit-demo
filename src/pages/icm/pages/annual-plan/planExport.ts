import type { AnnualPlan, PlanContent } from './model'
import type { PlanResource } from './conversationTypes'
import { downloadBlob } from './planFiles'

export async function exportPlan(plan: AnnualPlan, content: PlanContent, sources: PlanResource[], format: 'xlsx' | 'docx') {
  const title = `${content.name}-${plan.status}`
  const rows = content.items.map((item) => ({ 项目名称: item.name, 审计对象: item.subject, 类型: item.type, 审计覆盖期间: item.period, 开始日期: item.start, 结束日期: item.end, 人天: item.workdays, 优先级: item.priority ?? '中', 牵头部门或团队: item.owner, 资源需求: item.resourceNeeds ?? '', 目标与范围: item.scope, 风险主题: item.risk, 项目来源: item.source ?? '', 编制依据: (item.basisRefs ?? []).map((id) => sources.find((s) => s.id === id)?.name ?? id).join('；') }))
  if (format === 'xlsx') {
    const xlsx = await import('xlsx'), workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(rows), '项目清单')
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet([{ 年度目标: content.objective, 编制依据: content.basis, 后续审计安排: content.followUp ?? '', 资源安排: content.resourceStrategy ?? '', 可用人天: content.capacity, 批准主体: content.approvalAuthority ?? '', 审议程序依据: content.governanceBasis ?? '', 状态: plan.status }]), '计划说明')
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(sources.map((r) => ({ 资料编号: r.id, 名称: r.name, 版本: r.version, 来源: r.source, 定位: r.locator ?? '', 原文件编号: r.fileId ?? '' }))), '依据与附件清单')
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet((content.deferred ?? []).map((r) => ({ 风险编号: r.riskId, 暂缓理由: r.reason }))), '暂缓事项')
    downloadBlob(new Blob([xlsx.write(workbook, { bookType: 'xlsx', type: 'array' })]), `${title}.xlsx`)
  } else {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } = await import('docx')
    const paragraph = (text: string) => new Paragraph({ children: [new TextRun({ text, font: '微软雅黑', size: 22 })], spacing: { after: 120 } })
    const document = new Document({ sections: [{ children: [new Paragraph({ text: content.name, heading: HeadingLevel.TITLE }), paragraph(`${plan.year} 年度 · ${plan.status} · 编制机构：${content.department}`), ...[['年度审计目标', content.objective], ['编制依据', content.basis], ['后续审计安排', content.followUp ?? '待补充'], ['资源安排', content.resourceStrategy ?? '待补充'], ['批准主体与程序依据', `${content.approvalAuthority ?? '待确认'}；${content.governanceBasis ?? '待确认'}`]].flatMap(([label, value]) => [new Paragraph({ text: label, heading: HeadingLevel.HEADING_1 }), paragraph(value)]), new Paragraph({ text: '审计项目安排', heading: HeadingLevel.HEADING_1 }), ...rows.flatMap((row, i) => [new Paragraph({ text: `${i + 1}. ${row.项目名称}`, heading: HeadingLevel.HEADING_2 }), ...Object.entries(row).filter(([key]) => key !== '项目名称').map(([key, value]) => paragraph(`${key}：${value}`))]), new Paragraph({ text: '依据与附件清单', heading: HeadingLevel.HEADING_1 }), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: ['资料', '版本 / 来源 / 定位'].map((v) => new TableCell({ children: [paragraph(v)] })) }), ...sources.map((r) => new TableRow({ children: [r.name, `${r.version} · ${r.source} · ${r.locator ?? '摘要'}`].map((v) => new TableCell({ children: [paragraph(v)] })) }))] }), new Paragraph({ text: '暂缓事项', heading: HeadingLevel.HEADING_1 }), ...(content.deferred?.length ? content.deferred.map((entry) => paragraph(`${entry.riskId}：${entry.reason}`)) : [paragraph('无')])] }] })
    downloadBlob(await Packer.toBlob(document), `${title}.docx`)
  }
}
