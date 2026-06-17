import { Archive, Eye, Info, Pencil } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { getFieldError, getUnknownFieldErrors, mapFieldErrors } from '../../lib/parseApiError'
import { isApiError } from '../../services/api'
import * as sectorService from '../../services/sectorService'
import type { Sector, UpdateSectorPayload } from '../../types/sector.types'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'

interface SectorFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  sector?: Sector | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  name: '',
  active: true,
  onlyManagerCanView: false,
  onlyManagerCanEdit: false,
  onlyManagerCanArchive: false,
}

function validateForm(form: typeof emptyForm): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) errors.name = 'Nome é obrigatório.'
  return errors
}

interface PermissionCardProps {
  icon: ReactNode
  title: string
  description: string
  checked: boolean
  name: string
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function PermissionCard({ icon, title, description, checked, name, disabled, onChange }: PermissionCardProps) {
  return (
    <label
      htmlFor={name}
      className={[
        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
        checked
          ? 'border-accent bg-accent/5'
          : 'border-border bg-surface hover:border-accent/40 hover:bg-secondary/30',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          checked ? 'bg-accent text-white' : 'bg-secondary text-text-muted',
        ].join(' ')}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-text">{title}</span>
          <div
            className={[
              'relative h-5 w-9 shrink-0 rounded-full transition-colors',
              checked ? 'bg-accent' : 'bg-border',
            ].join(' ')}
          >
            <div
              className={[
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                checked ? 'translate-x-4' : 'translate-x-0.5',
              ].join(' ')}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-text-muted">{description}</p>
      </div>
      <input
        id={name}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}

export function SectorFormModal({ open, mode, sector, onClose, onSuccess }: SectorFormModalProps) {
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && sector) {
      setForm({
        name: sector.name,
        active: sector.active,
        onlyManagerCanView: sector.onlyManagerCanView,
        onlyManagerCanEdit: sector.onlyManagerCanEdit,
        onlyManagerCanArchive: sector.onlyManagerCanArchive,
      })
    } else {
      setForm(emptyForm)
    }

    setErrors({})
  }, [open, mode, sector])

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

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
        await sectorService.createSector({
          name: form.name.trim(),
          active: form.active,
          onlyManagerCanView: form.onlyManagerCanView,
          onlyManagerCanEdit: form.onlyManagerCanEdit,
          onlyManagerCanArchive: form.onlyManagerCanArchive,
        })
        showToast('Setor criado com sucesso.', 'success')
      } else if (sector) {
        const payload: UpdateSectorPayload = {
          name: form.name.trim(),
          active: form.active,
          onlyManagerCanView: form.onlyManagerCanView,
          onlyManagerCanEdit: form.onlyManagerCanEdit,
          onlyManagerCanArchive: form.onlyManagerCanArchive,
        }

        await sectorService.updateSector(sector.id, payload)
        showToast('Setor atualizado com sucesso.', 'success')
      }

      onSuccess()
      onClose()
    } catch (error) {
      if (isApiError(error)) {
        const knownFields = [
          'name',
          'isActive',
          'onlyManagerCanView',
          'onlyManagerCanEdit',
          'onlyManagerCanArchive',
        ]

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
        showToast('Não foi possível salvar o setor.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Criar setor' : 'Editar setor'}
      onClose={onClose}
      size="lg"
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        {/* Informações básicas */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-primary">Informações do setor</h3>

          <Input
            name="name"
            label="Nome"
            required
            placeholder="Ex.: Tecnologia da Informação"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            error={errors.name}
            disabled={isSubmitting}
          />

          <Checkbox
            name="active"
            label="Setor ativo"
            checked={form.active}
            onChange={(event) => updateField('active', event.target.checked)}
            disabled={isSubmitting}
          />
        </div>

        {/* Permissões de chamados */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold text-primary">Permissões de chamados</h3>
            <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-secondary/60 px-3 py-2">
              <Info size={14} className="mt-0.5 shrink-0 text-text-muted" />
              <p className="text-xs text-text-muted">
                Defina quem pode interagir com os chamados deste setor. Por padrão, qualquer
                usuário pode visualizar, editar e arquivar. Ative as restrições abaixo para
                limitar essas ações <strong>somente ao gerente do setor</strong>.
              </p>
            </div>
          </div>

          <PermissionCard
            name="onlyManagerCanView"
            icon={<Eye size={16} />}
            title="Somente o gerente pode visualizar"
            description="Os chamados deste setor ficarão visíveis apenas para o gerente. Outros usuários não verão o conteúdo dos chamados."
            checked={form.onlyManagerCanView}
            disabled={isSubmitting}
            onChange={(v) => updateField('onlyManagerCanView', v)}
          />

          <PermissionCard
            name="onlyManagerCanEdit"
            icon={<Pencil size={16} />}
            title="Somente o gerente pode editar"
            description="Apenas o gerente do setor poderá alterar os dados dos chamados. Outros usuários terão acesso somente leitura."
            checked={form.onlyManagerCanEdit}
            disabled={isSubmitting}
            onChange={(v) => updateField('onlyManagerCanEdit', v)}
          />

          <PermissionCard
            name="onlyManagerCanArchive"
            icon={<Archive size={16} />}
            title="Somente o gerente pode arquivar"
            description="Somente o gerente do setor poderá encerrar e arquivar chamados. Outros usuários não terão essa opção disponível."
            checked={form.onlyManagerCanArchive}
            disabled={isSubmitting}
            onChange={(v) => updateField('onlyManagerCanArchive', v)}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Salvando...'
              : mode === 'create'
                ? 'Criar setor'
                : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
