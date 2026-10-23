import { Card, DataTable, DetailLine, PageFrame, Tag, Toolbar, Button } from '../components/IcmPageKit'
import { evidences, toneByStatus } from '../data'

export default function EvidenceLedger() {
  return (
    <PageFrame title="取证单 / 工作记录台账" subtitle="证据池与补证入口，记录不可物理删除，只能作废留痕。" actions={<Button type="primary">新建取证单</Button>}>
      <Toolbar><input className="icm-input" placeholder="搜索取证编号 / 事项 / 底稿" /><select className="icm-select"><option>全部方式</option><option>调阅</option><option>系统取数</option><option>访谈</option></select></Toolbar>
      <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 30%' }}>
        <Card title="取证记录列表"><DataTable columns={['编号','方式','取证事项','经办人','关联底稿','状态']} rows={evidences.map((e)=>[e.id,e.type,e.title,e.owner,e.link,<Tag tone={toneByStatus(e.status) as any}>{e.status}</Tag>])}/></Card>
        <Card title="取证单详情"><DetailLine label="编号" value={evidences[0].id}/><DetailLine label="证据类型" value={evidences[0].type}/><DetailLine label="关联底稿" value={evidences[0].link}/><DetailLine label="业务规则" value="补证留痕、引用可追溯、作废需说明原因"/></Card>
      </div>
    </PageFrame>
  )
}
