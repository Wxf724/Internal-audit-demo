import type { AuditProject } from '../../data/auditProjects'
import type { AnnualPlan, AnnualProjectItem } from './model'
import { chinaToday, dateRange, timelinePosition } from './planning'
import { linkedProjects, itemExecutionStatus } from '../projectRelations'

export function AnnualTimeline({ plan, items, projects, onSelect }: { plan: AnnualPlan; items: AnnualProjectItem[]; projects: AuditProject[]; onSelect: (id: string) => void }) {
  const today = chinaToday()
  const current = timelinePosition(today, today, plan.year)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  return <div className="annual-timeline" aria-label={`${plan.year}年度审计甘特图`}>
    <div className="annual-timeline-legend"><span><i className="annual-swatch planned" />{plan.approved ? '计划' : '草案'}</span><span><i className="annual-swatch actual" />实际</span><span><i className="annual-swatch finished" />执行结束待验收</span>{current && <span className="annual-today-label">今天 {today}</span>}</div>
    <div className="annual-timeline-scroll"><div className="annual-timeline-canvas">
      <div className="annual-timeline-header"><div>审计项目 / 实施状态</div><div className="annual-months">{months.map((month) => <span key={month}>{month}月</span>)}</div></div>
      {items.map((item) => {
        const linked = linkedProjects(plan, item, projects)
        const planned = timelinePosition(item.start, item.end, plan.year)
        const state = itemExecutionStatus(plan, item, projects)
        const done = state === '待验收'
        const overdue = Boolean(plan.approved && item.end < today && !done)
        return <div className="annual-timeline-row" key={item.id} style={{ minHeight: Math.max(76, 48 + linked.length * 14) }}>
          <button className="annual-timeline-label" onClick={() => onSelect(item.id)}><strong>{item.name}</strong><small>{state}{linked.length ? ` · ${linked.length} 个项目` : ''}{overdue ? ' · 超出计划窗口' : ''}</small></button>
          <div className="annual-track">
            <div className="annual-gridlines" aria-hidden="true">{months.map((month) => <span key={month} />)}</div>
            {current && <div className="annual-today" style={{ left: current.left }} title={`今天 ${today}`} />}
            {planned && <button className={`annual-bar planned ${!plan.approved ? 'draft' : ''}`} style={planned} onClick={() => onSelect(item.id)} aria-label={`${item.name}，计划 ${item.start} 至 ${item.end}`} title={`计划：${item.start} 至 ${item.end}`}><span>{item.start.slice(5)}—{item.end.slice(5)}</span></button>}
            {linked.map((project, index) => {
              const [start, end] = dateRange(project.actualImplementation)
              const actual = timelinePosition(start, end ?? today, plan.year)
              return actual && <button key={project.id} className={`annual-bar actual ${done ? 'finished' : ''}`} style={{ ...actual, top: 40 + index * 14, bottom: 'auto' }} onClick={() => onSelect(item.id)} aria-label={`${project.name}，实际 ${start} 至 ${end ?? today}`} title={`${project.name}：${start} 至 ${end ?? today}`} />
            })}
          </div>
        </div>
      })}
      {!items.length && <div className="icm-empty-inline">暂无项目</div>}
      <div className="annual-timeline-resource"><div title="人天按窗口月份均摊估算"><strong>计划人天（估算）</strong></div><div className="annual-months">{months.map((month) => {
        const load = items.reduce((sum, item) => { const first = Number(item.start.slice(5, 7)), last = Number(item.end.slice(5, 7)); return sum + (month >= first && month <= last ? item.workdays / (last - first + 1) : 0) }, 0)
        return <div className="annual-load" key={month}><span style={{ height: `${Math.min(36, load / 2)}px` }} /><b>{Math.round(load)}</b></div>
      })}</div></div>
    </div></div>
  </div>
}
