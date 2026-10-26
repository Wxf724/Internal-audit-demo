// Presentation scope only: this does not grant or change business-action permissions.
export function canSeeTopPage(roleId: string, key: string) {
  return roleId !== 'auditor' || !['plan', 'analytics'].includes(key)
}

export function canSeeProjectPage(roleId: string, tab: string) {
  return roleId !== 'auditor' || !['report', 'archive'].includes(tab)
}

export function rolePageRedirect(roleId: string, pathname: string, search = ''): string | null {
  if (roleId !== 'auditor') return null
  const path = pathname.replace(/\/+$/, '')
  if (['/plan-workbench', '/cockpit'].includes(path)) return '/workplace'
  const params = new URLSearchParams(search)
  if (/^\/projects\/[^/]+$/.test(path) && !canSeeProjectPage(roleId, params.get('tab') ?? 'overview')) {
    params.set('tab', 'overview')
    params.delete('section')
    return `${path}?${params}`
  }
  return null
}

export function canSeePageRoute(roleId: string, route: string) {
  const [pathname, search = ''] = route.split('?')
  return rolePageRedirect(roleId, pathname, search) === null
}
