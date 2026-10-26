import { ChartGantt, List } from 'lucide-react'
import './conversation.css'

export function PlanViewSwitch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="annual-view-pair" role="group" aria-label="项目展示方式">
    <button type="button" aria-pressed={value === 'list'} onClick={() => onChange('list')}><List size={14} />列表</button>
    <button type="button" aria-pressed={value === 'gantt'} onClick={() => onChange('gantt')}><ChartGantt size={14} />甘特图</button>
  </div>
}
