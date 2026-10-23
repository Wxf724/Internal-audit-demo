import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  PlayCircle,
  Search,
  Shield,
} from 'lucide-react'

import { Button } from '@/components'
import {
  agents,
  caseProfile,
  chainSteps,
  dataPackages,
  evidenceChain,
  findings,
  leadershipKpis,
  navGroups,
  reportCitations,
  reportSections,
  rules,
  sectionIconMap,
  walkthroughNodes,
  issues,
} from './mockData'
import './index.css'

type SectionId =
  | 'overview'
  | 'plan'
  | 'dispatch'
  | 'standard'
  | 'data'
  | 'review'
  | 'walkthrough'
  | 'evidence'
  | 'issues'
  | 'report'

function tagTone(value: string) {
  if (value.includes('重大') || value.includes('异常') || value.includes('整改中')) return 'tag-danger'
  if (value.includes('重要') || value.includes('关注') || value.includes('待')) return 'tag-warn'
  if (value.includes('通过') || value.includes('完成') || value.includes('归档') || value.includes('确认')) return 'tag-success'
  return 'tag-info'
}

function StatusTag({ children }: { children: string }) {
  return <span className={`tag ${tagTone(children)}`}>{children}</span>
}

function exportWord() {
  const html = buildReportHtml()
  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '采购围标风险专项检查报告.doc'
  link.click()
  URL.revokeObjectURL(url)
}

function exportPdf() {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(buildReportHtml(true))
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 260)
}

