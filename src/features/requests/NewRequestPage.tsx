import { ClipboardList } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { isApiError } from '../../services/api'
import * as requestService from '../../services/requestService'
import * as meService from '../../services/meService'
import * as sectorServicesService from '../../services/sectorServicesService'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { newRequestBreadcrumbs } from '../../lib/breadcrumbs'
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
  const { user } = useAuth()

  const [sectorsWithServices, setSectorsWithServices] = useState<
    SectorWithServicesOption[]
  >([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  const [sectorId, setSectorId] = useState('')
  const [sectorServiceId, setSectorServiceId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true)
      try {
        if (user?.isGlobalAdmin) {
          const data = await requestService.getSectorServicesOptions()
          setSectorsWithServices(
            data.map((s) => ({
              ...s,
              sectorServices: s.sectorServices.filter((sv) => sv.isActive),
            })),
          )
        } else {
          const mySectors = await meService.getMySectors()
          const results: SectorWithServicesOption[] = []
          await Promise.all(
            mySectors.map(async (sector) => {
              try {
                const res = await sectorServicesService.getSectorServices(
                  sector.id,
                  { isActive: true, limit: 50 },
                )
                if (res.data.length > 0) {
                  results.push({
                    id: sector.id,
                    name: sector.name,
                    sectorServices: res.data.map((sv) => ({
                      id: sv.id,
                      name: sv.name,
                      isActive: sv.isActive,
                      sectorId: sv.sectorId,
                    })),
                  })
                }
              } catch {
                // sector without accessible services
              }
            }),
          )
          setSectorsWithServices(results)
        }
      } catch (err) {
        if (isApiError(err)) showToast(err.message)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    void loadOptions()
  }, [user?.isGlobalAdmin, showToast])

  const sectorOptions = useMemo(
    () => [
      { value: '', label: 'Selecione um setor...' },
      ...sectorsWithServices.map((s) => ({ value: s.id, label: s.name })),
    ],
    [sectorsWithServices],
  )

  const serviceOptions = useMemo(() => {
    const sector = sectorsWithServices.find((s) => s.id === sectorId)
    if (!sector) return [{ value: '', label: 'Selecione um serviço...' }]
    return [
      { value: '', label: 'Selecione um serviço...' },
      ...sector.sectorServices.map((sv) => ({ value: sv.id, label: sv.name })),
    ]
  }, [sectorsWithServices, sectorId])

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
        description="Preencha os dados abaixo para abrir uma solicitação a um setor."
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        {isLoadingOptions ? (
          <div className="py-8 text-center text-sm text-text-muted">
            Carregando opções...
          </div>
        ) : sectorsWithServices.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-muted">
            Nenhum setor com serviços disponíveis para solicitação.
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
              <Select
                label="Serviço"
                required
                name="sectorServiceId"
                options={serviceOptions}
                value={sectorServiceId}
                error={errors.sectorServiceId}
                disabled={!sectorId}
                onChange={(e) => {
                  setSectorServiceId(e.target.value)
                  setErrors((prev) => ({ ...prev, sectorServiceId: undefined }))
                }}
              />
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

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/solicitacoes')}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Criar solicitação'}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
