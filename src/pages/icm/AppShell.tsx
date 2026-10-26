/* eslint-disable react-refresh/only-export-components */
import { useRef, useState, useSyncExternalStore } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronRight, Landmark, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'

import { defaultRoute, getRouteMeta, icmRoutes } from './routeMeta'
import AuditAssistant from './assistant'
import { ProjectNavigation } from './components/ProjectNavigation'
import { MatterContextBar } from './components/MatterContextBar'
import { ResourceNavigation } from './components/ResourceNavigation'
import './pages/resources.css'
import { useAuditProjectStore } from './store/auditProjectStore'
import { useIcmPageKitStyle } from './components/IcmPageKit'
import { canSeeTopPage, rolePageRedirect } from './pageVisibility'
import './AppShell.css'

const planPaths = ['/plan-workbench']
const projectPaths = ['/projects', '/task-center', '/dispatch-center', '/data-collect', '/review-workbench', '/walkthrough-workbench', '/workpaper', '/evidence', '/issues']
const rectifyPaths = ['/rectify', '/audit-center', '/report']
const resourcePaths = ['/audit-resources', '/knowledge-base', '/standard-library']
const analyticsPaths = ['/cockpit']
const topNav = [
  { key: 'home', title: '首页', path: '/workplace', paths: ['/workplace'] },
  { key: 'plan', title: '审计计划', path: '/plan-workbench', paths: planPaths },
  { key: 'projects', title: '审计项目', path: '/projects', paths: projectPaths },
  { key: 'rectify', title: '审计整改', path: '/rectify', paths: rectifyPaths },
  { key: 'resources', title: '审计资源', path: '/audit-resources', paths: resourcePaths },
  { key: 'analytics', title: '统计分析', path: '/cockpit', paths: analyticsPaths },
]

export const demoRoles = [
  { id: 'audit-lead', name: '郑刚', title: '审计负责人', unit: '审计部' },
  { id: 'project-lead', name: '张衡', title: '项目负责人（主审）', unit: '审计项目组' },
  { id: 'auditor', name: '李娜', title: '审计人员', unit: '审计项目组' },
] as const
export type IcmDemoRoleId = (typeof demoRoles)[number]['id']

function rememberedDemoRole(): IcmDemoRoleId {
  try {
    const saved = sessionStorage.getItem('internal-audit-demo-role')
    return demoRoles.find((role) => role.id === saved)?.id ?? 'audit-lead'
  } catch { return 'audit-lead' }
}
let activeDemoRoleId: IcmDemoRoleId = rememberedDemoRole()
const demoRoleListeners = new Set<() => void>()

export function setIcmDemoRole(roleId: IcmDemoRoleId) {
  if (activeDemoRoleId === roleId) return
  activeDemoRoleId = roleId
  try { sessionStorage.setItem('internal-audit-demo-role', roleId) } catch { /* Keep switching available when browser storage is disabled. */ }
  demoRoleListeners.forEach((listener) => listener())
}

function subscribeToDemoRole(listener: () => void) {
  demoRoleListeners.add(listener)
  return () => demoRoleListeners.delete(listener)
}

export function useIcmDemoRole() {
  const roleId = useSyncExternalStore(subscribeToDemoRole, () => activeDemoRoleId, () => activeDemoRoleId)
  const role = demoRoles.find((item) => item.id === roleId) ?? demoRoles[0]
  return { roleId, role }
}