function buildReportHtml(print = false) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>采购围标风险专项检查报告</title>
      <style>
        body{font-family:"Microsoft YaHei",Arial,sans-serif;color:#1f2937;line-height:1.8;padding:36px;}
        h1{font-size:24px;color:#0b1f43;margin:0 0 8px;}
        h2{font-size:17px;color:#0f3f9e;margin-top:24px;border-bottom:1px solid #dbe6f5;padding-bottom:6px;}
        table{border-collapse:collapse;width:100%;margin-top:10px;font-size:13px;}
        th,td{border:1px solid #dbe6f5;padding:8px;text-align:left;vertical-align:top;}
        th{background:#f3f7ff;color:#334155;}
        .meta{color:#607089;font-size:13px;margin-bottom:18px;}
        .risk{color:#b91c1c;font-weight:700;}
        @media print{body{padding:20mm;}button{display:none;}}
      </style>
    </head>
    <body>
      ${print ? '' : '<button onclick="window.print()">打印 / 另存为 PDF</button>'}
      <h1>采购围标风险专项检查报告</h1>
      <div class="meta">${caseProfile.unit} · ${caseProfile.taskId} · 一期拟态演示稿</div>
      <h2>一、检查结论摘要</h2>
      <p>本次检查围绕${caseProfile.object}开展，系统通过采购、合同、资金数据比对，识别出<span class="risk">三项采购围标相关风险</span>，并形成取证单、阳性底稿、问题台账和整改任务。</p>
      <h2>二、主要问题</h2>
      <table>
        <thead><tr><th>问题</th><th>等级</th><th>样本</th><th>状态</th></tr></thead>
        <tbody>${findings.map((item) => `<tr><td>${item.title}</td><td>${item.level}</td><td>${item.sample}</td><td>${item.status}</td></tr>`).join('')}</tbody>
      </table>
      <h2>三、引用依据</h2>
      <ul>${reportCitations.map((item) => `<li>${item}</li>`).join('')}</ul>
      <h2>四、整改安排</h2>
      <table>
        <thead><tr><th>整改事项</th><th>责任部门</th><th>期限</th><th>进度</th></tr></thead>
        <tbody>${issues.map((item) => `<tr><td>${item.title}</td><td>${item.owner}</td><td>${item.deadline}</td><td>${item.progress}%</td></tr>`).join('')}</tbody>
      </table>
    </body>
  </html>`
}

export default function HomePage() {
  const [active, setActive] = useState<SectionId>('overview')
  const ActiveIcon = sectionIconMap[active]

  const selectedNavLabel = useMemo(() => {
    for (const group of navGroups) {
      const hit = group.items.find((item) => item.id === active)
      if (hit) return hit.label
    }
    return '监管价值总览'
  }, [active])

  return (
    <div className="icm-shell">
      <header className="icm-topbar">
        <div className="brand-mark">IC</div>
        <div>
          <div className="brand-title">内控检查管理系统</div>
          <div className="brand-sub">内控检查全流程演示</div>
        </div>
        <div className="topbar-search">
          <Search size={16} />
          搜索任务、底稿、问题、整改、法规依据
        </div>
        <div className="topbar-pill">不接真实审批 / 接口 / 权限 · 拟态演示</div>
      </header>

      <div className="icm-layout">
        <aside className="icm-sidebar">
          <p className="side-caption">面向国资委/集团领导的监管价值视角</p>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.key}>
              <div className="nav-group-title">
                <span className="nav-key">{group.key}</span>
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    className={`nav-item ${active === item.id ? 'active' : ''}`}
                    key={item.id}
                    onClick={() => setActive(item.id as SectionId)}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
          <div className="side-note">
            一期口径：只跑内控检查主链路；穿行测试仅用于验证采购到付款流程控制点。
          </div>
        </aside>

        <main className="icm-main">
          <section className="hero-panel">
            <div>
              <div className="hero-kicker">
                <ActiveIcon size={17} />
                当前视图：{selectedNavLabel}
              </div>
              <h1 className="hero-title">{caseProfile.title}</h1>
              <p className="hero-copy">
                {caseProfile.valueLine} 一期用拟态智能体、Mock 审批节点和前端导出能力，验证客户是否采纳当前设计方向。
              </p>
              <div className="hero-actions">
                <Button type="primary" icon={<PlayCircle size={16} />} onClick={() => setActive('plan')}>
                  从计划审批开始演示
                </Button>
                <Button type="primary-soft" icon={<FileText size={16} />} onClick={() => setActive('report')}>
                  查看报告输出
                </Button>
                <Button type="danger-soft" icon={<AlertTriangle size={16} />} onClick={() => setActive('review')}>
                  聚焦风险命中
                </Button>
              </div>
            </div>
            <div className="chain-board">
              <div className="chain-title">证据链主线</div>
              <div className="chain-line">
                {chainSteps.map((step) => (
                  <button
                    className={`chain-step ${active === step.id ? 'active' : ''}`}
                    key={step.id}
                    onClick={() => setActive(step.id as SectionId)}
                  >
                    <strong>{step.label}</strong>
                    <span>{step.status}</span>
                    <b>{step.metric}</b>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="kpi-grid">
            {leadershipKpis.map((kpi) => (
              <div className={`kpi-card kpi-${kpi.tone}`} key={kpi.label}>
                <div className="kpi-value">
                  <strong>{kpi.value}</strong>
                  <span>{kpi.unit}</span>
                </div>
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-note">{kpi.note}</div>
              </div>
            ))}
          </section>

          <div className="content-grid">
            <section className="panel">
              <div className="panel-pad">
                <MainSection active={active} setActive={setActive} />
              </div>
            </section>

            <aside className="right-stack">
              <div className="mini-card">
                <h3>当前检查对象</h3>
                <p>
                  {caseProfile.unit}
                  <br />
                  {caseProfile.object}
                </p>
              </div>
              <div className="mini-card">
                <h3>检查组配置</h3>
                <p>{caseProfile.team.join(' / ')}</p>
              </div>
              <div className="mini-card">
                <h3>一期采纳判断</h3>
                <p>
                  看领导是否认可“监管价值叙事 + 业务闭环 + 简版报告输出”，再决定二期是否接入真实流程、接口和权限中心。
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

function MainSection({
  active,
  setActive,
}: {
  active: SectionId
  setActive: (active: SectionId) => void
}) {
  if (active === 'overview') {
    return (
      <>
        <PanelTitle title="监管价值总览" desc="领导视角先看风险是否被发现、证据是否闭合、整改是否可追。" />
        <div className="section-grid">
          <InfoBox label="主线任务" value={caseProfile.taskId} />
          <InfoBox label="检查单位" value={caseProfile.unit} />
          <InfoBox label="牵头部门" value={caseProfile.owner} />
          <InfoBox label="一期边界" value="拟态演示，不接真实审批、接口、权限" />
        </div>
      </>
    )
  }

  if (active === 'plan') {
    return (
      <>
        <PanelTitle title="计划编制审批" desc="党委前置校验作为一期阻断点，董事会审批仅作为预留字段展示。" />
        <table className="table">
          <tbody>
            <tr>
              <th>计划名称</th>
              <td>采购围标风险专项内控检查计划</td>
            </tr>
            <tr>
              <th>计划类型</th>
              <td>专项计划</td>
            </tr>
            <tr>
              <th>党委前置</th>
              <td>
                <StatusTag>通过</StatusTag> 已上传党委会前置研究清单与会议纪要
              </td>
            </tr>
            <tr>
              <th>分解任务</th>
              <td>检查任务、穿行测试任务、取证任务已自动生成</td>
            </tr>
          </tbody>
        </table>
      </>
    )
  }

  if (active === 'dispatch') {
    return (
      <>
        <PanelTitle title="任务派发进场" desc="先做 Mock 推荐与人工确认，展示组队、回避提示、进场资料清单。" />
        <div className="section-grid">
          <InfoBox label="检查组长" value="张衡" />
          <InfoBox label="外部专家" value="赵明（招采合规）" />
          <InfoBox label="资料清单" value="合同台账、招标文件、评分表、供应商资料、资金流水" />
          <InfoBox label="进场状态" value="已确认，数据采集需求已联动" />
        </div>
      </>
    )
  }

  if (active === 'standard') {
    return (
      <>
        <PanelTitle title="规则依据库" desc="一期把检查要点、风控规则、法规依据放在同一张规则卡里。" />
        <table className="table">
          <thead>
            <tr>
              <th>规则</th>
              <th>来源</th>
              <th>触发条件</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.source}</td>
                <td>{item.condition}</td>
                <td>{item.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  if (active === 'data') {
    return (
      <>
        <PanelTitle title="数据采集" desc="围绕检查任务准备数据包，先演示上传、补录、质量校验和下游供数。" />
        <table className="table">
          <thead>
            <tr>
              <th>数据包</th>
              <th>责任部门</th>
              <th>记录数</th>
              <th>质量</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {dataPackages.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.owner}</td>
                <td>{item.rows}</td>
                <td>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${item.quality}%` }} />
                  </div>
                </td>
                <td>
                  <StatusTag>{item.status}</StatusTag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  if (active === 'review') {
    return (
      <>
        <PanelTitle title="智能审查" desc="拟态智能体展示规则命中、置信度、证据原文和人工复核入口。" />
        <div className="section-grid">
          {agents.map((agent) => (
            <div className="info-box" key={agent.name}>
              <label>{agent.domain}域</label>
              <strong>{agent.name}</strong>
              <p className="kpi-note">
                <StatusTag>{agent.status}</StatusTag> 命中 {agent.hits} 条
              </p>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${agent.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
        <table className="table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>疑似问题</th>
              <th>等级</th>
              <th>置信度</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                  <div className="kpi-note">{item.sample}</div>
                </td>
                <td>
                  <StatusTag>{item.level}</StatusTag>
                </td>
                <td>{item.confidence}%</td>
                <td>
                  <StatusTag>{item.status}</StatusTag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  if (active === 'walkthrough') {
    return (
      <>
        <PanelTitle title="穿行测试" desc="穿行测试只验证采购到付款流程控制点，服务本次采购围标风险检查。" />
        {walkthroughNodes.map((node, index) => (
          <div className="flow-node" key={node.label}>
            <div className="flow-dot">{index + 1}</div>
            <div>
              <strong>{node.label}</strong>
              <div className="kpi-note">
                {node.owner} · {node.note}
              </div>
            </div>
            <StatusTag>{node.result}</StatusTag>
          </div>
        ))}
      </>
    )
  }

  if (active === 'evidence') {
    return (
      <>
        <PanelTitle title="底稿取证" desc="取证单、阳性底稿、问题台账必须强关联，形成可追溯证据链。" />
        <div className="evidence-list">
          {evidenceChain.map((item) => (
            <div className="evidence-item" key={item.id}>
              <StatusTag>{item.type}</StatusTag>
              <div>
                <strong>{item.title}</strong>
                <div className="kpi-note">
                  {item.id} · {item.owner}
                </div>
              </div>
              <StatusTag>{item.status}</StatusTag>
            </div>
          ))}
        </div>
      </>
    )
  }

  if (active === 'issues') {
    return (
      <>
        <PanelTitle title="问题整改" desc="问题从底稿生成，整改从问题派发，销号后回写任务关闭校验。" />
        <table className="table">
          <thead>
            <tr>
              <th>问题</th>
              <th>等级</th>
              <th>责任部门</th>
              <th>期限</th>
              <th>进度</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>
                  <StatusTag>{item.level}</StatusTag>
                </td>
                <td>{item.owner}</td>
                <td>{item.deadline}</td>
                <td>{item.progress}%</td>
                <td>
                  <StatusTag>{item.status}</StatusTag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  return (
    <>
      <PanelTitle title="报告导出" desc="一期前端生成简版 Word，并通过浏览器打印流程生成 PDF。" />
      <div className="report-preview">
        <h3>采购围标风险专项检查报告</h3>
        <p>
          系统已引用底稿、取证单、问题台账、整改任务和法规依据，形成领导可阅读的专项报告初稿。
        </p>
        <ul>
          {reportSections.map((section) => (
            <li key={section}>{section}</li>
          ))}
        </ul>
        <p>
          <strong>引用篮：</strong>
          {reportCitations.join('；')}
        </p>
      </div>
      <div className="hero-actions">
        <Button type="primary" icon={<Download size={16} />} onClick={exportWord}>
          导出 Word
        </Button>
        <Button type="info-soft" icon={<FileText size={16} />} onClick={exportPdf}>
          生成 PDF 打印稿
        </Button>
        <Button type="success-soft" icon={<CheckCircle2 size={16} />} onClick={() => setActive('overview')}>
          回到总览
        </Button>
      </div>
    </>
  )
}

function PanelTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      <Shield size={22} color="#1a56db" />
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-box">
      <label>{label}</label>
      <strong>{value}</strong>
    </div>
  )
}
