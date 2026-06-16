import { useEffect, useState, type FormEvent } from 'react'
import { getFieldError, getUnknownFieldErrors, mapFieldErrors } from '../../lib/parseApiError'
import { validateUserForm } from '../../lib/userValidators'
import { isApiError } from '../../services/api'
import * as userService from '../../services/userService'
import type { UpdateUserPayload, User } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'

interface UserFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  user?: User | null
  onClose: () => void
  onSuccess: () => void
}

const USERNAME_HINT_CREATE =
  'Caso não seja preenchido, o usuário será nome.sobrenome.'
const USERNAME_HINT_EDIT =
  'Caso não seja preenchido, o usuário será atualizado para nome.sobrenome.'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  isGlobalAdmin: false,
  isActive: true,
}

export function UserFormModal({ open, mode, user, onClose, onSuccess }: UserFormModalProps) {
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        password: '',
        confirmPassword: '',
        isGlobalAdmin: user.isGlobalAdmin,
        isActive: user.isActive,
      })
    } else {
      setForm(emptyForm)
    }

    setErrors({})
  }, [open, mode, user])

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const clientErrors = validateUserForm(form, mode)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        await userService.createUser({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          ...(form.username.trim() ? { username: form.username.trim() } : {}),
          password: form.password,
          isGlobalAdmin: form.isGlobalAdmin,
          isActive: form.isActive,
        })
        showToast('Usuário criado com sucesso.', 'success')
      } else if (user) {
        const payload: UpdateUserPayload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          ...(form.username.trim() ? { username: form.username.trim() } : {}),
          isGlobalAdmin: form.isGlobalAdmin,
          isActive: form.isActive,
        }

        if (form.password) {
          payload.password = form.password
        }

        await userService.updateUser(user.id, payload)
        showToast('Usuário atualizado com sucesso.', 'success')
      }

      onSuccess()
      onClose()
    } catch (error) {
      if (isApiError(error)) {
        const knownFields = [
          'firstName',
          'lastName',
          'email',
          'username',
          'password',
          'isGlobalAdmin',
          'isActive',
        ]

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
        showToast('Não foi possível salvar o usuário.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Criar usuário' : 'Editar usuário'}
      onClose={onClose}
      size="lg"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="firstName"
            label="Nome"
            required
            value={form.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
            error={errors.firstName}
            disabled={isSubmitting}
          />
          <Input
            name="lastName"
            label="Sobrenome"
            required
            value={form.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
            error={errors.lastName}
            disabled={isSubmitting}
          />
        </div>

        <Input
          name="email"
          type="email"
          label="E-mail"
          required
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          error={errors.email}
          disabled={isSubmitting}
        />

        <Input
          name="username"
          label="Usuário"
          hint={mode === 'create' ? USERNAME_HINT_CREATE : USERNAME_HINT_EDIT}
          value={form.username}
          onChange={(event) => updateField('username', event.target.value)}
          error={errors.username}
          disabled={isSubmitting}
        />

        <Input
          name="password"
          type="password"
          label={mode === 'create' ? 'Senha' : 'Nova senha'}
          required={mode === 'create'}
          hint={mode === 'edit' ? 'Preencha apenas se desejar alterar a senha.' : undefined}
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          error={errors.password}
          disabled={isSubmitting}
          autoComplete={mode === 'create' ? 'new-password' : 'off'}
        />

        {mode === 'create' ? (
          <Input
            name="confirmPassword"
            type="password"
            label="Confirmar senha"
            required
            value={form.confirmPassword}
            onChange={(event) => updateField('confirmPassword', event.target.value)}
            error={errors.confirmPassword}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <Checkbox
            name="isGlobalAdmin"
            label="Administrador global"
            checked={form.isGlobalAdmin}
            onChange={(event) => updateField('isGlobalAdmin', event.target.checked)}
            disabled={isSubmitting}
          />
          <Checkbox
            name="isActive"
            label="Usuário ativo"
            checked={form.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : mode === 'create' ? 'Criar usuário' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
