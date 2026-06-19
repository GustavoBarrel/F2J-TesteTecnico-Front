import { ClipboardList } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { isApiError } from '../../services/api'
import * as requestService from '../../services/requestService'
import * as sectorService from '../../services/sectorService'
import { useToast } from '../../contexts/ToastContext'
import { newRequestBreadcrumbs } from '../../lib/breadcrumbs'
import { ObserverPicker } from './ObserverPicker'
import type { SectorWithServicesOption } from '../../types/request.types'

interface FormErrors {
  sectorId?: string
  sectorServiceId?: string
  title?: string
  description?: string
}

export function NewRequestPage() {
  const navigate = useNavigate()
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
        const [optionsResult, sectorsResult] = await Promise.allSettled([
          requestService.getSectorServicesOptions(),
          sectorService.getSectors({ isActive: true, limit: 100 }),
        ])

        if (cancelled) return

        const options =
          optionsResult.status === 'fulfilled' ? optionsResult.value : []
        const servicesBySectorId = new Map(
          options.map((sector) => [
            sector.id,
            sector.sectorServices.filter((service) => service.isActive),
          ]),
        )

        let sectors: SectorWithServicesOption[] = []

        if (sectorsResult.status === 'fulfilled' && sectorsResult.value.data.length > 0) {
          sectors = sectorsResult.value.data.map((sector) => ({
            id: sector.id,
            name: sector.name,
            sectorServices: servicesBySectorId.get(sector.id) ?? [],
          }))
        } else {
          sectors = options.map((sector) => ({
            id: sector.id,
            name: sector.name,
            sectorServices: servicesBySectorId.get(sector.id) ?? [],
          }))
        }

        setSectorsWithServices(sectors)
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
      navigate(`/solicitacoes/${req.id}`)
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        breadcrumbs={newRequestBreadcrumbs}
        icon={<ClipboardList size={20} />}
        title="Nova solicitação"
        description="Preencha os dados abaixo para abrir uma solicitação a um setor. Você pode incluir observadores opcionalmente."
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        {isLoadingOptions ? (
          <div className="py-8 text-center text-sm text-text-muted">
            Carregando opções...
          </div>
        ) : sectorsWithServices.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-muted">
            Nenhum setor disponível para solicitação.
          </div>
        ) : (
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
              <label
                htmlFor="description"
                className="text-sm font-medium text-text"
              >
                Descrição <span className="text-danger">*</span>
              </label>
              <textarea
                id="description"
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
              <Link
                to="/"
                replace
                className="inline-flex flex-nowrap items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
              >
                Cancelar
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || selectedSectorHasNoServices}
              >
                {isSubmitting ? 'Enviando...' : 'Criar solicitação'}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
