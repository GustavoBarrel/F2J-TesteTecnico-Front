import { Clock, Timer } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../contexts/ToastContext'
import { requestAutoCompleteSettingsBreadcrumbs } from '../../lib/breadcrumbs'
import { getFieldError, getUnknownFieldErrors, mapFieldErrors } from '../../lib/parseApiError'
import { isApiError } from '../../services/api'
import * as settingsService from '../../services/settingsService'
import {
  DURATION_UNIT_LABEL,
  EVERY_MINUTE_CRON_PRESET,
  type AutoCompleteDurationUnit,
} from '../../types/settings.types'

const DURATION_FIELD_HINT =
  'Estes valores definem o tempo necessário após a alteração do chamado para solucionado, caso o solicitante não responda para concluir a solicitação.'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

interface FormState {
  cronExpression: string
  durationValue: string
  durationUnit: AutoCompleteDurationUnit
}

function validateForm(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.cronExpression.trim()) {
    errors.cronExpression = 'Selecione a frequência de verificação.'
  }
  const duration = Number(form.durationValue)
  if (!form.durationValue.trim() || Number.isNaN(duration) || duration < 1) {
    errors.durationValue = 'Informe um prazo válido (mínimo 1).'
  }
  return errors
}

export function RequestAutoCompleteSettingsPage() {
  const { showToast } = useToast()

  const [form, setForm] = useState<FormState>({
    cronExpression: '',
    durationValue: '',
    durationUnit: 'DAYS',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [cronPresets, setCronPresets] = useState<{ value: string; label: string }[]>([])
  const [durationUnitOptions, setDurationUnitOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [settings, options] = await Promise.all([
        settingsService.getRequestAutoCompleteSettings(),
        settingsService.getRequestAutoCompleteOptions(),
      ])

      setForm({
        cronExpression: settings.cronExpression,
        durationValue: String(settings.durationValue),
        durationUnit: settings.durationUnit,
      })
      setUpdatedAt(settings.updatedAt)

      const presets = options.cronPresets.map((preset) => ({
        value: preset.cronExpression,
        label: preset.label,
      }))
      if (!presets.some((preset) => preset.value === EVERY_MINUTE_CRON_PRESET.cronExpression)) {
        presets.unshift({
          value: EVERY_MINUTE_CRON_PRESET.cronExpression,
          label: EVERY_MINUTE_CRON_PRESET.label,
        })
      }
      if (!presets.some((preset) => preset.value === settings.cronExpression)) {
        presets.unshift({
          value: settings.cronExpression,
          label: settings.cronExpression,
        })
      }
      setCronPresets(presets)
      setDurationUnitOptions(
        options.durationUnits.map((unit) => ({
          value: unit,
          label: DURATION_UNIT_LABEL[unit],
        })),
      )
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await settingsService.updateRequestAutoCompleteSettings({
        cronExpression: form.cronExpression,
        durationValue: Number(form.durationValue),
        durationUnit: form.durationUnit,
      })
      setUpdatedAt(updated.updatedAt)
      showToast('Configuração salva. O agendamento foi atualizado.', 'success')
    } catch (err) {
      if (isApiError(err)) {
        setFieldErrors(mapFieldErrors(err.fields))
        const unknown = getUnknownFieldErrors(err.fields, [
          'cronExpression',
          'durationValue',
          'durationUnit',
        ])
        unknown.forEach((message) => showToast(message))
        if (!err.fields) showToast(err.message)
        else if (!getFieldError(err.fields, 'cronExpression') &&
          !getFieldError(err.fields, 'durationValue') &&
          !getFieldError(err.fields, 'durationUnit') &&
          unknown.length === 0) {
          showToast(err.message)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="h-20 animate-pulse rounded-xl bg-secondary/40" />
        <div className="h-64 animate-pulse rounded-xl bg-secondary/40" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:gap-5">
      <PageHeader
        breadcrumbs={requestAutoCompleteSettingsBreadcrumbs}
        icon={<Timer size={20} />}
        title="Auto-conclusão de solicitações"
        subtitle="Configuração global do sistema"
        description="Define quando solicitações com status Solucionado devem ser concluídas automaticamente caso o requerente não revise a solução dentro do prazo configurado."
      />

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Frequência de verificação"
            name="cronExpression"
            required
            options={cronPresets}
            value={form.cronExpression}
            error={fieldErrors.cronExpression}
            onChange={(e) => updateField('cronExpression', e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Prazo"
              required
              type="number"
              min={1}
              name="durationValue"
              value={form.durationValue}
              error={fieldErrors.durationValue}
              hint={DURATION_FIELD_HINT}
              onChange={(e) => updateField('durationValue', e.target.value)}
            />
            <Select
              label="Unidade do prazo"
              name="durationUnit"
              required
              options={durationUnitOptions}
              value={form.durationUnit}
              error={fieldErrors.durationUnit}
              hint={DURATION_FIELD_HINT}
              onChange={(e) =>
                updateField('durationUnit', e.target.value as AutoCompleteDurationUnit)
              }
            />
          </div>

          {updatedAt ? (
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock size={13} />
              Última atualização: {dateTimeFormatter.format(new Date(updatedAt))}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar configuração'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
