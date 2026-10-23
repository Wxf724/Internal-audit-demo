import dayjs from 'dayjs'

/**
 * 日历日粒度：若 end 早于 start 返回 true。
 * 与 DatePicker 的 DateValue（`String` 后为可解析日期）或 `YYYY-MM-DD` 等字符串兼容。
 * 任一端为 null/undefined 或解析失败则返回 false。
 */
export function isEndDateBeforeStartDate(start: unknown, end: unknown): boolean {
  if (start == null || end == null) return false
  const startD = dayjs(String(start))
  const endD = dayjs(String(end))
  if (!startD.isValid() || !endD.isValid()) return false
  return endD.isBefore(startD, 'day')
}

/**
 * 校验中国大陆手机号：11 位数字，以 1 开头，第二位 3–9。
 * 用于成员档案、登录等场景；空字符串返回 false。
 */
export function isValidChinaMobile(mobile: string): boolean {
  const s = mobile.trim()
  if (!s) return false
  return /^1[3-9]\d{9}$/.test(s)
}

/**
 * 校验常见邮箱格式（非空时校验；用于企业邮箱等）。
 * 规则：本地部分 + @ + 域名含点，不允许空白。
 */
export function isValidEmailFormat(email: string): boolean {
  const s = email.trim()
  if (!s) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

const DEFAULT_AVATAR_ICON = 'ri-robot-2-line'
const DEFAULT_AVATAR_BG = 'bg-slate-100 text-slate-600'
const ALLOWED_AVATAR_BG = new Set([
  'bg-slate-100 text-slate-600',
  'bg-teal-100 text-teal-600',
  'bg-violet-100 text-violet-600',
  'bg-indigo-100 text-indigo-600',
  'bg-emerald-100 text-emerald-600',
  'bg-orange-100 text-orange-600',
  'bg-red-100 text-red-600',
  'bg-yellow-100 text-yellow-600',
  'bg-cyan-100 text-cyan-600',
  'bg-rose-100 text-rose-600',
  'bg-fuchsia-100 text-fuchsia-600',
  'bg-lime-100 text-lime-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-600',
  'bg-purple-100 text-purple-600',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-600',
  'bg-pink-100 text-pink-600',
  'bg-neutral-100 text-neutral-600',
  'bg-stone-100 text-stone-600',
])

/**
 * 解析智能体头像配置：
 * - 期望后端返回 JSON 字符串：{"icon":"ri-xxx","iconBg":"bg-... text-..."}
 * - 不合法或缺失时回退默认图标与背景色
 */
export function parseAgentAvatar(rawAvatar?: string): { icon: string; iconBg: string } {
  if (!rawAvatar) {
    return { icon: DEFAULT_AVATAR_ICON, iconBg: DEFAULT_AVATAR_BG }
  }

  try {
    const parsed = JSON.parse(rawAvatar) as { icon?: unknown; iconBg?: unknown }
    const icon =
      typeof parsed?.icon === 'string' && /^ri-[a-z0-9-]+$/i.test(parsed.icon)
        ? parsed.icon
        : DEFAULT_AVATAR_ICON
    const iconBg =
      typeof parsed?.iconBg === 'string' && ALLOWED_AVATAR_BG.has(parsed.iconBg.trim())
        ? parsed.iconBg.trim()
        : DEFAULT_AVATAR_BG
    return { icon, iconBg }
  } catch {
    return { icon: DEFAULT_AVATAR_ICON, iconBg: DEFAULT_AVATAR_BG }
  }
}
