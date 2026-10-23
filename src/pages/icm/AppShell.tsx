import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Landmark, UserRound } from 'lucide-react'

import { defaultRoute, getRouteMeta, icmRoutes } from './routeMeta'
import './AppShell.css'

const controlPaths = ['/plan-workbench', '/task-center', '/dispatch-center', '/data-collect', '/review-workbench', '/walkthrough-workbench', '/workpaper', '/evidence', '/issues', '/rectify']
const centerPaths = ['/audit-center', '/report']
const knowledgePaths = ['/knowledge-base', '/standard-library']
const topNav = [
  { key: 'home', title: '首页', path: '/workplace', paths: ['/workplace'] },
  { key: 'control', title: '内控管理', path: '/plan-workbench', paths: controlPaths },
  { key: 'center', title: '内控中心', path: '/audit-center', paths: centerPaths },
  { key: 'knowledge', title: '知识库管理', path: '/knowledge-base', paths: knowledgePaths },
  { key: 'cockpit', title: '监督看板', path: '/cockpit', paths: ['/cockpit'] },
]

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [planExpanded, setPlanExpanded] = useState(true)
  const [dataExpanded, setDataExpanded] = useState(true)
  const [reviewExpanded, setReviewExpanded] = useState(true)
  const [workpaperExpanded, setWorkpaperExpanded] = useState(true)
  const currentPath = location.pathname === '/' ? defaultRoute : location.pathname
  const meta = getRouteMeta(currentPath)
  const activeTop = topNav.find((item) => item.paths.includes(currentPath))
  const sideRoutes = activeTop?.key === 'control' || activeTop?.key === 'center' || activeTop?.key === 'knowledge'
    ? icmRoutes.filter((route) => activeTop.paths.includes(route.path))
    : []
  const showSideNav = sideRoutes.length > 0
  const range = new URLSearchParams(location.search).get('range') ?? '6m'
  const view = new URLSearchParams(location.search).get('view')
  const isPlanView = (target: string) => currentPath === '/plan-workbench' && view === target
  const isDataView = (target: string) => currentPath === '/data-collect' && (view ?? 'demands') === target
  const isReviewView = (target: string) => currentPath === '/review-workbench' && (view ?? 'execute') === target

  return (
    <div className={'icm-app ' + (collapsed ? 'side-collapsed ' : '') + (showSideNav ? '' : 'no-side-nav')}>
      <header className="icm-top">
        <div className="icm-brand"><div className="icm-brand-mark" aria-hidden="true"><Landmark size={19} /></div><div><div className="icm-brand-title">内控检查管理系统</div><div className="icm-brand-sub">内部控制监督工作平台</div></div></div>
        <nav className="icm-top-nav" aria-label="主导航">
          {topNav.map((item) => <NavLink className={() => `icm-top-nav-link ${item.paths.includes(currentPath) ? 'active' : ''}`} key={item.key} to={item.path}>{item.title}</NavLink>)}
        </nav>
        <div className="icm-top-actions"><span className="icm-badge">待处理 6</span><button className="icm-top-icon" type="button" aria-label="查看待办通知" title="待办通知"><Bell size={17} /></button><span className="icm-user"><span className="icm-user-avatar"><UserRound size={16} /></span><span><b>系统管理员</b><em>内控监督部</em></span></span></div>
      </header>

      <div className="icm-body">
        {showSideNav ? <aside className="icm-side-nav">
          <button className="icm-side-collapse-btn" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? '展开菜单' : '折叠菜单'} title={collapsed ? '展开菜单' : '折叠菜单'}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
          <div className="icm-side-section">
            {sideRoutes.map((route) => {
              if (['/walkthrough-workbench', '/evidence', '/issues'].includes(route.path)) return null
              const Icon = route.icon
              const isPlan = route.path === '/plan-workbench'
              const isData = route.path === '/data-collect'
              const isReview = route.path === '/review-workbench'
              const isWorkpaper = route.path === '/workpaper'
              const isGroup = isPlan || isData || isReview || isWorkpaper
              const expanded = isPlan ? planExpanded : isData ? dataExpanded : isReview ? reviewExpanded : workpaperExpanded
              const toggle = isPlan ? () => setPlanExpanded((value) => !value) : isData ? () => setDataExpanded((value) => !value) : isReview ? () => setReviewExpanded((value) => !value) : () => setWorkpaperExpanded((value) => !value)
              return <div className={`icm-side-menu-item ${isGroup ? 'plan-group' : ''}`} key={route.path}>
                {isGroup ? <button aria-label={route.title} className="icm-side-link icm-side-plan-toggle" data-tooltip={route.title} title={route.title} type="button" onClick={toggle}><Icon size={17} /><span>{route.title}</span><ChevronDown className={`icm-side-menu-arrow ${expanded ? 'active' : ''}`} size={14} /></button> : <NavLink aria-label={route.title} className={({ isActive }) => `icm-side-link ${isActive ? 'active' : ''}`} data-tooltip={route.title} title={route.title} to={route.path}><Icon size={17} /><span>{route.title}</span></NavLink>}
                {isPlan && planExpanded ? <div className="icm-side-submenu"><NavLink className={() => isPlanView('create') ? 'active' : ''} to="/plan-workbench?view=create">新建检查计划</NavLink><NavLink className={() => isPlanView('approve') ? 'active' : ''} to="/plan-workbench?view=approve">计划审批</NavLink><NavLink className={() => isPlanView('split') ? 'active' : ''} to="/plan-workbench?view=split">计划分解</NavLink></div> : null}
                {isData && dataExpanded ? <div className="icm-side-submenu"><NavLink className={() => isDataView('demands') ? 'active' : ''} to="/data-collect?view=demands">数据需求与文件</NavLink><NavLink className={() => isDataView('materials') ? 'active' : ''} to="/data-collect?view=materials">材料清单</NavLink><NavLink className={() => isDataView('packages') ? 'active' : ''} to="/data-collect?view=packages">数据包管理</NavLink><NavLink className={() => isDataView('quality') ? 'active' : ''} to="/data-collect?view=quality">质量校验</NavLink></div> : null}
                {isReview && reviewExpanded ? <div className="icm-side-submenu"><NavLink className={() => isReviewView('execute') ? 'active' : ''} to="/review-workbench?view=execute">执行审查</NavLink><NavLink className={() => isReviewView('agents') ? 'active' : ''} to="/review-workbench?view=agents">智能体配置</NavLink><NavLink className={() => isReviewView('results') ? 'active' : ''} to="/review-workbench?view=results">审查结果</NavLink></div> : null}
                {isWorkpaper && workpaperExpanded ? <div className="icm-side-submenu"><NavLink className={() => currentPath === '/workpaper' ? 'active' : ''} to="/workpaper">审查记录</NavLink><NavLink className={() => currentPath === '/walkthrough-workbench' ? 'active' : ''} to="/walkthrough-workbench">穿行测试</NavLink><NavLink className={() => currentPath === '/evidence' ? 'active' : ''} to="/evidence">取证台账</NavLink><NavLink className={() => currentPath === '/issues' ? 'active' : ''} to="/issues">问题台账</NavLink></div> : null}
              </div>
            })}
          </div>
          <div className="icm-side-current"><span>{activeTop?.title}</span><ChevronRight size={14} /><strong>{meta.title}</strong></div>
        </aside> : null}
        <main className={currentPath === '/cockpit' ? 'icm-main-no-scroll' : 'icm-main'}><Outlet /></main>
      </div>

      <footer className="icm-foot"><span>当前系统：内控检查管理系统</span><span>·</span><span>覆盖计划、采集、审查、底稿、整改与报告</span><span className="icm-foot-spacer" />{currentPath === '/cockpit' ? <span className="icm-foot-range">{[['12m', '一年'], ['6m', '6个月'], ['3m', '三个月'], ['1m', '一个月']].map(([key, label]) => <button className={range === key ? 'active' : ''} key={key} type="button" onClick={() => navigate(`/cockpit?range=${key}`)}>{label}</button>)}</span> : null}<span className="icm-dot" /><span>流程运行中</span></footer>
    </div>
  )
}
