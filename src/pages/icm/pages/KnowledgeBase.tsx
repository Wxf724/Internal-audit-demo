import { useState, type ReactNode } from 'react'
import { ArrowLeft, ClipboardList, FileInput, Gavel, ShieldAlert, X } from 'lucide-react'
import { toast } from '@heroui/react'

import { Input } from '@/components'
import { Button, Card, DataTable, DetailLine, PageFrame, StepList, Tag, Toolbar, type Tone } from '../components/IcmPageKit'
import { knowledge, toneByStatus } from '../data'

type AssetKey = 'case' | 'template' | 'method' | 'clause'

type CaseItem = (typeof knowledge.cases)[number]
type TemplateItem = (typeof knowledge.templates)[number]
type MethodItem = (typeof knowledge.methods)[number]
type ClauseItem = (typeof knowledge.clauses)[number]

const assets: Array<{ key: AssetKey; title: string; text: string; icon: ReactNode }> = [
  { key: 'case', title: '检查案例库', text: '底稿/问题回流，一键生成案例，配置相似案例匹配', icon: <ShieldAlert size={16} /> },
  { key: 'template', title: '制度模板库', text: '制度模板上传、版本管理、下载复用', icon: <FileInput size={16} /> },
  { key: 'method', title: '检查方法库', text: '检查程序、适用场景、输出物和模板绑定', icon: <ClipboardList size={16} /> },
  { key: 'clause', title: '法规依据库', text: '法规条款结构化、版本时效管理，供审查与报告引用', icon: <Gavel size={16} /> },
]

const emptyCaseForm = { title: '', level: '重要', sourceModule: '检查底稿', riskType: '', issuePattern: '', result: '', generatedMethod: '', tags: '', use: '' }
const emptyTemplateForm = { name: '', type: '检查方案', version: 'V2026.07', domain: '', bindClause: '', reuse: '' }
const emptyMethodForm = { name: '', scenario: '', steps: '', output: '', bindTemplate: '' }
const emptyClauseForm = { title: '', status: '有效', domain: '', issuer: '', clauseNo: '', effectiveDate: '', version: 'V2026.07', structureStatus: '待复核', summary: '' }

