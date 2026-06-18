import type { PaginatedMeta } from './api.types'
import type { RoleSlug } from './role.types'

export interface MembershipUser {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
  isActive: boolean
}

export interface MembershipRole {
  id: string
  name: string
  slug: RoleSlug
}

export interface SectorMembership {
  id: string
  userId: string
  sectorId: string
  roleId: string
  user: MembershipUser
  role: MembershipRole
}

export interface CreateMembershipPayload {
  userId: string
  roleId: string
}

export interface UpdateMembershipPayload {
  roleId: string
}

export interface MembershipsQuery {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface PaginatedMemberships {
  data: SectorMembership[]
  meta: PaginatedMeta
}
