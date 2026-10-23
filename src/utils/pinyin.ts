import { pinyin } from 'pinyin-pro'

/**
 * 获取中文字符串的拼音首字母缩写
 * 例如："王小明" → "wxm"，"张三" → "zs"
 *
 * @param text 要转换的文本
 * @param separator 首字母之间的分隔符，默认无分隔符
 * @returns 拼音首字母缩写字符串，非中文字符保持原样
 *
 * @example
 * toPinyinInitials('王小明')  // 'wxm'
 * toPinyinInitials('王小明', '')  // 'wxm'
 */
export function toPinyinInitials(text: string, separator = ''): string {
  if (!text) return ''

  const results = pinyin(text, { type: 'all' })

  return results
    .map((item) => {
      if (item.isZh) {
        return item.initial
      }
      // 非中文字符（英文、数字等）保持原样
      return item.origin
    })
    .join(separator)
}

/**
 * 获取中文字符串的全拼（不带声调）
 * @example
 * toPinyin('王小明')  // 'wang xiao ming'
 */
export function toPinyin(text: string, separator = ' '): string {
  if (!text) return ''
  return pinyin(text, { toneType: 'none', type: 'string', separator })
}

/**
 * 获取中文字符串的连续全拼（不带声调、无分隔符）
 * 用于搜索匹配，如输入 "wangxiao" 可匹配 "王小明"
 * @example
 * toPinyinContinuous('王小明')  // 'wangxiaoming'
 */
export function toPinyinContinuous(text: string): string {
  if (!text) return ''
  return pinyin(text, { toneType: 'none', type: 'string', separator: '' })
}

/**
 * 检查文本是否命中搜索关键字，支持四种匹配模式（大小写不敏感）：
 * 1. 原文匹配        — "王" 匹配 "王小明"
 * 2. 拼音首字母      — "wxm"、"wx" 匹配 "王小明"
 * 3. 简化声母        — "cj" 匹配 "创建"（ch→c, sh→s, zh→z）
 * 4. 全拼连续        — "wangxiao" 匹配 "王小明"
 *
 * @param text  被搜索的原始文本
 * @param query 用户输入的关键字（空字符串返回 true）
 */
export function matchesPinyin(text: string, query: string): boolean {
  if (!query) return true
  const q = query.trim().toUpperCase()
  if (!q) return true
  const upper = text.toUpperCase()

  // 1. 原文匹配
  if (upper.includes(q)) return true

  // 2. 拼音首字母缩写匹配
  const initials = toPinyinInitials(text)
  if (initials.toUpperCase().includes(q)) return true

  // 3. 简化声母匹配：ch→c, sh→s, zh→z
  const simple = initials.replace(/ch|sh|zh/gi, (m) => m[0])
  if (simple.toUpperCase().includes(q)) return true

  // 4. 全拼连续匹配
  const full = toPinyinContinuous(text)
  if (full.toUpperCase().includes(q)) return true

  return false
}
