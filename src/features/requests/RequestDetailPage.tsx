import {
  Archive,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  MessageSquare,
  Pencil,
  RotateCcw,
  Send,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
import type { PaginatedMeta } from '../../types/api.types'
import {
  REQUEST_HISTORY_ACTION_LABEL,
  type Request,
  type RequestDetail,
  type RequestHistoryEntry,
  type RequestMessage,
  type RequestPriority,
  type RequestStatus,
  type RequestUserSummary,
} from '../../types/request.types'
import { RequestPriorityBadge, RequestStatusBadge } from './RequestBadges'
import { ObserverPicker } from './ObserverPicker'

const BLOCKED_STATUSES: RequestStatus[] = ['COMPLETED', 'CANCELLED', 'ARCHIVED']

function isBlockedStatus(status: RequestStatus) {
  return BLOCKED_STATUSES.includes(status)
}

function blockedStatusBanner(status: RequestStatus): string | null {
  if (status === 'CANCELLED') return 'Solicitação cancelada — somente leitura.'
  if (status === 'ARCHIVED') return 'Solicitação arquivada — somente leitura.'
  if (status === 'SOLVED') {
    return 'Solução apresentada — aguardando confirmação do requerente.'
  }
  if (status === 'COMPLETED') {
    return 'Solicitação concluída — edição, mensagens e observadores bloqueados.'
  }
  return null
}

type ChangeableStatus = 'PENDING' | 'IN_PROGRESS'

const CHANGE_STATUS_OPTIONS: { value: ChangeableStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
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

const MESSAGE_PAGE_SIZE = 12

const MESSAGES_PANEL_CLASS =
  'order-1 flex h-[min(20rem,calc(100dvh-16rem))] flex-col sm:h-[24rem] md:h-[28rem] lg:order-1 lg:col-span-3 lg:h-[36rem] xl:h-[42rem] 2xl:h-[46rem]'

function sortMessagesByDate(messages: RequestMessage[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

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
          <div className="scrollbar-subtle flex max-h-64 flex-col gap-2 overflow-y-auto">
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
          'flex max-w-[92%] flex-col gap-1 sm:max-w-[82%] lg:max-w-[75%]',
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
  const { requestId: id } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()

  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [messages, setMessages] = useState<RequestMessage[]>([])
  const [messagesMeta, setMessagesMeta] = useState<PaginatedMeta | null>(null)
  const [history, setHistory] = useState<RequestHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'messages' | 'history'>('messages')
  const [oldestLoadedPage, setOldestLoadedPage] = useState(1)
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)

  const [msgContent, setMsgContent] = useState('')
  const [isSendingMsg, setIsSendingMsg] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const shouldScrollToBottomRef = useRef(false)
  const scrollPreserveRef = useRef<{ height: number; top: number } | null>(null)

  const [statusValue, setStatusValue] = useState<ChangeableStatus>('PENDING')
  const [priorityValue, setPriorityValue] = useState<RequestPriority>('MEDIUM')
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isChangingPriority, setIsChangingPriority] = useState(false)
  const [isMarkingSolved, setIsMarkingSolved] = useState(false)
  const [isReviewingSolution, setIsReviewingSolution] = useState(false)

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
      setHistory(req.history)
      setStatusValue(
        req.status === 'PENDING' || req.status === 'IN_PROGRESS'
          ? req.status
          : 'PENDING',
      )
      setPriorityValue(req.priority)
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

  const loadInitialMessages = useCallback(async () => {
    if (!id) return

    try {
      const peek = await requestService.getMessages(id, {
        page: 1,
        limit: MESSAGE_PAGE_SIZE,
      })
      const lastPage = Math.max(peek.meta.totalPages, 1)

      const res =
        lastPage === 1
          ? peek
          : await requestService.getMessages(id, {
              page: lastPage,
              limit: MESSAGE_PAGE_SIZE,
            })

      setMessagesMeta(res.meta)
      setOldestLoadedPage(lastPage)
      setMessages(sortMessagesByDate(res.data))
      shouldScrollToBottomRef.current = true
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    }
  }, [id, showToast])

  const loadOlderMessages = useCallback(async () => {
    if (!id || oldestLoadedPage <= 1) return

    setIsLoadingMoreMessages(true)
    const previousPage = oldestLoadedPage - 1

    try {
      const res = await requestService.getMessages(id, {
        page: previousPage,
        limit: MESSAGE_PAGE_SIZE,
      })

      const container = messagesScrollRef.current
      if (container) {
        scrollPreserveRef.current = {
          height: container.scrollHeight,
          top: container.scrollTop,
        }
      }

      setOldestLoadedPage(previousPage)
      setMessagesMeta((prev) =>
        prev ? { ...prev, total: res.meta.total, totalPages: res.meta.totalPages } : res.meta,
      )

      setMessages((prev) => {
        const merged = [...sortMessagesByDate(res.data), ...prev]
        const unique = new Map(merged.map((msg) => [msg.id, msg]))
        return sortMessagesByDate(Array.from(unique.values()))
      })
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsLoadingMoreMessages(false)
    }
  }, [id, oldestLoadedPage, showToast])

  useEffect(() => {
    void loadInitialMessages()
  }, [loadInitialMessages])

  useLayoutEffect(() => {
    const container = messagesScrollRef.current
    const preserve = scrollPreserveRef.current

    if (container && preserve) {
      container.scrollTop = container.scrollHeight - preserve.height + preserve.top
      scrollPreserveRef.current = null
      return
    }

    if (!shouldScrollToBottomRef.current) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    shouldScrollToBottomRef.current = false
  }, [messages])

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault()
    if (!msgContent.trim() || !id) return
    setIsSendingMsg(true)
    try {
      const msg = await requestService.sendMessage(id, msgContent.trim())
      setMsgContent('')
      setMessages((prev) => sortMessagesByDate([...prev, msg]))
      setMessagesMeta((prev) => (prev ? { ...prev, total: prev.total + 1 } : prev))
      shouldScrollToBottomRef.current = true
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

  async function handleChangePriority() {
    if (!id || !request) return
    setIsChangingPriority(true)
    try {
      const updated = await requestService.updateRequest(id, { priority: priorityValue })
      setRequest((prev) => mergeRequestUpdate(prev, updated))
      showToast('Prioridade atualizada.', 'success')
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsChangingPriority(false)
    }
  }

  async function handleMarkSolved() {
    if (!id || !request) return
    setIsMarkingSolved(true)
    try {
      const updated = await requestService.changeRequestStatus(id, { status: 'SOLVED' })
      setRequest((prev) => mergeRequestUpdate(prev, updated))
      showToast('Solicitação marcada como solucionada.', 'success')
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsMarkingSolved(false)
    }
  }

  async function handleReviewSolution(approved: boolean) {
    if (!id || !request) return
    setIsReviewingSolution(true)
    try {
      const updated = await requestService.reviewSolution(id, { approved })
      setRequest((prev) => mergeRequestUpdate(prev, updated))
      showToast(
        approved ? 'Solução aprovada — solicitação concluída.' : 'Solução rejeitada — retornou para andamento.',
        'success',
      )
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsReviewingSolution(false)
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
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-5">
        <div className="h-20 animate-pulse rounded-xl bg-secondary/40" />
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
          <div
            className={`${MESSAGES_PANEL_CLASS} animate-pulse rounded-xl bg-secondary/40`}
          />
          <div className="order-2 h-64 animate-pulse rounded-xl bg-secondary/40 lg:order-2 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!request) return null

  const { permissions } = request
  const blockedBanner = blockedStatusBanner(request.status)
  const hasMoreMessages = oldestLoadedPage > 1
  const messagesTotal = messagesMeta?.total ?? messages.length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-5">
      <PageHeader
        breadcrumbs={requestDetailBreadcrumbs(request.title)}
        icon={<ClipboardList size={20} />}
        title={request.title}
        subtitle={`${request.sector.name} · ${request.sectorService.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {permissions.canEdit ? (
              <Button variant="secondary" onClick={() => setShowEditModal(true)}>
                <Pencil size={15} />
                Editar
              </Button>
            ) : null}
            {permissions.canEdit && !isBlockedStatus(request.status) ? (
              <Button variant="danger" onClick={() => setShowCancelModal(true)}>
                <X size={15} />
                Cancelar
              </Button>
            ) : null}
            {permissions.canArchive ? (
              <Button variant="secondary" onClick={() => setShowArchiveModal(true)}>
                <Archive size={15} />
                Arquivar
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <RequestStatusBadge status={request.status} />
        <RequestPriorityBadge priority={request.priority} />
        <span className="min-w-0 text-xs text-text-muted">
          @{request.createdBy.username} · {dateTimeFormatter.format(new Date(request.createdAt))}
        </span>
      </div>

      {blockedBanner ? (
        <div className="rounded-lg border border-border bg-secondary/60 px-4 py-2.5 text-sm text-text-muted">
          {blockedBanner}
        </div>
      ) : null}

      <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Esquerda: mensagens e histórico */}
        <div className={MESSAGES_PANEL_CLASS}>
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex shrink-0 overflow-x-auto border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={[
                  'flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors sm:gap-2 sm:px-5 sm:py-3 sm:text-sm',
                  activeTab === 'messages'
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-text-muted hover:text-text',
                ].join(' ')}
              >
                <MessageSquare size={15} />
                Mensagens ({messagesTotal})
              </button>
              {user?.isGlobalAdmin ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={[
                    'flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors sm:gap-2 sm:px-5 sm:py-3 sm:text-sm',
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
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  ref={messagesScrollRef}
                  className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto p-3 sm:p-5"
                >
                  {messages.length === 0 ? (
                    <p className="text-sm text-text-muted">Nenhuma mensagem ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-3 sm:gap-4">
                      {hasMoreMessages ? (
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            className="sm:w-auto"
                            disabled={isLoadingMoreMessages}
                            onClick={() => void loadOlderMessages()}
                          >
                            {isLoadingMoreMessages
                              ? 'Carregando...'
                              : 'Carregar mensagens anteriores'}
                          </Button>
                        </div>
                      ) : null}
                      {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} currentUserId={user?.sub} />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {permissions.canMessage ? (
                  <form
                    onSubmit={handleSendMessage}
                    className="flex shrink-0 gap-2 border-t border-border bg-surface p-3 sm:p-4"
                  >
                    <input
                      value={msgContent}
                      onChange={(e) => setMsgContent(e.target.value)}
                      placeholder="Escreva uma mensagem..."
                      maxLength={2000}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSendingMsg || !msgContent.trim()}
                      aria-label="Enviar mensagem"
                    >
                      <Send size={15} />
                    </Button>
                  </form>
                ) : null}
              </div>
            ) : (
              <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
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
        <div className="order-2 flex flex-col gap-4 lg:order-2 lg:col-span-2">
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

            <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2 sm:gap-x-4">
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
                {permissions.canEdit ? (
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
                {permissions.canManageObservers ? (
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

            {permissions.canChangeStatus && !isBlockedStatus(request.status) ? (
              <div className="mt-4 border-t border-border pt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Alterar prioridade
                </h4>
                <div className="flex flex-col gap-2">
                  <Select
                    label="Nova prioridade"
                    hideLabel
                    name="changePriority"
                    options={PRIORITY_OPTIONS}
                    value={priorityValue}
                    onChange={(e) => setPriorityValue(e.target.value as RequestPriority)}
                  />
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={isChangingPriority || request.priority === priorityValue}
                    onClick={handleChangePriority}
                  >
                    {isChangingPriority ? 'Salvando...' : 'Confirmar prioridade'}
                  </Button>
                </div>
              </div>
            ) : null}

            {permissions.canChangeStatus ? (
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
                    onChange={(e) => setStatusValue(e.target.value as ChangeableStatus)}
                  />
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={
                      isChangingStatus ||
                      request.status === statusValue ||
                      request.status === 'SOLVED' ||
                      request.status === 'COMPLETED'
                    }
                    onClick={handleChangeStatus}
                  >
                    {isChangingStatus ? 'Salvando...' : 'Confirmar status'}
                  </Button>
                  {request.status !== 'SOLVED' && request.status !== 'COMPLETED' ? (
                    <Button
                      variant="primary"
                      fullWidth
                      disabled={isMarkingSolved}
                      onClick={handleMarkSolved}
                    >
                      <CheckCircle2 size={15} />
                      {isMarkingSolved ? 'Salvando...' : 'Marcar como solucionado'}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {permissions.canReviewSolution && request.status === 'SOLVED' ? (
              <div className="mt-4 border-t border-border pt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Revisão da solução
                </h4>
                <p className="mb-3 text-xs text-text-muted">
                  Confirme se a solução atende à sua solicitação ou solicite retorno para andamento.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={isReviewingSolution}
                    onClick={() => void handleReviewSolution(true)}
                  >
                    <CheckCircle2 size={15} />
                    {isReviewingSolution ? 'Salvando...' : 'Aprovar solução'}
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={isReviewingSolution}
                    onClick={() => void handleReviewSolution(false)}
                  >
                    <RotateCcw size={15} />
                    Retornar para andamento
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
