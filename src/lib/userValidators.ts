export function mapFieldErrors(
  fields: Record<string, string[]> | undefined,
): Record<string, string> {
  if (!fields) return {}

  return Object.fromEntries(
    Object.entries(fields).map(([key, messages]) => [key, messages[0]]),
  )
}

export function validateUserForm(
  values: {
    firstName: string
    lastName: string
    email: string
    username: string
    password: string
    confirmPassword: string
  },
  mode: 'create' | 'edit',
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!values.firstName.trim()) errors.firstName = 'O nome é obrigatório.'
  if (!values.lastName.trim()) errors.lastName = 'O sobrenome é obrigatório.'
  if (!values.email.trim()) {
    errors.email = 'O e-mail é obrigatório.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (mode === 'create' && !values.password) {
    errors.password = 'A senha é obrigatória.'
  } else if (values.password && values.password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.'
  }

  if (mode === 'create') {
    if (!values.confirmPassword) {
      errors.confirmPassword = 'A confirmação de senha é obrigatória.'
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem.'
    }
  }

  return errors
}