export default function KnowledgeBase() {
  const [active, setActive] = useState<AssetKey>('case')
  const [query, setQuery] = useState('')

  const [caseList, setCaseList] = useState<CaseItem[]>(knowledge.cases)
  const [templateList, setTemplateList] = useState<TemplateItem[]>(knowledge.templates)
  const [methodList, setMethodList] = useState<MethodItem[]>(knowledge.methods)
  const [clauseList, setClauseList] = useState<ClauseItem[]>(knowledge.clauses)

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [detailType, setDetailType] = useState<AssetKey>('case')
  const [detailId, setDetailId] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [maskConfirmed, setMaskConfirmed] = useState(false)
  const [caseForm, setCaseForm] = useState(emptyCaseForm)
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm)
  const [methodForm, setMethodForm] = useState(emptyMethodForm)
  const [clauseForm, setClauseForm] = useState(emptyClauseForm)

  const filteredCases = caseList.filter((item) => `${item.title}${item.riskType}${item.issuePattern}${item.tags.join('')}`.includes(query.trim()))
  const filteredTemplates = templateList.filter((item) => `${item.name}${item.type}${item.domain}${item.reuse}`.includes(query.trim()))
  const filteredMethods = methodList.filter((item) => `${item.name}${item.scenario}${item.output}`.includes(query.trim()))
  const filteredClauses = clauseList.filter((item) => `${item.title}${item.domain}${item.summary}`.includes(query.trim()))

  function navigateTo(type: AssetKey, id?: string) {
    if (!id) return
    setActive(type)
    setDetailType(type)
    setDetailId(id)
    setViewMode('detail')
  }

  function backToList() {
    setViewMode('list')
    setDetailId(null)
  }

  function openAdd(type: AssetKey) {
    setActive(type)
    setMaskConfirmed(false)
    if (type === 'case') setCaseForm({ ...emptyCaseForm, generatedMethod: methodList[0]?.name ?? '' })
    if (type === 'template') setTemplateForm({ ...emptyTemplateForm, bindClause: clauseList[0]?.id ?? '' })
    if (type === 'method') setMethodForm({ ...emptyMethodForm, bindTemplate: templateList[0]?.id ?? '' })
    if (type === 'clause') setClauseForm(emptyClauseForm)
    setAddOpen(true)
  }

  function submitAdd() {
    if (active === 'case') {
      if (!caseForm.title.trim() || !maskConfirmed) return
      const id = `CASE-NEW-${caseList.length + 1}`
      setCaseList((list) => [
        { id, title: caseForm.title, level: caseForm.level, sourceModule: caseForm.sourceModule, riskType: caseForm.riskType, issuePattern: caseForm.issuePattern, result: caseForm.result, generatedMethod: caseForm.generatedMethod, use: caseForm.use, tags: caseForm.tags.split(/[,，\s]+/).filter(Boolean) },
        ...list,
      ])
      toast.success('案例已脱敏并沉淀入库')
    }
    if (active === 'template') {
      if (!templateForm.name.trim()) return
      const id = `TPL-NEW-${templateList.length + 1}`
      setTemplateList((list) => [{ id, name: templateForm.name, type: templateForm.type, version: templateForm.version, domain: templateForm.domain, bindClause: templateForm.bindClause, reuse: templateForm.reuse }, ...list])
      toast.success('模板已上传入库')
    }
    if (active === 'method') {
      if (!methodForm.name.trim()) return
      const id = `MTH-NEW-${methodList.length + 1}`
      setMethodList((list) => [{ id, name: methodForm.name, scenario: methodForm.scenario, steps: methodForm.steps, output: methodForm.output, bindTemplate: methodForm.bindTemplate }, ...list])
      toast.success('检查方法已入库')
    }
    if (active === 'clause') {
      if (!clauseForm.title.trim()) return
      const id = `LAW-NEW-${clauseList.length + 1}`
      setClauseList((list) => [{ id, title: clauseForm.title, status: clauseForm.status, domain: clauseForm.domain, citationId: id, issuer: clauseForm.issuer, clauseNo: clauseForm.clauseNo, effectiveDate: clauseForm.effectiveDate, version: clauseForm.version, structureStatus: clauseForm.structureStatus, summary: clauseForm.summary, syncTarget: [] }, ...list])
      toast.success('法规条款已录入')
    }
    setAddOpen(false)
  }

  // Resolve detail item
  const detailItem =
    detailType === 'case' ? caseList.find((c) => c.id === detailId)
    : detailType === 'template' ? templateList.find((t) => t.id === detailId)
    : detailType === 'method' ? methodList.find((m) => m.id === detailId)
    : detailType === 'clause' ? clauseList.find((c) => c.id === detailId)
    : undefined

  const detailLabel =
    detailType === 'case' ? '检查案例'
    : detailType === 'template' ? '制度模板'
    : detailType === 'method' ? '检查方法'
    : '法规条款'

  // ──── LIST VIEW ────
  const renderList = () => {
    const renderMain = () => {
      if (active === 'case') {
        return (
          <Card title="检查案例库" note="各业务模块回流底稿和问题，一键沉淀同类案例" action={<Button type="info-soft" size="sm" onClick={() => openAdd('case')}>生成案例</Button>}>
            <DataTable
              columns={['案例', '风险类型', '问题表现', '结果', '方法', '操作']}
              rows={filteredCases.map((item) => [
                <div className="icm-link" style={{ cursor: 'pointer' }} key={item.id}>
                  <div className="icm-list-title">{item.title}</div>
                  <div className="icm-list-meta">{item.sourceModule} · {item.tags.join(' / ')}</div>
                </div>,
                <Tag tone={toneByStatus(item.level) as Tone} key="level">{item.riskType}</Tag>,
                item.issuePattern,
                item.result,
                item.generatedMethod,
                <Button type="default-soft" size="sm" key="detail" onClick={(e) => { e.stopPropagation(); navigateTo('case', item.id) }}>详情</Button>,
              ])}
              onRowClick={(i) => navigateTo('case', filteredCases[i].id)}
            />
          </Card>
        )
      }

      if (active === 'template') {
        return (
          <Card title="制度模板库" note="模板上传、版本管理、下载复用" action={<Button type="info-soft" size="sm" onClick={() => openAdd('template')}>上传模板</Button>}>
            <DataTable
              columns={['模板', '类型', '版本', '领域', '绑定依据', '复用模块', '操作']}
              rows={filteredTemplates.map((item) => [
                <span className="icm-link" style={{ cursor: 'pointer' }} key={item.id}>{item.name}</span>,
                item.type,
                item.version,
                item.domain,
                item.bindClause,
                item.reuse,
                <Button type="default-soft" size="sm" key="detail" onClick={(e) => { e.stopPropagation(); navigateTo('template', item.id) }}>详情</Button>,
              ])}
              onRowClick={(i) => navigateTo('template', filteredTemplates[i].id)}
            />
          </Card>
        )
      }

      if (active === 'method') {
        return (
          <Card title="检查方法库" note="检查方法与模板、法规、案例组合使用" action={<Button type="info-soft" size="sm" onClick={() => openAdd('method')}>新增方法</Button>}>
            <DataTable
              columns={['方法', '适用场景', '步骤', '输出', '绑定模板', '操作']}
              rows={filteredMethods.map((item) => [
                <span className="icm-link" style={{ cursor: 'pointer' }} key={item.id}>{item.name}</span>,
                item.scenario,
                item.steps,
                item.output,
                item.bindTemplate,
                <Button type="default-soft" size="sm" key="detail" onClick={(e) => { e.stopPropagation(); navigateTo('method', item.id) }}>详情</Button>,
              ])}
              onRowClick={(i) => navigateTo('method', filteredMethods[i].id)}
            />
          </Card>
        )
      }

      if (active === 'clause') {
        return (
          <Card title="法规依据库" note="法规条款结构化、版本时效管理，供智能审查与报告引用" action={<Button type="info-soft" size="sm" onClick={() => openAdd('clause')}>录入法规</Button>}>
            <DataTable
              columns={['条款', '领域', '状态', '版本', '结构化状态', '生效日期', '操作']}
              rows={filteredClauses.map((item) => [
                <div className="icm-link" style={{ cursor: 'pointer' }} key={item.id}>
                  <div className="icm-list-title">{item.title}</div>
                  <div className="icm-list-meta">{item.issuer} · {item.clauseNo}</div>
                </div>,
                item.domain,
                <Tag tone={item.status === '有效' ? 'green' : item.status === '即将失效' ? 'amber' : 'gray'} key="status">{item.status}</Tag>,
                item.version,
                item.structureStatus,
                item.effectiveDate,
                <Button type="default-soft" size="sm" key="detail" onClick={(e) => { e.stopPropagation(); navigateTo('clause', item.id) }}>详情</Button>,
              ])}
              onRowClick={(i) => navigateTo('clause', filteredClauses[i].id)}
            />
          </Card>
        )
      }

      return null
    }

    return (
      <PageFrame
        title="知识库管理"
        subtitle="一期聚焦案例、制度模板、检查方法与法规依据的结构化维护与交叉引用。"
      >
        <Toolbar>
          <Input search className="min-w-[320px]" value={query} onChange={setQuery} placeholder="检索案例、模板、检查方法、法规" />
        </Toolbar>

        <div className="icm-grid" style={{ gridTemplateColumns: '260px minmax(0,1fr)' }}>
          <aside className="icm-admin-nav">
            <div className="icm-admin-nav-sub">选择资产类型后在中间维护数据</div>
            <div className="icm-admin-nav-list">
              {assets.map((item) => (
                <button className={active === item.key ? 'active' : ''} key={item.key} onClick={() => setActive(item.key)}>
                  {item.icon}
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="icm-grid">
            {renderMain()}
          </div>
        </div>

        {/* Add-entry modal — unchanged */}
        {addOpen ? (
          <div className="icm-modal-mask" role="dialog" aria-modal="true">
            <div className="icm-modal icm-modal-small">
              <div className="icm-modal-head">
                <div>
                  <div className="icm-modal-title">
                    {active === 'case' ? '生成案例' : active === 'template' ? '上传制度模板' : active === 'method' ? '新增检查方法' : '录入法规条款'}
                  </div>
                  <div className="icm-modal-sub">
                    {active === 'case' ? '底稿/问题回流沉淀，入库前须完成脱敏确认' : active === 'template' ? '上传模板并绑定法规依据' : active === 'method' ? '定义检查步骤并绑定输出模板' : '结构化录入法规条款，供智能审查引用'}
                  </div>
                </div>
                <button className="icm-modal-close" type="button" onClick={() => setAddOpen(false)} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: '14px 18px', display: 'grid', gap: 12, maxHeight: '60vh', overflow: 'auto' }}>
                {active === 'case' ? (
                  <>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      案例标题 <span style={{ color: '#b91c1c' }}>*</span>
                      <input className="icm-input" style={{ width: '100%' }} value={caseForm.title} onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })} placeholder="例：某二级企业拆分合同规避招标案例" />
                    </label>
                    <div className="icm-grid cols-2">
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        风险定级
                        <select className="icm-select" style={{ width: '100%' }} value={caseForm.level} onChange={(e) => setCaseForm({ ...caseForm, level: e.target.value })}>
                          <option>重大</option><option>重要</option><option>一般</option>
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        来源模块
                        <select className="icm-select" style={{ width: '100%' }} value={caseForm.sourceModule} onChange={(e) => setCaseForm({ ...caseForm, sourceModule: e.target.value })}>
                          <option>检查底稿</option><option>取证单台账</option><option>问题台账</option><option>整改闭环</option>
                        </select>
                      </label>
                    </div>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      风险类型
                      <input className="icm-input" style={{ width: '100%' }} value={caseForm.riskType} onChange={(e) => setCaseForm({ ...caseForm, riskType: e.target.value })} placeholder="例：拆分采购" />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      问题表现
                      <textarea className="icm-input" style={{ width: '100%', height: 'auto', minHeight: 64, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }} value={caseForm.issuePattern} onChange={(e) => setCaseForm({ ...caseForm, issuePattern: e.target.value })} placeholder="脱敏后的问题表现描述" />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      处理结果
                      <textarea className="icm-input" style={{ width: '100%', height: 'auto', minHeight: 56, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }} value={caseForm.result} onChange={(e) => setCaseForm({ ...caseForm, result: e.target.value })} />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      关联检查方法
                      <select className="icm-select" style={{ width: '100%' }} value={caseForm.generatedMethod} onChange={(e) => setCaseForm({ ...caseForm, generatedMethod: e.target.value })}>
                        {methodList.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      标签（逗号分隔）
                      <input className="icm-input" style={{ width: '100%' }} value={caseForm.tags} onChange={(e) => setCaseForm({ ...caseForm, tags: e.target.value })} placeholder="例：拆分采购, 招标线" />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 13, border: '1px dashed #ccd9ea', borderRadius: 8, padding: 10, background: '#f8fbff' }}>
                      <input type="checkbox" checked={maskConfirmed} onChange={(e) => setMaskConfirmed(e.target.checked)} />
                      我已确认涉及单位、金额、责任人等敏感信息已完成脱敏处理，可入库共享
                    </label>
                  </>
                ) : null}

                {active === 'template' ? (
                  <>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      模板名称 <span style={{ color: '#b91c1c' }}>*</span>
                      <input className="icm-input" style={{ width: '100%' }} value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="例：资金支付穿行测试记录模板" />
                    </label>
                    <div className="icm-grid cols-2">
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        模板类型
                        <select className="icm-select" style={{ width: '100%' }} value={templateForm.type} onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}>
                          <option>检查方案</option><option>穿行测试</option><option>取证</option><option>报告</option>
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        版本号
                        <input className="icm-input" style={{ width: '100%' }} value={templateForm.version} onChange={(e) => setTemplateForm({ ...templateForm, version: e.target.value })} />
                      </label>
                    </div>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      适用领域
                      <input className="icm-input" style={{ width: '100%' }} value={templateForm.domain} onChange={(e) => setTemplateForm({ ...templateForm, domain: e.target.value })} placeholder="例：采购 / 资金" />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      绑定法规依据
                      <select className="icm-select" style={{ width: '100%' }} value={templateForm.bindClause} onChange={(e) => setTemplateForm({ ...templateForm, bindClause: e.target.value })}>
                        {clauseList.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      复用模块
                      <input className="icm-input" style={{ width: '100%' }} value={templateForm.reuse} onChange={(e) => setTemplateForm({ ...templateForm, reuse: e.target.value })} placeholder="例：计划编制审批" />
                    </label>
                  </>
                ) : null}

                {active === 'method' ? (
                  <>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      方法名称 <span style={{ color: '#b91c1c' }}>*</span>
                      <input className="icm-input" style={{ width: '100%' }} value={methodForm.name} onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })} placeholder="例：付款比例阈值检查方法" />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      适用场景
                      <input className="icm-input" style={{ width: '100%' }} value={methodForm.scenario} onChange={(e) => setMethodForm({ ...methodForm, scenario: e.target.value })} placeholder="例：付款节点控制测试" />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      检查步骤
                      <textarea className="icm-input" style={{ width: '100%', height: 'auto', minHeight: 64, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }} value={methodForm.steps} onChange={(e) => setMethodForm({ ...methodForm, steps: e.target.value })} />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      输出物
                      <input className="icm-input" style={{ width: '100%' }} value={methodForm.output} onChange={(e) => setMethodForm({ ...methodForm, output: e.target.value })} placeholder="例：疑似问题线索 / 底稿草稿" />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      绑定输出模板
                      <select className="icm-select" style={{ width: '100%' }} value={methodForm.bindTemplate} onChange={(e) => setMethodForm({ ...methodForm, bindTemplate: e.target.value })}>
                        {templateList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </label>
                  </>
                ) : null}

                {active === 'clause' ? (
                  <>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      条款标题 <span style={{ color: '#b91c1c' }}>*</span>
                      <input className="icm-input" style={{ width: '100%' }} value={clauseForm.title} onChange={(e) => setClauseForm({ ...clauseForm, title: e.target.value })} placeholder="例：集团合同管理办法第 20 条" />
                    </label>
                    <div className="icm-grid cols-2">
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        发文单位
                        <input className="icm-input" style={{ width: '100%' }} value={clauseForm.issuer} onChange={(e) => setClauseForm({ ...clauseForm, issuer: e.target.value })} />
                      </label>
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        条款号
                        <input className="icm-input" style={{ width: '100%' }} value={clauseForm.clauseNo} onChange={(e) => setClauseForm({ ...clauseForm, clauseNo: e.target.value })} placeholder="例：第 20 条" />
                      </label>
                    </div>
                    <div className="icm-grid cols-2">
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        适用领域
                        <input className="icm-input" style={{ width: '100%' }} value={clauseForm.domain} onChange={(e) => setClauseForm({ ...clauseForm, domain: e.target.value })} placeholder="例：合同" />
                      </label>
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        生效日期
                        <input className="icm-input" type="date" style={{ width: '100%' }} value={clauseForm.effectiveDate} onChange={(e) => setClauseForm({ ...clauseForm, effectiveDate: e.target.value })} />
                      </label>
                    </div>
                    <div className="icm-grid cols-2">
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        状态
                        <select className="icm-select" style={{ width: '100%' }} value={clauseForm.status} onChange={(e) => setClauseForm({ ...clauseForm, status: e.target.value })}>
                          <option>有效</option><option>即将失效</option><option>已废止</option>
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                        结构化状态
                        <select className="icm-select" style={{ width: '100%' }} value={clauseForm.structureStatus} onChange={(e) => setClauseForm({ ...clauseForm, structureStatus: e.target.value })}>
                          <option>已结构化</option><option>待复核</option>
                        </select>
                      </label>
                    </div>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      版本号
                      <input className="icm-input" style={{ width: '100%' }} value={clauseForm.version} onChange={(e) => setClauseForm({ ...clauseForm, version: e.target.value })} />
                    </label>
                    <label style={{ display: 'grid', gap: 4, color: '#334155', fontSize: 13 }}>
                      条款摘要
                      <textarea className="icm-input" style={{ width: '100%', height: 'auto', minHeight: 64, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }} value={clauseForm.summary} onChange={(e) => setClauseForm({ ...clauseForm, summary: e.target.value })} />
                    </label>
                  </>
                ) : null}
              </div>

              <div className="icm-modal-foot">
                <span>
                  {active === 'case' ? '入库后将同步至相似案例匹配引擎' : active === 'template' ? '入库后可在计划、底稿等模块复用' : active === 'method' ? '入库后可被智能审查规则包引用' : '入库后将同步至检查标准库与智能审查引擎'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="default-soft" onClick={() => setAddOpen(false)}>取消</Button>
                  <Button type="primary" disabled={active === 'case' && !maskConfirmed} onClick={submitAdd}>确认入库</Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </PageFrame>
    )
  }

  // ──── DETAIL VIEW ────
  const renderDetail = () => {
    if (!detailItem) return renderList()

    const caseItem = detailType === 'case' ? (detailItem as CaseItem) : null
    const templateItem = detailType === 'template' ? (detailItem as TemplateItem) : null
    const methodItem = detailType === 'method' ? (detailItem as MethodItem) : null
    const clauseItem = detailType === 'clause' ? (detailItem as ClauseItem) : null

    const title = caseItem?.title ?? templateItem?.name ?? methodItem?.name ?? clauseItem?.title ?? ''
    const idVal = caseItem?.id ?? templateItem?.id ?? methodItem?.id ?? clauseItem?.id ?? ''

    // ── CLAUSE detail: two-pane document + chunks ──
    if (clauseItem) {
      const bindClauseIds = (t: TemplateItem) => (t.bindClauseIds ?? (t.bindClause ? [t.bindClause] : []))
      const boundTemplates = templateList.filter((t) => bindClauseIds(t).includes(clauseItem.id ?? ''))

      return (
        <PageFrame
          title={<Button type="default-soft" icon={<ArrowLeft size={16} />} onClick={backToList}>返回列表</Button>}
          subtitle={`${detailLabel} ${clauseItem.issuer ? '· ' + clauseItem.issuer : ''}${clauseItem.docNo ? ' · ' + clauseItem.docNo : ''}`}
        >
          <div className="icm-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 320px', alignItems: 'start' }}>
            {/* Left: document body */}
            <Card title={clauseItem.title} note={`${clauseItem.issuer} · ${clauseItem.docNo ?? ''} · ${clauseItem.clauseNo} · ${clauseItem.version}`}>
              <div className="icm-editor">
                {(clauseItem.sections ?? (clauseItem.fullText ? [{ heading: clauseItem.clauseNo ?? '条款正文', text: clauseItem.fullText }] : [])).map((s, i) => (
                  <div key={i}>
                    <h3>{s.heading}</h3>
                    <p>{s.text}</p>
                  </div>
                ))}
                {!clauseItem.sections?.length && !clauseItem.fullText ? (
                  <p style={{ color: '#748299' }}>暂无条款全文，仅有摘要如下：{clauseItem.summary}</p>
                ) : null}
              </div>
              <div className="icm-grid cols-2" style={{ marginTop: 12 }}>
                <DetailLine label="状态" value={<Tag tone={clauseItem.status === '有效' ? 'green' : clauseItem.status === '即将失效' ? 'amber' : 'gray'}>{clauseItem.status}</Tag>} />
                <DetailLine label="生效日期" value={clauseItem.effectiveDate ?? '——'} />
                <DetailLine label="结构化状态" value={clauseItem.structureStatus ?? '——'} />
                <DetailLine label="版本" value={clauseItem.version ?? '——'} />
                <DetailLine label="发文单位" value={clauseItem.issuer ?? '——'} />
                <DetailLine label="条款号" value={clauseItem.clauseNo ?? '——'} />
                <DetailLine label="领域" value={clauseItem.domain} />
                <DetailLine label="被引用检查标准" value={(clauseItem.citedByRuleIds ?? []).length ? clauseItem.citedByRuleIds!.join(' / ') : '暂无'} />
                <DetailLine
                  label="被引用模板"
                  value={
                    boundTemplates.length
                      ? boundTemplates.map((t) => (
                          <button className="icm-link" style={{ marginRight: 10 }} type="button" key={t.id} onClick={() => navigateTo('template', t.id)}>
                            {t.name}
                          </button>
                        ))
                      : '暂无'
                  }
                />
              </div>
            </Card>

            {/* Right: chunk panel */}
            <aside className="icm-chunk-panel">
              <div style={{ fontWeight: 700, color: '#0b1f43', marginBottom: 4 }}>文档切片</div>
              <div style={{ color: '#748299', fontSize: 12, marginBottom: 10 }}>基于条款全文切分，供智能审查/报告检索</div>
              <div className="icm-chunk-list">
                {(clauseItem.chunks ?? []).length ? (
                  clauseItem.chunks!.map((c) => (
                    <div className="icm-chunk-card" key={c.id}>
                      <div className="icm-chunk-card-head">
                        <span className="icm-chunk-id">{c.id}</span>
                        <Tag tone={c.score >= 90 ? 'green' : c.score >= 75 ? 'blue' : 'gray'}>{c.score}</Tag>
                      </div>
                      <p className="icm-chunk-text">{c.text}</p>
                      <div className="icm-chunk-source">来源：{c.section}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#748299', fontSize: 12, textAlign: 'center', padding: 20 }}>暂无文档切片</div>
                )}
              </div>
            </aside>
          </div>
        </PageFrame>
      )
    }

    // ── CASE detail: evidentiary basis cards ──
    if (caseItem) {
      const linkedMethod = methodList.find((m) => m.name === caseItem.generatedMethod)
      return (
        <PageFrame
          title={<Button type="default-soft" icon={<ArrowLeft size={16} />} onClick={backToList}>返回列表</Button>}
          subtitle={`${detailLabel} · ${caseItem.id}`}
        >
          <div className="icm-grid">
            <Card title="案例概况">
              <div className="icm-grid cols-2">
                <DetailLine label="风险定级" value={<Tag tone={toneByStatus(caseItem.level) as Tone}>{caseItem.level}</Tag>} />
                <DetailLine label="风险类型" value={caseItem.riskType ?? '——'} />
                <DetailLine label="来源模块" value={caseItem.sourceModule ?? '——'} />
                <DetailLine label="来源底稿" value={caseItem.sourceWorkpaperId ?? '——'} />
                <DetailLine label="来源证据" value={(caseItem.sourceEvidenceIds ?? []).length ? caseItem.sourceEvidenceIds!.join(' / ') : '——'} />
                <DetailLine label="标签" value={caseItem.tags.join(' / ')} />
              </div>
            </Card>

            <Card title="问题表现与处理结果">
              <div className="icm-editor icm-editor-compact">
                <h3>问题表现</h3>
                <p>{caseItem.issuePattern ?? '——'}</p>
                <h3>处理结果</h3>
                <p>{caseItem.result ?? '——'}</p>
                <h3>适用说明</h3>
                <p>{caseItem.use}</p>
              </div>
            </Card>

            {(caseItem.timeline ?? []).length ? (
              <Card title="处理时间线">
                <StepList steps={caseItem.timeline!.map((t) => ({ title: t.date, text: `${t.action}（${t.owner}）` }))} />
              </Card>
            ) : null}

            <Card title="依据与关联">
              <DetailLine
                label="关联方法"
                value={
                  linkedMethod ? (
                    <button className="icm-link" type="button" onClick={() => navigateTo('method', linkedMethod.id)}>
                      {linkedMethod.name}
                    </button>
                  ) : (caseItem.generatedMethod ?? '——')
                }
              />
              <DetailLine
                label="关联法规"
                value={
                  (caseItem.linkedClauseIds ?? []).length
                    ? caseItem.linkedClauseIds!.map((cid) => {
                        const cl = clauseList.find((c) => c.id === cid)
                        return cl ? (
                          <button className="icm-link" style={{ marginRight: 10 }} type="button" key={cid} onClick={() => navigateTo('clause', cid)}>
                            {cl.title}
                          </button>
                        ) : <span key={cid} style={{ marginRight: 10 }}>{cid}</span>
                      })
                    : '——'
                }
              />
              {caseItem.rectificationSummary ? (
                <DetailLine label="整改结果" value={caseItem.rectificationSummary} />
              ) : null}
            </Card>
          </div>
        </PageFrame>
      )
    }

    // ── TEMPLATE detail ──
    if (templateItem) {
      const allBindIds = templateItem.bindClauseIds ?? (templateItem.bindClause ? [templateItem.bindClause] : [])
      return (
        <PageFrame
          title={<Button type="default-soft" icon={<ArrowLeft size={16} />} onClick={backToList}>返回列表</Button>}
          subtitle={`${detailLabel} · ${templateItem.id}`}
        >
          <div className="icm-grid">
            <Card title="模板信息">
              <div className="icm-grid cols-2">
                <DetailLine label="模板类型" value={templateItem.type} />
                <DetailLine label="版本" value={templateItem.version} />
                <DetailLine label="适用领域" value={templateItem.domain} />
                <DetailLine label="受控编号" value={templateItem.docNo ?? '——'} />
                <DetailLine label="适用范围" value={templateItem.applicableScope ?? '——'} />
                <DetailLine label="复用模块" value={templateItem.reuse} />
              </div>
            </Card>

            {(templateItem.sections ?? []).length ? (
              <Card title="模板结构">
                <div className="icm-editor icm-editor-compact">
                  {templateItem.sections!.map((s, i) => (
                    <div key={i}>
                      <h3>{s.heading}</h3>
                      <p>{s.text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {(templateItem.changeLog ?? []).length ? (
              <Card title="版本变更记录">
                <StepList steps={templateItem.changeLog!.map((c) => ({ title: c.version, text: `${c.date}  ${c.note}` }))} />
              </Card>
            ) : null}

            <Card title="依据与关联">
              <DetailLine
                label="绑定法规"
                value={
                  allBindIds.length
                    ? allBindIds.map((cid) => {
                        const cl = clauseList.find((c) => c.id === cid)
                        return cl ? (
                          <button className="icm-link" style={{ marginRight: 10 }} type="button" key={cid} onClick={() => navigateTo('clause', cid)}>
                            {cl.title}
                          </button>
                        ) : <span key={cid} style={{ marginRight: 10 }}>{cid}</span>
                      })
                    : '——'
                }
              />
              <DetailLine
                label="引用方法"
                value={
                  (templateItem.usedByMethodIds ?? []).length
                    ? templateItem.usedByMethodIds!.map((mid) => {
                        const mt = methodList.find((m) => m.id === mid)
                        return mt ? (
                          <button className="icm-link" style={{ marginRight: 10 }} type="button" key={mid} onClick={() => navigateTo('method', mid)}>
                            {mt.name}
                          </button>
                        ) : <span key={mid} style={{ marginRight: 10 }}>{mid}</span>
                      })
                    : '——'
                }
              />
            </Card>
          </div>
        </PageFrame>
      )
    }

    // ── METHOD detail ──
    if (methodItem) {
      const boundTpl = templateList.find((t) => t.id === methodItem.bindTemplate)
      const stepsForList = (methodItem.procedureSteps ?? []).length
        ? methodItem.procedureSteps!.map((s) => ({ title: s.title, text: s.text }))
        : methodItem.steps
            .split(/[。；;]/)
            .filter(Boolean)
            .map((step, i) => ({ title: `步骤 ${i + 1}`, text: step.trim() }))

      return (
        <PageFrame
          title={<Button type="default-soft" icon={<ArrowLeft size={16} />} onClick={backToList}>返回列表</Button>}
          subtitle={`${detailLabel} · ${methodItem.id}`}
        >
          <div className="icm-grid">
            <Card title="方法概况">
              <div className="icm-grid cols-2">
                <DetailLine label="适用场景" value={methodItem.scenario} />
                <DetailLine label="输出物" value={methodItem.sampleOutputDesc ?? methodItem.output} />
              </div>
            </Card>

            <Card title="检查步骤">
              <StepList steps={stepsForList} />
            </Card>

            <Card title="依据与关联">
              <DetailLine
                label="绑定模板"
                value={
                  boundTpl ? (
                    <button className="icm-link" type="button" onClick={() => navigateTo('template', boundTpl.id)}>
                      {boundTpl.name}
                    </button>
                  ) : (methodItem.bindTemplate ?? '——')
                }
              />
              <DetailLine
                label="依据法规"
                value={
                  (methodItem.linkedClauseIds ?? []).length
                    ? methodItem.linkedClauseIds!.map((cid) => {
                        const cl = clauseList.find((c) => c.id === cid)
                        return cl ? (
                          <button className="icm-link" style={{ marginRight: 10 }} type="button" key={cid} onClick={() => navigateTo('clause', cid)}>
                            {cl.title}
                          </button>
                        ) : <span key={cid} style={{ marginRight: 10 }}>{cid}</span>
                      })
                    : '——'
                }
              />
              <DetailLine label="关联检查标准" value={(methodItem.linkedRuleIds ?? []).length ? methodItem.linkedRuleIds!.join(' / ') : '——'} />
              <DetailLine
                label="引用案例"
                value={
                  (methodItem.usedByCaseIds ?? []).length
                    ? methodItem.usedByCaseIds!.map((cid) => {
                        const cs = caseList.find((c) => c.id === cid)
                        return cs ? (
                          <button className="icm-link" style={{ marginRight: 10 }} type="button" key={cid} onClick={() => navigateTo('case', cid)}>
                            {cs.title}
                          </button>
                        ) : <span key={cid} style={{ marginRight: 10 }}>{cid}</span>
                      })
                    : '——'
                }
              />
            </Card>
          </div>
        </PageFrame>
      )
    }

    return null
  }

  // ──── RENDER ────
  if (viewMode === 'detail' && detailId) return renderDetail()
  return renderList()
}
