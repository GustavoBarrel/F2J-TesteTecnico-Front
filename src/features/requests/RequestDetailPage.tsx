import {
  Archive,
  ClipboardList,
  Clock,
  History,
  MessageSquare,
  Pencil,
  Send,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { isApiError } from '../../services/api'
import * as requestService from '../../services/requestService'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { requestDetailBreadcrumbs } from '../../lib/breadcrumbs'
import {
  getAccessDeniedRedirect,
  isAccessDeniedError,
} from '../../lib/resourceAccess'
import {
  REQUEST_HISTORY_ACTION_LABEL,
  type ChangeStatusPayload,
  type Request,
  type RequestDetail,
  type RequestHistoryEntry,
  type RequestMessage,
  type RequestPriority,
  type RequestUserSummary,
} from '../../types/request.types'
import { RequestPriorityBadge, RequestStatusBadge } from './RequestBadges'
import { ObserverPicker } from './ObserverPicker'

const CHANGE_STATUS_OPTIONS: { value: ChangeStatusPayload['status']; label: string }[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
]

const PRIORITY_OPTIONS: { value: RequestPriority; label: string }[] = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
]

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function UserChip({ user }: { user: RequestUserSummary }) {  return (
    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-text">
      @{user.username}
    </span>
  )
}

function mergeRequestUpdate(prev: RequestDetail | null, updated: Request): RequestDetail | null {
  if (!prev) return null
  return { ...prev, ...updated }
}

interface EditModalProps {
  request: Request
  onClose: () => void
  onSaved: (r: Request) => void
}

