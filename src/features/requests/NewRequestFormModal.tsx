import { Modal } from '../../components/ui/Modal'
import { NewRequestForm } from './NewRequestForm'

interface NewRequestFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (requestId: string) => void
}

export function NewRequestFormModal({ open, onClose, onSuccess }: NewRequestFormModalProps) {
  function handleSuccess(requestId: string) {
    onSuccess(requestId)
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Nova solicitação"
      onClose={onClose}
      size="lg"
    >
      <p className="mb-5 text-sm text-text-muted">
        Preencha os dados abaixo para abrir uma solicitação a um setor. Você pode incluir
        observadores opcionalmente.
      </p>
      <NewRequestForm
        descriptionId="new-request-description-modal"
        onCancel={onClose}
        onSuccess={handleSuccess}
      />
    </Modal>
  )
}
