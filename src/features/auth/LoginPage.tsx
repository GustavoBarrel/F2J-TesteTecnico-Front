import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  getFieldError,
  getUnknownFieldErrors,
} from '../../lib/parseApiError'
import { isApiError } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Logo } from '../../components/ui/Logo'

export function LoginPage() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const clientErrors: Record<string, string> = {}
    if (!username.trim()) clientErrors.username = 'Informe o usuário.'
    if (!password) clientErrors.password = 'Informe a senha.'

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (error) {
      if (isApiError(error)) {
        const nextErrors: Record<string, string> = {}

        const usernameError = getFieldError(error.fields, 'username')
        const passwordError = getFieldError(error.fields, 'password')

        if (usernameError) nextErrors.username = usernameError
        if (passwordError) nextErrors.password = passwordError

        setErrors(nextErrors)

        const unknownErrors = getUnknownFieldErrors(error.fields, ['username', 'password'])
        if (unknownErrors.length > 0) {
          showToast(unknownErrors.join(' '))
        } else if (!usernameError && !passwordError) {
          showToast(error.message)
        }
      } else {
        showToast('Não foi possível conectar ao servidor.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm lg:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-4 w-full max-w-[17rem] sm:max-w-[19rem]" />
          <p className="text-sm text-text-muted">
            Acesse a central de serviços da sua empresa
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            name="username"
            label="Usuário"
            required
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={errors.username}
            disabled={isSubmitting}
          />

          <Input
            name="password"
            type="password"
            label="Senha"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            disabled={isSubmitting}
          />

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>

          <p className="text-center text-sm">
            <Link to="/recuperar-senha" className="font-medium text-accent hover:underline">
              Esqueci minha senha
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
