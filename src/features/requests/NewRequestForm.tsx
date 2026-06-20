import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { isApiError } from '../../services/api'
import * as requestService from '../../services/requestService'
import { useToast } from '../../contexts/ToastContext'
import { ObserverPicker } from './ObserverPicker'
import type { SectorWithServicesOption } from '../../types/request.types'

interface FormErrors {
  sectorId?: string
  sectorServiceId?: string
  title?: string
  description?: string
}

interface NewRequestFormProps {
  onCancel: () => void
  onSuccess: (requestId: string) => void
  descriptionId?: string
}

export function NewRequestForm({
  onCancel,
  onSuccess,
  descriptionId = 'description',
}: NewRequestFormProps) {
  const { showToast } = useToast()

  const [sectorsWithServices, setSectorsWithServices] = useState<
    SectorWithServicesOption[]
  >([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  const [sectorId, setSectorId] = useState('')
  const [sectorServiceId, setSectorServiceId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [observerIds, setObserverIds] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      setIsLoadingOptions(true)
      try {
        const options = await requestService.getSectorServicesOptions()

        if (cancelled) return

        setSectorsWithServices(
          options.map((sector) => ({
            id: sector.id,
            name: sector.name,
            sectorServices: sector.sectorServices.filter((service) => service.isActive),
          })),
        )
      } catch (err) {
        if (!cancelled && isApiError(err)) showToast(err.message)
      } finally {
        if (!cancelled) setIsLoadingOptions(false)
      }
    }
    void loadOptions()

    return () => {
      cancelled = true
    }
  }, [showToast])

  const sectorOptions = useMemo(
    () => [
      { value: '', label: 'Selecione um setor...' },
      ...sectorsWithServices.map((s) => ({ value: s.id, label: s.name })),
    ],
    [sectorsWithServices],
  )

  const selectedSector = useMemo(
    () => sectorsWithServices.find((s) => s.id === sectorId),
    [sectorsWithServices, sectorId],
  )

  const selectedSectorHasNoServices =
    Boolean(selectedSector) && selectedSector!.sectorServices.length === 0

  const serviceOptions = useMemo(() => {
    if (!selectedSector) return [{ value: '', label: 'Selecione um serviço...' }]
    return [
      { value: '', label: 'Selecione um serviço...' },
      ...selectedSector.sectorServices.map((sv) => ({ value: sv.id, label: sv.name })),
    ]
  }, [selectedSector])

  function validate(): boolean {
    const e: FormErrors = {}
    if (!sectorId) e.sectorId = 'Selecione um setor.'
    if (!sectorServiceId) e.sectorServiceId = 'Selecione um serviço.'
    if (!title.trim()) e.title = 'Título é obrigatório.'
    else if (title.trim().length < 3) e.title = 'Mínimo 3 caracteres.'
    if (!description.trim()) e.description = 'Descrição é obrigatória.'
    else if (description.trim().length < 10) e.description = 'Mínimo 10 caracteres.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const req = await requestService.createRequest({
        title: title.trim(),
        description: description.trim(),
        sectorServiceId,
        ...(observerIds.length > 0 ? { observerIds } : {}),
      })
      showToast('Solicitação criada com sucesso!', 'success')
      onSuccess(req.id)
    } catch (err) {
      if (isApiError(err)) {
        if (err.fields) {
          const fieldMap: FormErrors = {}
          for (const [k, msgs] of Object.entries(err.fields)) {
            if (k === 'title') fieldMap.title = msgs[0]
            else if (k === 'description') fieldMap.description = msgs[0]
            else if (k === 'sectorServiceId') fieldMap.sectorServiceId = msgs[0]
            else showToast(msgs[0])
          }
          setErrors(fieldMap)
        } else {
          showToast(err.message)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingOptions) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">Carregando opções...</div>
    )
  }

  if (sectorsWithServices.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        Nenhum setor disponível para solicitação.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Setor"
          required
          name="sectorId"
          options={sectorOptions}
          value={sectorId}
          error={errors.sectorId}
          onChange={(e) => {
            setSectorId(e.target.value)
            setSectorServiceId('')
            setErrors((prev) => ({ ...prev, sectorId: undefined }))
          }}
        />
        <div className="flex flex-col gap-1.5">
          <Select
            label="Serviço"
            required
            name="sectorServiceId"
            options={serviceOptions}
            value={sectorServiceId}
            error={errors.sectorServiceId}
            disabled={!sectorId || selectedSectorHasNoServices}
            onChange={(e) => {
              setSectorServiceId(e.target.value)
              setErrors((prev) => ({ ...prev, sectorServiceId: undefined }))
            }}
          />
          {selectedSectorHasNoServices ? (
            <p className="text-xs text-text-muted">Não tem serviços registrados.</p>
          ) : null}
        </div>
      </div>

      <Input
        label="Título"
        required
        name="title"
        placeholder="Descreva brevemente o que você precisa"
        value={title}
        error={errors.title}
        onChange={(e) => {
          setTitle(e.target.value)
          setErrors((prev) => ({ ...prev, title: undefined }))
        }}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={descriptionId} className="text-sm font-medium text-text">
          Descrição <span className="text-danger">*</span>
        </label>
        <textarea
          id={descriptionId}
          name="description"
          rows={5}
          placeholder="Descreva em detalhes o que você precisa..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setErrors((prev) => ({ ...prev, description: undefined }))
          }}
          className={[
            'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-colors resize-y',
            'placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20',
            errors.description ? 'border-danger' : 'border-border',
          ].join(' ')}
        />
        {errors.description ? (
          <p className="text-xs text-danger">{errors.description}</p>
        ) : null}
      </div>

      <ObserverPicker value={observerIds} onChange={setObserverIds} />

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || selectedSectorHasNoServices}
        >
          {isSubmitting ? 'Enviando...' : 'Criar solicitação'}
        </Button>
      </div>
    </form>
  )
}
