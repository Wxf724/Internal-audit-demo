import { Modal } from '@/components'
import type { ModalProps } from '@/components/modal'

export function DraftSurface({ embedded, ...props }: ModalProps & { embedded?: boolean }) {
  if (!embedded) return <Modal {...props} />
  return <section className="plan-inline-draft" aria-label="计划草案"><div className="plan-inline-draft-body">{props.children}</div>{props.footer && <footer className="plan-inline-draft-footer">{props.footer}</footer>}</section>
}
