import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { resourceSeeds } from '../data/resourceSeeds'
import { currentVersion, usableResource, type ResourceAsset, type ResourceCategory, type ResourceContent } from '../data/resourceModel'
import { validateReviewConfig } from '../data/reviewConfig'

interface ResourceStore {
  assets: ResourceAsset[]
  saveDraft: (id: string | undefined, category: ResourceCategory, content: ResourceContent, actor: string) => string
  submit: (id: string, actor: string) => void
  review: (id: string, pass: boolean, opinion: string, actor: string) => void
  setEnabled: (id: string, enabled: boolean, reason: string, actor: string) => void
}
const now = () => new Date().toISOString()
export const useResourceStore = create<ResourceStore>()(persist((set, get) => ({
  assets: resourceSeeds,
  saveDraft: (id, category, content, actor) => {
    if (content.reviewConfig) validateReviewConfig(content.reviewConfig)
    if (!content.title.trim()) throw new Error('请填写资源名称。')
    if (content.effectiveFrom && content.effectiveTo && content.effectiveTo < content.effectiveFrom) throw new Error('失效日期不能早于生效日期。')
    const existing = get().assets.find((a) => a.id === id)
    if (id && !existing) throw new Error('资源不存在。')
    if (existing?.draft?.state === '待审核') throw new Error('审核中的资源请先退回，再修改草稿。')
    const resourceId = id ?? `RES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const at = now()
    const saved: ResourceAsset = { ...(existing ?? { id: resourceId, category, enabled: true, versions: [], history: [] }), draft: { content: structuredClone(content), state: '草稿', at, by: actor } }
    saved.history = [...saved.history, { at, by: actor, action: '保存修订草稿' }]
    set((s) => ({ assets: existing ? s.assets.map((a) => a.id === resourceId ? saved : a) : [saved, ...s.assets] }))
    return resourceId
  },
  submit: (id, actor) => {
    const asset = get().assets.find((a) => a.id === id)
    const draft = asset?.draft
    if (!draft || draft.state !== '草稿') throw new Error('没有可送审草稿。')
    if (![draft.content.title, draft.content.summary, draft.content.content, draft.content.owner, draft.content.source].every((v) => v.trim())) throw new Error('请补全名称、摘要、正文、维护人和来源。')
    if (draft.content.relatedIds.some((related) => !get().assets.some((a) => a.id === related && usableResource(a)))) throw new Error('关联资源必须已有有效发布版本。')
    set((s) => ({ assets: s.assets.map((a) => a.id === id ? { ...a, draft: { ...draft, state: '待审核' }, history: [...a.history, { at: now(), by: actor, action: '提交资源审核' }] } : a) }))
  },
  review: (id, pass, opinion, actor) => {
    const asset = get().assets.find((a) => a.id === id)
    if (!asset?.draft || asset.draft.state !== '待审核' || !opinion.trim()) throw new Error('请填写审核意见，并选择待审核草稿。')
    if (pass && asset.draft.content.relatedIds.some((related) => !get().assets.some((a) => a.id === related && usableResource(a)))) throw new Error('关联资源已停用、失效或未发布，请退回草稿并核对依据。')
    const at = now()
    set((s) => ({ assets: s.assets.map((a) => a.id !== id ? a : { ...a, enabled: pass ? true : a.enabled, versions: pass ? [...a.versions, { version: (currentVersion(a)?.version ?? 0) + 1, at, by: actor, opinion, snapshot: structuredClone(asset.draft!.content) }] : a.versions, draft: pass ? undefined : { ...asset.draft!, state: '草稿' }, history: [...a.history, { at, by: actor, action: `${pass ? '审核通过并发布' : '退回修改'}：${opinion}` }] }) }))
  },
  setEnabled: (id, enabled, reason, actor) => {
    if (!reason.trim()) throw new Error('请填写启停原因。')
    const asset = get().assets.find((a) => a.id === id)
    if (!asset || !currentVersion(asset)) throw new Error('请先完成资源审核发布。')
    if (enabled && currentVersion(asset)!.snapshot.relatedIds.some((related) => !get().assets.some((a) => a.id === related && usableResource(a)))) throw new Error('关联依据尚不可用，请补全并发布后再恢复使用。')
    set((s) => ({ assets: s.assets.map((a) => a.id === id ? { ...a, enabled, history: [...a.history, { at: now(), by: actor, action: `${enabled ? '恢复使用' : '停用'}：${reason}` }] } : a) }))
  },
}), { name: 'internal-audit-resources-v1', version: 1, merge: (saved, current) => { const persisted = saved as Partial<ResourceStore>; const assets = persisted?.assets ?? current.assets; return { ...current, assets: [...assets, ...resourceSeeds.filter((seed) => !assets.some((a) => a.id === seed.id))] } } }))
