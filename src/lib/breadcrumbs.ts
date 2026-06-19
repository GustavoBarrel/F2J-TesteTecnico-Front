import type { BreadcrumbItem } from '../components/layout/Breadcrumbs'

export const homeBreadcrumb: BreadcrumbItem = { label: 'Início', to: '/' }

export const homeBreadcrumbs: BreadcrumbItem[] = [{ label: 'Início' }]

export const usersBreadcrumbs: BreadcrumbItem[] = [
  homeBreadcrumb,
  { label: 'Usuários' },
]

export const sectorsBreadcrumbs: BreadcrumbItem[] = [
  homeBreadcrumb,
  { label: 'Setores' },
]

function sectorBaseBreadcrumbs(sectorName: string): BreadcrumbItem[] {
  return [
    homeBreadcrumb,
    { label: 'Setores', to: '/setores' },
    { label: sectorName || '...' },
  ]
}

export function sectorServicesBreadcrumbs(sectorName: string): BreadcrumbItem[] {
  return [...sectorBaseBreadcrumbs(sectorName), { label: 'Serviços' }]
}

export function sectorMembersBreadcrumbs(sectorName: string): BreadcrumbItem[] {
  return [...sectorBaseBreadcrumbs(sectorName), { label: 'Membros' }]
}

export function linkSectorMemberBreadcrumbs(
  sectorId: string,
  sectorName: string,
): BreadcrumbItem[] {
  return [
    ...sectorBaseBreadcrumbs(sectorName),
    { label: 'Membros', to: `/setores/${sectorId}/membros` },
    { label: 'Vincular usuário' },
  ]
}

export const myRequestsBreadcrumbs: BreadcrumbItem[] = [
  homeBreadcrumb,
  { label: 'Minhas solicitações' },
]

export const assignedRequestsBreadcrumbs: BreadcrumbItem[] = [
  homeBreadcrumb,
  { label: 'Atribuídas a mim' },
]

export const newRequestBreadcrumbs: BreadcrumbItem[] = [
  homeBreadcrumb,
  { label: 'Nova solicitação' },
]

export function sectorRequestsBreadcrumbs(sectorName: string): BreadcrumbItem[] {
  return [homeBreadcrumb, { label: sectorName || '...' }]
}

export function requestDetailBreadcrumbs(title: string): BreadcrumbItem[] {
  return [homeBreadcrumb, { label: title || '...' }]
}
