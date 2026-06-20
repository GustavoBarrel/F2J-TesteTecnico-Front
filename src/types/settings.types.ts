export type AutoCompleteDurationUnit = 'MINUTES' | 'DAYS'

export interface CronPreset {
  label: string
  cronExpression: string
}

export interface RequestAutoCompleteSettings {
  cronExpression: string
  durationValue: number
  durationUnit: AutoCompleteDurationUnit
  updatedAt: string
}

export interface RequestAutoCompleteSettingsOptions {
  cronPresets: CronPreset[]
  durationUnits: AutoCompleteDurationUnit[]
}

export interface UpdateRequestAutoCompleteSettingsPayload {
  cronExpression?: string
  durationValue?: number
  durationUnit?: AutoCompleteDurationUnit
}

export const DURATION_UNIT_LABEL: Record<AutoCompleteDurationUnit, string> = {
  MINUTES: 'Minutos',
  DAYS: 'Dias',
}

export const EVERY_MINUTE_CRON_PRESET: CronPreset = {
  label: 'A cada minuto',
  cronExpression: '*/1 * * * *',
}
