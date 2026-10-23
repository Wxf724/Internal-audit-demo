import { lazy, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

const IcmShell = lazy(() => import('../pages/icm'))
const Workplace = lazy(() => import('../pages/icm/pages/Workplace'))
const PlanWorkbench = lazy(() => import('../pages/icm/pages/PlanWorkbench'))
const DispatchCenter = lazy(() => import('../pages/icm/pages/DispatchCenter'))
const TaskCenter = lazy(() => import('../pages/icm/pages/TaskCenter'))
const StandardLibrary = lazy(() => import('../pages/icm/pages/StandardLibrary'))
const KnowledgeBase = lazy(() => import('../pages/icm/pages/KnowledgeBase'))
const DataCollectCenter = lazy(() => import('../pages/icm/pages/DataCollectCenter'))
const ReviewWorkbench = lazy(() => import('../pages/icm/pages/ReviewWorkbench'))
const WalkthroughWorkbench = lazy(() => import('../pages/icm/pages/WalkthroughWorkbench'))
const Workpaper = lazy(() => import('../pages/icm/pages/Workpaper'))
const EvidenceLedger = lazy(() => import('../pages/icm/pages/EvidenceLedger'))
const IssueLedger = lazy(() => import('../pages/icm/pages/IssueLedger'))
const RectifyBoard = lazy(() => import('../pages/icm/pages/RectifyBoard'))
const AuditCenter = lazy(() => import('../pages/icm/pages/AuditCenter'))
const ReportCenter = lazy(() => import('../pages/icm/pages/ReportCenter'))
const VisualCockpit = lazy(() => import('../pages/icm/pages/VisualCockpit'))
const Login = lazy(() => import('../pages/login'))
const NotFound = lazy(() => import('../pages/NotFound'))

import { defaultRoute, icmRoutes } from '../pages/icm/routeMeta'

const pageByPath: Record<string, ReactNode> = {
  '/workplace': <Workplace />,
  '/plan-workbench': <PlanWorkbench />,
  '/dispatch-center': <DispatchCenter />,
  '/task-center': <TaskCenter />,
  '/standard-library': <StandardLibrary />,
  '/knowledge-base': <KnowledgeBase />,
  '/data-collect': <DataCollectCenter />,
  '/review-workbench': <ReviewWorkbench />,
  '/walkthrough-workbench': <WalkthroughWorkbench />,
  '/workpaper': <Workpaper />,
  '/evidence': <EvidenceLedger />,
  '/issues': <IssueLedger />,
  '/rectify': <RectifyBoard />,
  '/audit-center': <AuditCenter />,
  '/report': <ReportCenter />,
  '/cockpit': <VisualCockpit />,
}

const icmChildren = icmRoutes.map((route) => ({
  path: route.path.slice(1),
  element: pageByPath[route.path],
}))

const routes: RouteObject[] = [
  {
    path: '/',
    element: <IcmShell />,
    children: [
      { index: true, element: <Navigate to={defaultRoute} replace /> },
      ...icmChildren,
    ],
  },
  ...icmRoutes.map((route) => ({
    path: route.path,
    element: <IcmShell />,
    children: [{ index: true, element: pageByPath[route.path] }],
  })),
  { path: '/login', element: <Login /> },
  { path: '*', element: <NotFound /> },
]

export default routes
