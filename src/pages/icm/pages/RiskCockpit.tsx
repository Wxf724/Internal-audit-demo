import { Activity, BellRing, ShieldAlert, TrendingUp } from 'lucide-react'
import { Card, DataTable, Kpi, PageFrame, Tag } from '../components/IcmPageKit'

const heat = [
  ['总部', 92], ['华东', 76], ['华南', 61], ['华北', 83], ['西南', 48], ['西北', 39],
  ['能源', 86], ['制造', 72], ['建设', 67], ['物流', 58], ['服务', 44], ['其他', 31],
]

const warnings = [
  { level: '红色', title: '报价相似度异常集中出现', unit: '采购管理部', count: 8 },
  { level: '橙色', title: '同联系人供应商重复投标', unit: '供应商管理岗', count: 5 },
  { level: '黄色', title: '评审说明缺少独立评分依据', unit: '评审组织岗', count: 6 },
  { level: '蓝色', title: '付款资料归档节点滞后', unit: '财务共享中心', count: 3 },
]

function heatColor(value: number) {
  if (value >= 85) return '#b91c1c'
  if (value >= 70) return '#d97706'
  if (value >= 55) return '#0e7490'
  return '#155bd4'
}

function levelTone(level: string) {
  if (level === '红色') return 'red'
  if (level === '橙色' || level === '黄色') return 'amber'
  return 'blue'
}

export default function RiskCockpit() {
  return (
    <PageFrame
      title="风险监督看板"
      subtitle="嵌入 React 页面的 1920 大屏风格看板，突出采购围标风险、热力分布、预警和整改指标。"
    >
      <div className="icm-screen">
        <div className="icm-grid cols-4" style={{ marginBottom: 12 }}>
          <Kpi value="128" label="采购项目监测" note="覆盖 12 个单位" tone="cyan" />
          <Kpi value="21" label="采购围标风险线索" note="红色 3 条 / 橙色 8 条" tone="red" />
          <Kpi value="86%" label="证据链完整度" note="较上月 +9%" tone="green" />
          <Kpi value="71%" label="整改闭环率" note="预计 7 月达 82%" tone="amber" />
        </div>

        <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1.1fr) minmax(420px,.9fr)', marginBottom: 12 }}>
          <Card title="采购围标风险态势" note="围绕报价相似、联系人重合、陪标特征和评审记录异常">
            <div className="icm-grid cols-3">
              {[
                ['报价相似', '12', '同比 +18%', ShieldAlert],
                ['关联供应商', '7', '待业务说明', Activity],
                ['评审异常', '9', '6 项待整改', BellRing],
              ].map(([label, value, note, Icon]) => {
                const IconNode = Icon as typeof ShieldAlert
                return (
                  <div className="icm-card icm-kpi" key={label as string} style={{ background: '#0f2f52', borderColor: '#23527e' }}>
                    <IconNode size={20} color="#7dd3fc" />
                    <strong style={{ marginTop: 10, color: '#fff' }}>{value}</strong>
                    <span>{label}</span>
                    <b style={{ color: '#fbbf24' }}>{note}</b>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14 }}>
              {[
                ['采购围标综合指数', 84, '#ef4444'],
                ['供应商关联指数', 73, '#f59e0b'],
                ['评审记录完整度', 68, '#22c55e'],
                ['整改响应速度', 77, '#38bdf8'],
              ].map(([label, value, color]) => (
                <div className="bar-row" key={label as string}>
                  <span>{label}</span>
                  <div className="bar-track" style={{ background: '#12385d' }}>
                    <div className="bar-fill" style={{ width: `${value}%`, background: color as string }} />
                  </div>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </Card>

          <Card title="风险热力" note="单位与业务条线交叉热力">
            <div className="heat-grid">
              {heat.map(([name, value]) => (
                <div className="heat-cell" key={name as string} style={{ background: heatColor(value as number), opacity: 0.72 + (value as number) / 360 }}>
                  <span>{name}<br />{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) 360px' }}>
          <Card title="实时预警" note="按风险等级和责任部门滚动展示">
            <DataTable
              columns={['等级', '预警内容', '责任部门', '数量']}
              rows={warnings.map((item) => [
                <Tag tone={levelTone(item.level)}>{item.level}</Tag>,
                item.title,
                item.unit,
                item.count,
              ])}
            />
          </Card>

          <Card title="整改监督指标" note="闭环、逾期、复发和佐证质量">
            {[
              ['闭环率', 71, '#22c55e'],
              ['按期率', 82, '#38bdf8'],
              ['佐证通过率', 76, '#fbbf24'],
              ['复发压降率', 64, '#fb7185'],
            ].map(([label, value, color]) => (
              <div className="bar-row" key={label as string}>
                <span>{label}</span>
                <div className="bar-track" style={{ background: '#12385d' }}>
                  <div className="bar-fill" style={{ width: `${value}%`, background: color as string }} />
                </div>
                <b>{value}%</b>
              </div>
            ))}
          </Card>

          <Card title="领导关注" note="可作为大屏右侧摘要">
            <div className="icm-list">
              {[
                ['本周重点', '3 条红色线索集中在招采过程，建议纳入专项督办。'],
                ['风险趋势', '报价相似和供应商关联两类风险较上月升高。'],
                ['整改短板', '佐证材料一次通过率仍低于 80%，需强化模板化提交。'],
                ['报告输出', '专项报告已汇总 4 类引用数据，可提交审核。'],
              ].map(([title, text]) => (
                <div className="icm-list-row" key={title}>
                  <div>
                    <div className="icm-list-title">{title}</div>
                    <div className="icm-list-meta">{text}</div>
                  </div>
                  <TrendingUp size={17} color="#7dd3fc" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageFrame>
  )
}