function EditModal({ request, onClose, onSaved }: EditModalProps) {
  const { showToast } = useToast()
  const [title, setTitle] = useState(request.title)
  const [description, setDescription] = useState(request.description)
  const [priority, setPriority] = useState<RequestPriority>(request.priority)
  const [titleError, setTitleError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setTitleError('Título é obrigatório.'); return }
    setIsSubmitting(true)
    try {
      const updated = await requestService.updateRequest(request.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
      })
      onSaved(updated)
      showToast('Solicitação atualizada.', 'success')
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open title="Editar solicitação" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Título"
          required
          name="title"
          value={title}
          error={titleError}
          onChange={(e) => { setTitle(e.target.value); setTitleError('') }}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-description" className="text-sm font-medium text-text">
            Descrição
          </label>
          <textarea
            id="edit-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <Select
          label="Prioridade"
          name="priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={(e) => setPriority(e.target.value as RequestPriority)}
        />
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface AssignModalProps {
  requestId: string
  sectorId: string
  current: { id: string; firstName: string; lastName: string; email: string }[]
  mode: 'assignees' | 'observers'
  onClose: () => void
  onSaved: (r: Request) => void
}

interface UserOptionRow {
  id: string
  firstName: string
  lastName: string
  email: string
  roleName?: string
}

function AssignModal({ requestId, sectorId, current, mode, onClose, onSaved }: AssignModalProps) {
  const { showToast } = useToast()
  const [assigneeOptions, setAssigneeOptions] = useState<UserOptionRow[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(
    () => new Set(current.map((c) => c.id)),
  )
  const [selectedObservers, setSelectedObservers] = useState<string[]>(
    () => current.map((c) => c.id),
  )
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(mode === 'assignees')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (mode !== 'assignees') return

    setIsLoadingAssignees(true)
    requestService
      .getAssigneeOptions(sectorId)
      .then((members) =>
        setAssigneeOptions(
          members.map((m) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            roleName: m.role.name,
          })),
        ),
      )
      .catch((err) => {
        if (isApiError(err)) showToast(err.message)
      })
      .finally(() => setIsLoadingAssignees(false))
  }, [mode, sectorId, showToast])

  function toggleAssignee(id: string) {
    setSelectedAssignees((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const updated =
        mode === 'assignees'
          ? await requestService.assignRequest(requestId, {
              userIds: Array.from(selectedAssignees),
            })
          : await requestService.setObservers(requestId, { userIds: selectedObservers })
      onSaved(updated)
      showToast(
        mode === 'assignees' ? 'Responsáveis atualizados.' : 'Observadores atualizados.',
        'success',
      )
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (mode === 'observers') {
    return (
      <Modal open title="Gerenciar observadores" onClose={onClose}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            Criador, gerente, admin ou responsável pelo chamado podem adicionar observadores.
          </p>
          <ObserverPicker
            value={selectedObservers}
            onChange={setSelectedObservers}
            knownUsers={current}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </Modal>
    )
  }

  return (
    <Modal open title="Atribuir responsáveis" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isLoadingAssignees ? (
          <p className="text-sm text-text-muted">Carregando...</p>
        ) : assigneeOptions.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhum membro do setor disponível.</p>
        ) : (
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {assigneeOptions.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-secondary"
              >
                <input
                  type="checkbox"
                  checked={selectedAssignees.has(m.id)}
                  onChange={() => toggleAssignee(m.id)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div>
                  <p className="text-sm font-medium text-text">
                    {m.firstName} {m.lastName}
                    {m.roleName ? (
                      <span className="ml-2 text-xs font-normal text-text-muted">
                        {m.roleName}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-text-muted">{m.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isLoadingAssignees}
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function MessageBubble({
  msg,
  currentUserId,
}: {
  msg: RequestMessage
  currentUserId?: string
}) {
  const isOwn = currentUserId != null && msg.author?.id === currentUserId
  const authorLabel = msg.author?.username ?? '—'

  return (
    <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}>
      <div
        className={[
          'flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]',
          isOwn ? 'items-start' : 'items-end',
        ].join(' ')}
      >
        <span className={`text-xs font-medium text-text ${isOwn ? '' : 'text-end'}`}>
          {authorLabel}
        </span>
        <div
          className={[
            'rounded-2xl px-3.5 py-2.5 text-sm text-text',
            isOwn
              ? 'rounded-bl-md border border-accent/25 bg-accent/10'
              : 'rounded-br-md border border-border bg-secondary',
          ].join(' ')}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
        <span className="text-[11px] text-text-muted">
          {dateTimeFormatter.format(new Date(msg.createdAt))}
        </span>
      </div>
    </div>
  )
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [messages, setMessages] = useState<RequestMessage[]>([])
  const [history, setHistory] = useState<RequestHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'messages' | 'history'>('messages')

  const [msgContent, setMsgContent] = useState('')
  const [isSendingMsg, setIsSendingMsg] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [statusValue, setStatusValue] = useState<ChangeStatusPayload['status']>('PENDING')
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [assignMode, setAssignMode] = useState<'assignees' | 'observers' | null>(null)

  const loadRequest = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const req = await requestService.getRequest(id)
      setRequest(req)
      setMessages(req.messages)
      setHistory(req.history)
      setStatusValue(
        req.status === 'NEW' ||
          req.status === 'PENDING' ||
          req.status === 'IN_PROGRESS' ||
          req.status === 'COMPLETED'
          ? (req.status as ChangeStatusPayload['status'])
          : 'PENDING',
      )
    } catch (err) {
      if (isAccessDeniedError(err)) {
        showToast(err.message)
        navigate(getAccessDeniedRedirect(err.statusCode))
      } else if (isApiError(err)) {
        showToast(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [id, navigate, showToast])

  useEffect(() => { void loadRequest() }, [loadRequest])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!msgContent.trim() || !id) return
    setIsSendingMsg(true)
    try {
      const msg = await requestService.sendMessage(id, msgContent.trim())
      setMessages((prev) => [...prev, msg])
      setMsgContent('')
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsSendingMsg(false)
    }
  }

  async function handleChangeStatus() {
    if (!id || !request) return
    setIsChangingStatus(true)
    try {
      const updated = await requestService.changeRequestStatus(id, { status: statusValue })
      setRequest((prev) => mergeRequestUpdate(prev, updated))
      showToast('Status atualizado.', 'success')
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsChangingStatus(false)
    }
  }

  async function handleCancel() {
    if (!id) return
    setIsCancelling(true)
    try {
      const updated = await requestService.cancelRequest(id)
      setRequest((prev) => mergeRequestUpdate(prev, updated))
      setShowCancelModal(false)
      showToast('Solicitação cancelada.', 'success')
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleArchive() {
    if (!id) return
    setIsArchiving(true)
    try {
      const updated = await requestService.archiveRequest(id)
      setRequest((prev) => mergeRequestUpdate(prev, updated))
      setShowArchiveModal(false)
      showToast('Solicitação arquivada.', 'success')
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsArchiving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="h-20 animate-pulse rounded-xl bg-secondary/40" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="h-[28rem] animate-pulse rounded-xl bg-secondary/40 lg:col-span-3" />
          <div className="h-64 animate-pulse rounded-xl bg-secondary/40 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!request) return null

  const isTerminal = request.status === 'CANCELLED' || request.status === 'ARCHIVED'
  const canCancel = !isTerminal && request.status !== 'COMPLETED'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader
        breadcrumbs={requestDetailBreadcrumbs(request.title)}
        icon={<ClipboardList size={20} />}
        title={request.title}
        subtitle={`${request.sector.name} · ${request.sectorService.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {request.permissions.canEdit && !isTerminal ? (
              <Button variant="secondary" onClick={() => setShowEditModal(true)}>
                <Pencil size={15} />
                Editar
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="danger" onClick={() => setShowCancelModal(true)}>
                <X size={15} />
                Cancelar
              </Button>
            ) : null}
            {request.permissions.canArchive && request.status === 'COMPLETED' ? (
              <Button variant="secondary" onClick={() => setShowArchiveModal(true)}>
                <Archive size={15} />
                Arquivar
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <RequestStatusBadge status={request.status} />
        <RequestPriorityBadge priority={request.priority} />
        <span className="text-xs text-text-muted">
          @{request.createdBy.username} · {dateTimeFormatter.format(new Date(request.createdAt))}
        </span>
      </div>

      {isTerminal ? (
        <div className="rounded-lg border border-border bg-secondary/60 px-4 py-2.5 text-sm text-text-muted">
          {request.status === 'CANCELLED'
            ? 'Solicitação cancelada — somente leitura.'
            : 'Solicitação arquivada — somente leitura.'}
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* Esquerda: mensagens e histórico */}
        <div className="order-2 flex min-h-[28rem] flex-col lg:order-1 lg:col-span-3 lg:min-h-[calc(100vh-14rem)]">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex shrink-0 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={[
                  'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors',
                  activeTab === 'messages'
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-text-muted hover:text-text',
                ].join(' ')}
              >
                <MessageSquare size={15} />
                Mensagens ({messages.length})
              </button>
              {user?.isGlobalAdmin ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={[
                    'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors',
                    activeTab === 'history'
                      ? 'border-b-2 border-accent text-accent'
                      : 'text-text-muted hover:text-text',
                  ].join(' ')}
                >
                  <History size={15} />
                  Histórico
                </button>
              ) : null}
            </div>

            {activeTab === 'messages' ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-5">
                  {messages.length === 0 ? (
                    <p className="text-sm text-text-muted">Nenhuma mensagem ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} currentUserId={user?.sub} />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {!isTerminal ? (
                  <form
                    onSubmit={handleSendMessage}
                    className="flex shrink-0 gap-2 border-t border-border bg-surface p-4"
                  >
                    <input
                      value={msgContent}
                      onChange={(e) => setMsgContent(e.target.value)}
                      placeholder="Escreva uma mensagem..."
                      maxLength={2000}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <Button type="submit" variant="primary" disabled={isSendingMsg || !msgContent.trim()}>
                      <Send size={15} />
                    </Button>
                  </form>
                ) : null}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5">
                {history.length === 0 ? (
                  <p className="text-sm text-text-muted">Nenhum evento registrado.</p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {history.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text">
                            {REQUEST_HISTORY_ACTION_LABEL[entry.action]}
                          </p>
                          {entry.description ? (
                            <p className="mt-0.5 text-sm text-text-muted">{entry.description}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-text-muted">
                            {entry.user.username} ·{' '}
                            {dateTimeFormatter.format(new Date(entry.createdAt))}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Direita: descrição e detalhes */}
        <div className="order-1 flex flex-col gap-4 lg:order-2 lg:col-span-2">
          <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Descrição
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
              {request.description}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Detalhes
            </h3>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-text-muted">Setor</dt>
                <dd className="mt-0.5 text-text">{request.sector.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Serviço</dt>
                <dd className="mt-0.5 text-text">{request.sectorService.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Criado por</dt>
                <dd className="mt-0.5 text-text">@{request.createdBy.username}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted flex items-center gap-1">
                  <Clock size={12} /> Atualizada em
                </dt>
                <dd className="mt-0.5 text-xs leading-snug text-text">
                  {dateTimeFormatter.format(new Date(request.updatedAt))}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <UserCheck size={13} /> Responsáveis
                </h4>
                {request.permissions.canEdit && !isTerminal ? (
                  <button
                    type="button"
                    onClick={() => setAssignMode('assignees')}
                    className="text-xs text-accent hover:underline"
                  >
                    Editar
                  </button>
                ) : null}
              </div>
              {request.assignees.length === 0 ? (
                <p className="text-xs text-text-muted">Nenhum responsável atribuído.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {request.assignees.map((a) => (
                    <UserChip key={a.id} user={a} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <Users size={13} /> Observadores
                </h4>
                {request.permissions.canManageObservers && !isTerminal ? (
                  <button
                    type="button"
                    onClick={() => setAssignMode('observers')}
                    className="text-xs text-accent hover:underline"
                  >
                    Editar
                  </button>
                ) : null}
              </div>
              {request.observers.length === 0 ? (
                <p className="text-xs text-text-muted">Nenhum observador definido.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {request.observers.map((o) => (
                    <UserChip key={o.id} user={o} />
                  ))}
                </div>
              )}
            </div>

            {request.permissions.canEdit && !isTerminal ? (
              <div className="mt-4 border-t border-border pt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Alterar status
                </h4>
                <div className="flex flex-col gap-2">
                  <Select
                    label="Novo status"
                    hideLabel
                    name="changeStatus"
                    options={CHANGE_STATUS_OPTIONS}
                    value={statusValue}
                    onChange={(e) =>
                      setStatusValue(e.target.value as ChangeStatusPayload['status'])
                    }
                  />
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isChangingStatus || statusValue === request.status}
                    onClick={handleChangeStatus}
                  >
                    {isChangingStatus ? 'Salvando...' : 'Confirmar status'}
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {/* Modals */}
      {showEditModal ? (
        <EditModal
          request={request}
          onClose={() => setShowEditModal(false)}
          onSaved={(r) => {
            setRequest((prev) => mergeRequestUpdate(prev, r))
            setShowEditModal(false)
          }}
        />
      ) : null}

      {assignMode ? (
        <AssignModal
          requestId={request.id}
          sectorId={request.sectorId}
          current={assignMode === 'assignees' ? request.assignees : request.observers}
          mode={assignMode}
          onClose={() => setAssignMode(null)}
          onSaved={(r) => {
            setRequest((prev) => mergeRequestUpdate(prev, r))
            setAssignMode(null)
          }}
        />
      ) : null}

      <ConfirmDeleteModal
        open={showCancelModal}
        title="Cancelar solicitação"
        description={`Tem certeza que deseja cancelar a solicitação "${request.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Cancelar solicitação"
        isLoading={isCancelling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      <ConfirmDeleteModal
        open={showArchiveModal}
        title="Arquivar solicitação"
        description={`Tem certeza que deseja arquivar a solicitação "${request.title}"?`}
        confirmLabel="Arquivar"
        isLoading={isArchiving}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveModal(false)}
      />
    </div>
  )
}
