import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import {
  getFieldError,
  getUnknownFieldErrors,
  mapFieldErrors,
} from '../../lib/parseApiError'
import { isApiError } from '../../services/api'
import type { ApiRequestError } from '../../lib/parseApiError'
import * as authService from '../../services/authService'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Logo } from '../../components/ui/Logo'

type Step = 'request' | 'confirm'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseIdentifier(value: string): { username?: string; email?: string } | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.includes('@')) return { email: trimmed }
  return { username: trimmed }
}

function validateRequestStep(value: string): Record<string, string> {
  const errors: Record<string, string> = {}
  const trimmed = value.trim()

  if (!trimmed) {
    errors.identifier = 'Informe o usuário ou e-mail.'
    return errors
  }

  if (trimmed.includes('@') && !EMAIL_PATTERN.test(trimmed)) {
    errors.identifier = 'Informe um e-mail válido.'
  }

  return errors
}

function validateConfirmStep(
  code: string,
  password: string,
  passwordConfirmation: string,
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!code.trim()) {
    errors.code = 'Informe o código recebido por e-mail.'
  } else if (!/^\d{6}$/.test(code.trim())) {
    errors.code = 'O código deve ter 6 dígitos.'
  }

  if (!password) {
    errors.password = 'Informe a nova senha.'
  } else if (password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.'
  }

  if (!passwordConfirmation) {
    errors.passwordConfirmation = 'Confirme a nova senha.'
  } else if (password !== passwordConfirmation) {
    errors.passwordConfirmation = 'As senhas não coincidem.'
  }

  return errors
}

export function ForgotPasswordPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('request')
  const [identifier, setIdentifier] = useState('')
  const [requestMessage, setRequestMessage] = useState('')

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function buildIdentifierPayload() {
    return parseIdentifier(identifier) ?? {}
  }

  function handleApiErrors(err: ApiRequestError, knownFields: string[]) {
    setErrors(mapFieldErrors(err.fields))
    const unknown = getUnknownFieldErrors(err.fields, knownFields)
    unknown.forEach((message) => showToast(message))
    if (!err.fields) {
      showToast(err.message)
    } else if (
      knownFields.every((field) => !getFieldError(err.fields, field)) &&
      unknown.length === 0
    ) {
      showToast(err.message)
    }
  }

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const clientErrors = validateRequestStep(identifier)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const response = await authService.requestPasswordReset(buildIdentifierPayload())
      setRequestMessage(response.message)
      setStep('confirm')
      showToast(response.message, 'success')
    } catch (error) {
      if (isApiError(error)) {
        handleApiErrors(error, ['username', 'email', 'identifier'])
      } else {
        showToast('Não foi possível conectar ao servidor.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const clientErrors = validateConfirmStep(code, password, passwordConfirmation)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const response = await authService.resetPassword({
        ...buildIdentifierPayload(),
        code: code.trim(),
        password,
        passwordConfirmation,
      })
      showToast(response.message, 'success')
      navigate('/login', { replace: true })
    } catch (error) {
      if (isApiError(error)) {
        handleApiErrors(error, ['username', 'email', 'code', 'password', 'passwordConfirmation'])
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
          <h1 className="text-xl font-semibold text-primary">Redefinir senha</h1>
          <p className="mt-2 text-sm text-text-muted">
            {step === 'request'
              ? 'Informe seu usuário ou e-mail para receber o código de verificação.'
              : 'Informe o código enviado por e-mail e defina sua nova senha.'}
          </p>
        </div>

        {step === 'request' ? (
          <form className="flex flex-col gap-4" onSubmit={handleRequestSubmit} noValidate>
            <Input
              name="identifier"
              label="Usuário ou e-mail"
              required
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              error={errors.identifier ?? errors.username ?? errors.email}
              disabled={isSubmitting}
            />

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar código'}
            </Button>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleConfirmSubmit} noValidate>
            {requestMessage ? (
              <p className="rounded-lg border border-border bg-secondary/60 px-3 py-2.5 text-sm text-text-muted">
                {requestMessage}
              </p>
            ) : null}

            <Input
              name="code"
              label="Código de verificação"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              error={errors.code}
              hint="Código de 6 dígitos válido por 5 minutos."
              disabled={isSubmitting}
            />

            <Input
              name="password"
              type="password"
              label="Nova senha"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              disabled={isSubmitting}
            />

            <Input
              name="passwordConfirmation"
              type="password"
              label="Confirmar nova senha"
              required
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              error={errors.passwordConfirmation}
              disabled={isSubmitting}
            />

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Redefinir senha'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={isSubmitting}
              onClick={() => {
                setStep('request')
                setCode('')
                setPassword('')
                setPasswordConfirmation('')
                setErrors({})
              }}
            >
              Solicitar novo código
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <ArrowLeft size={15} />
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
