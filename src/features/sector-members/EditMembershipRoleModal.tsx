import { useEffect, useState, type FormEvent } from 'react'
import { getFieldError, getUnknownFieldErrors, mapFieldErrors } from '../../lib/parseApiError'
import { isApiError } from '../../services/api'
import * as membershipService from '../../services/membershipService'
import * as roleService from '../../services/roleService'
import type { SectorMembership } from '../../types/membership.types'
import type { Role } from '../../types/role.types'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'

interface EditMembershipRoleModalProps {
  open: boolean
  sectorId: string
  sectorName: string
  membership: SectorMembership | null
  onClose: () => void
  onSuccess: () => void
}

export function EditMembershipRoleModal({
  open,
  sectorId,
  sectorName,
  membership,
  onClose,
  onSuccess,
}: EditMembershipRoleModalProps) {
  const { showToast } = useToast()
  const [roleId, setRoleId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  useEffect(() => {
    if (!open || !membership) return
    setRoleId(membership.roleId)
    setErrors({})
  }, [open, membership])

  useEffect(() => {
    if (!open) return

    setIsLoadingRoles(true)
    roleService
      .getRoles()
      .then(setRoles)
      .catch((error) => {
        if (isApiError(error)) {
          showToast(error.message)
        } else {
          showToast('Não foi possível carregar os cargos.')
        }
      })
      .finally(() => setIsLoadingRoles(false))
  }, [open, showToast])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!membership) return

    if (!roleId) {
      setErrors({ roleId: 'Selecione um cargo.' })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      await membershipService.updateMembership(sectorId, membership.id, { roleId })
      showToast('Cargo atualizado com sucesso.', 'success')
      onSuccess()
      onClose()
    } catch (error) {
      if (isApiError(error)) {
        const knownFields = ['roleId']
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
        showToast('Não foi possível atualizar o cargo.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }))

  return (
    <Modal open={open} title="Alterar cargo do membro" onClose={onClose}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {membership ? (
          <>
            <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-text-muted">
              Altere o cargo de{' '}
              <strong className="text-text">
                {membership.user.firstName} {membership.user.lastName}
              </strong>{' '}
              no setor <strong className="text-text">{sectorName}</strong>.
            </p>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">Usuário</span>
              <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm text-text">
                {membership.user.firstName} {membership.user.lastName}
                <span className="ml-2 text-text-muted">({membership.user.email})</span>
              </div>
            </div>

            <Select
              name="roleId"
              label="Cargo"
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              options={roleOptions}
              error={errors.roleId}
              disabled={isSubmitting || isLoadingRoles}
            />
          </>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingRoles || !membership}>
            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
