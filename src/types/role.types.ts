export type RoleSlug = 'MANAGER' | 'TECHNICIAN'

export interface Role {
  id: string
  name: string
  description: string
  slug: RoleSlug
}
