import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { getFieldError, getUnknownFieldErrors, mapFieldErrors } from '../../lib/parseApiError'
import { isApiError } from '../../services/api'
import * as sectorServicesService from '../../services/sectorServicesService'
import type { SectorServiceItem, UpdateSectorServicePayload } from '../../types/sector-service.types'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ToggleCard } from '../../components/ui/ToggleCard'

interface SectorServiceFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  sectorId: string
  sectorName: string
  service?: SectorServiceItem | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  name: '',
  isActive: true,
}

function validateForm(form: typeof emptyForm): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) errors.name = 'O nome do serviço é obrigatório.'
  return errors
}

export function SectorServiceFormModal({
  open,
  mode,
  sectorId,
  sectorName,
  service,
  onClose,
  onSuccess,
}: SectorServiceFormModalProps) {
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && service) {
      setForm({ name: service.name, isActive: service.isActive })
    } else {
      setForm(emptyForm)
    }

    setErrors({})
  }, [open, mode, service])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const clientErrors = validateForm(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        await sectorServicesService.createSectorService(sectorId, {
          name: form.name.trim(),
          isActive: form.isActive,
        })
        showToast('Serviço do setor criado com sucesso.', 'success')
      } else if (service) {
        const payload: UpdateSectorServicePayload = {
          name: form.name.trim(),
          isActive: form.isActive,
        }

        await sectorServicesService.updateSectorService(sectorId, service.id, payload)
        showToast('Serviço do setor atualizado com sucesso.', 'success')
      }

      onSuccess()
      onClose()
    } catch (error) {
      if (isApiError(error)) {
        const knownFields = ['name', 'isActive']
        setErrors(mapFieldErrors(error.fields))

        const unknownErrors = getUnknownFieldErrors(error.fields, knownFields)
        if (unknownErrors.length > 0) {
          showToast(unknownErrors.join(' '))
        } else if (
          !knownFields.some((field) => getFieldError(error.fields, field)) &&
          error.message
        ) {
          showToast(error.message)
        }
      } else {
        showToast('Não foi possível salvar o serviço.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Novo serviço do setor' : 'Editar serviço do setor'}
      onClose={onClose}
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-text-muted">
          Este serviço será uma categoria na abertura de chamados do setor{' '}
          <strong className="text-text">{sectorName}</strong>. Ex.: &quot;Manutenção de
          computador&quot; no setor de TI.
        </p>

        <Input
          name="name"
          label="Nome do serviço"
          required
          placeholder="Ex.: Manutenção de computador"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          error={errors.name}
          disabled={isSubmitting}
        />

        <ToggleCard
          name="isActive"
          label="Serviço ativo"
          description="Serviços inativos não aparecem como categoria na abertura de novos chamados."
          icon={<CheckCircle2 size={16} />}
          checked={form.isActive}
          disabled={isSubmitting}
          onChange={(isActive) => setForm((current) => ({ ...current, isActive }))}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : mode === 'create' ? 'Criar serviço' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
