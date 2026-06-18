import { api } from './api'
import type { MeSector } from '../types/request.types'

export function getMySectors(): Promise<MeSector[]> {
  return api<MeSector[]>('/me/sectors')
}