export default function AppShell() {
  // 页面基础样式（卡片、指标、工具条等）在壳层统一注入，避免不使用 PageFrame 的页面（如监督看板）缺失样式
  useIcmPageKitStyle()
  const location = useLocation()
  const navigate = useNavigate()
  const { roleId: activeRoleId, role: activeRole } = useIcmDemoRole()
  const projects = useAuditProjectStore((state) => state.projects)
  const roleMenuRef = useRef<HTMLDetailsElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [dataExpanded, setDataExpanded] = useState(true)
  const [reviewExpanded, setReviewExpanded] = useState(true)
  const [workpaperExpanded, setWorkpaperExpanded] = useState(true)
  const currentPath = location.pathname === '/' ? defaultRoute : location.pathname
  const currentProjectId = currentPath.match(/^\/projects\/([^/]+)$/)?.[1] ?? new URLSearchParams(location.search).get('project') ?? undefined
  const currentProject = projects.find((project) => project.id === currentProjectId)
  const meta = getRouteMeta(currentPath)
  const activeTop = currentProjectId ? topNav.find((item) => item.key === 'projects') : topNav.find((item) => item.paths.includes(currentPath) || (item.key === 'projects' && currentPath.startsWith('/projects/')))
  const sideRoutes = activeTop && !['home', 'plan', 'analytics'].includes(activeTop.key)
    ? icmRoutes.filter((route) => activeTop.paths.includes(route.path) && !(activeTop.key === 'rectify' && route.path === '/audit-center'))
    : []
  const showSideNav = activeTop?.key === 'projects' ? !!currentProject : activeTop?.key !== 'rectify' && sideRoutes.length > 0
  const view = new URLSearchParams(location.search).get('view')
  const isDataView = (target: string) => currentPath === '/data-collect' && (view ?? 'demands') === target
  const isReviewView = (target: string) => currentPath === '/review-workbench' && (view ?? 'execute') === target

  const pageRedirect = rolePageRedirect(activeRoleId, currentPath, location.search)
  if (pageRedirect) return <Navigate to={pageRedirect} replace />

  return (
    <div className={'icm-app ' + (collapsed ? 'side-collapsed ' : '') + (showSideNav ? '' : 'no-side-nav')}>
      <header className="icm-top">
        <div className="icm-brand"><div className="icm-brand-mark" aria-hidden="true"><Landmark size={19} /></div><div><div className="icm-brand-title">内部审计管理平台</div><div className="icm-brand-sub">审计项目全流程工作平台</div></div></div>
        <nav className="icm-top-nav" aria-label="主导航">
          {topNav.filter((item) => canSeeTopPage(activeRoleId, item.key)).map((item) => <NavLink className={() => `icm-top-nav-link ${activeTop?.key === item.key ? 'active' : ''}`} key={item.key} to={item.path}>{item.title}</NavLink>)}
        </nav>
        <div className="icm-top-actions"><span className="icm-badge">待处理 6</span><button className="icm-top-icon" type="button" aria-label="查看待办通知" title="待办通知"><Bell size={17} /></button><details className="icm-role-menu" ref={roleMenuRef} onKeyDown={(event) => {
          if (event.key === 'Escape') {
            roleMenuRef.current?.removeAttribute('open')
            roleMenuRef.current?.querySelector('summary')?.focus()
          }
        }}>
          <summary className="icm-user" aria-label={`演示角色：${activeRole.title}，打开角色切换`}>
            <span className="icm-user-avatar"><UserRound size={16} /></span>
            <span><b>{activeRole.name}</b><em>{activeRole.title}</em></span>
            <ChevronDown className="icm-user-chevron" size={14} aria-hidden="true" />
          </summary>
          <div className="icm-role-menu-panel" aria-label="切换演示角色">
            <div className="icm-role-menu-heading">演示角色</div>
            {demoRoles.map((role) => <button
              className={`icm-role-option ${role.id === activeRoleId ? 'active' : ''}`}
              key={role.id}
              type="button"
              aria-pressed={role.id === activeRoleId}
              onClick={() => {
                setIcmDemoRole(role.id)
                roleMenuRef.current?.removeAttribute('open')
              }}
            >
              <span className="icm-role-option-avatar"><UserRound size={15} /></span>
              <span><b>{role.name}</b><em>{role.title}</em></span>
              {role.id === activeRoleId ? <span className="icm-role-current">当前</span> : null}
            </button>)}
          </div>
        </details></div>
      </header>

      <div className="icm-body">
        {showSideNav ? <aside className="icm-side-nav">
          <div className="icm-side-toolbar"><span>{activeTop?.key === 'projects' ? '项目导航' : '资源导航'}</span><button className="icm-side-collapse-btn" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? '展开侧栏' : '收起侧栏'} aria-expanded={!collapsed} title={collapsed ? '展开侧栏' : '收起侧栏'}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button></div>
          {activeTop?.key === 'projects' ? <ProjectNavigation project={currentProject} roleId={activeRoleId} /> : activeTop?.key === 'resources' ? <ResourceNavigation /> : <div className="icm-side-section">
            {sideRoutes.map((route) => {
              if (['/walkthrough-workbench', '/evidence', '/issues'].includes(route.path)) return null
              const Icon = route.icon
              const isData = route.path === '/data-collect'
              const isReview = route.path === '/review-workbench'
              const isWorkpaper = route.path === '/workpaper'
              const isGroup = isData || isReview || isWorkpaper
              const expanded = isData ? dataExpanded : isReview ? reviewExpanded : workpaperExpanded
              const toggle = isData ? () => setDataExpanded((value) => !value) : isReview ? () => setReviewExpanded((value) => !value) : () => setWorkpaperExpanded((value) => !value)
              return <div className={`icm-side-menu-item ${isGroup ? 'plan-group' : ''}`} key={route.path}>
                {isGroup ? <button aria-label={route.title} className="icm-side-link icm-side-plan-toggle" data-tooltip={route.title} title={route.title} type="button" onClick={toggle}><Icon size={17} /><span>{route.title}</span><ChevronDown className={`icm-side-menu-arrow ${expanded ? 'active' : ''}`} size={14} /></button> : <NavLink aria-label={route.title} className={({ isActive }) => `icm-side-link ${isActive ? 'active' : ''}`} data-tooltip={route.title} title={route.title} to={route.path}><Icon size={17} /><span>{route.title}</span></NavLink>}
                {isData && dataExpanded ? <div className="icm-side-submenu"><NavLink className={() => isDataView('demands') ? 'active' : ''} to="/data-collect?view=demands">数据需求与文件</NavLink><NavLink className={() => isDataView('materials') ? 'active' : ''} to="/data-collect?view=materials">材料清单</NavLink><NavLink className={() => isDataView('packages') ? 'active' : ''} to="/data-collect?view=packages">数据包管理</NavLink><NavLink className={() => isDataView('quality') ? 'active' : ''} to="/data-collect?view=quality">质量校验</NavLink></div> : null}
                {isReview && reviewExpanded ? <div className="icm-side-submenu"><NavLink className={() => isReviewView('execute') ? 'active' : ''} to="/review-workbench?view=execute">执行审查</NavLink><NavLink className={() => isReviewView('agents') ? 'active' : ''} to="/review-workbench?view=agents">智能体配置</NavLink><NavLink className={() => isReviewView('results') ? 'active' : ''} to="/review-workbench?view=results">审查结果</NavLink></div> : null}
                {isWorkpaper && workpaperExpanded ? <div className="icm-side-submenu"><NavLink className={() => currentPath === '/workpaper' ? 'active' : ''} to="/workpaper">审查记录</NavLink><NavLink className={() => currentPath === '/walkthrough-workbench' ? 'active' : ''} to="/walkthrough-workbench">穿行测试</NavLink><NavLink className={() => currentPath === '/evidence' ? 'active' : ''} to="/evidence">取证台账</NavLink><NavLink className={() => currentPath === '/issues' ? 'active' : ''} to="/issues">问题台账</NavLink></div> : null}
              </div>
            })}
          </div>}
          <div className="icm-side-current"><span>{activeTop?.title}</span><ChevronRight size={14} /><strong>{meta.title}</strong></div>
        </aside> : null}
        <main className={currentPath === '/cockpit' ? 'icm-main-no-scroll' : 'icm-main'} key={`${currentProjectId ?? 'global'}:${currentPath}:${['task', 'paper', 'issue', 'evidence', 'demand'].map((key) => new URLSearchParams(location.search).get(key) ?? '').join(':')}`}>
          <MatterContextBar role={activeRole} />
          {currentProjectId && !currentProject ? <div className="icm-empty-inline">未找到该项目，请返回项目台账重新选择。</div> : <>{currentProject && !currentPath.startsWith('/projects/') && <div className="project-scope-banner"><span>当前项目</span><strong>{currentProject.name}</strong><button className="icm-link" onClick={() => navigate(`/projects/${currentProject.id}?tab=execution`)}>返回项目实施</button></div>}<Outlet /></>}
        </main>
      </div>

      {currentPath !== '/workplace' && activeTop?.key !== 'rectify' && <footer className="icm-foot"><span>当前系统：内部审计管理平台</span><span>·</span><span>项目、程序、证据、报告与整改闭环</span><span className="icm-foot-spacer" /><span className="icm-dot" /><span>演示数据</span></footer>}
      <AuditAssistant currentProjectId={currentProjectId} currentProjectName={currentProject?.name} role={activeRole.title} onIntentConfirmed={(intent) => {
        const targetProjectId = currentProjectId ?? projects[0]?.id
        const targetProject = projects.find((project) => project.id === targetProjectId)
        if (!targetProject) return
        useAuditProjectStore.getState().updateProject(targetProject.id, { todoItems: [...targetProject.todoItems, { id: `TODO-${Date.now()}`, title: intent.title, summary: intent.summary, status: '待处理', owner: activeRole.name, createdAt: new Date().toISOString().slice(0, 10), source: '智能助手' }] })
      }} />
    </div>
  )
}

