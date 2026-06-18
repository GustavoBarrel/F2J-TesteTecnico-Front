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
  REQUEST_PRIORITY_LABEL,
  REQUEST_STATUS_LABEL,
  type ChangeStatusPayload,
  type Request,
  type RequestHistoryEntry,
  type RequestMessage,
  type RequestPriority,
  type RequestStatus,
  type SectorMemberOption,
} from '../../types/request.types'
import { RequestPriorityBadge, RequestStatusBadge } from './RequestBadges'

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

function fullName(u: { firstName: string; lastName: string }) {
  return `${u.firstName} ${u.lastName}`
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

function AssignModal({ requestId, sectorId, current, mode, onClose, onSaved }: AssignModalProps) {
  const { showToast } = useToast()
  const [members, setMembers] = useState<SectorMemberOption[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(current.map((c) => c.id)))
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    requestService.getSectorMembersOptions(sectorId)
      .then(setMembers)
      .catch((err) => { if (isApiError(err)) showToast(err.message) })
      .finally(() => setIsLoading(false))
  }, [sectorId, showToast])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = { userIds: Array.from(selected) }
      const updated = mode === 'assignees'
        ? await requestService.assignRequest(requestId, payload)
        : await requestService.setObservers(requestId, payload)
      onSaved(updated)
      showToast(mode === 'assignees' ? 'Atribuídos atualizados.' : 'Observadores atualizados.', 'success')
    } catch (err) {
      if (isApiError(err)) showToast(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'assignees' ? 'Atribuir responsáveis' : 'Definir observadores'

  return (
    <Modal open title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isLoading ? (
          <p className="text-sm text-text-muted">Carregando membros...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhum membro disponível.</p>
        ) : (
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {members.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-secondary">
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={() => toggle(m.id)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <div>
                  <p className="text-sm font-medium text-text">{m.firstName} {m.lastName}</p>
                  <p className="text-xs text-text-muted">{m.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Salvando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function MessageBubble({ msg }: { msg: RequestMessage }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-text">
          {msg.author ? fullName(msg.author) : msg.authorId}
        </span>
        <span className="text-xs text-text-muted">
          {dateTimeFormatter.format(new Date(msg.createdAt))}
        </span>
      </div>
      <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-text">
        {msg.content}
      </div>
    </div>
  )
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { user } = useAuth()

  const [request, setRequest] = useState<Request | null>(null)
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
    try {
      const [req, msgs] = await Promise.all([
        requestService.getRequest(id),
        requestService.getMessages(id),
      ])
      setRequest(req)
      setMessages(msgs)
      setStatusValue(
        req.status === 'NEW' || req.status === 'PENDING' || req.status === 'IN_PROGRESS' || req.status === 'COMPLETED'
          ? (req.status as ChangeStatusPayload['status'])
          : 'PENDING',
      )
      if (user?.isGlobalAdmin) {
        requestService.getHistory(id)
          .then(setHistory)
          .catch(() => {})
      }
    } catch (err) {
      if (isApiError(err)) {
        showToast(err.message)
        navigate('/solicitacoes')
      }
    } finally {
      setIsLoading(false)
    }
  }, [id, navigate, showToast, user?.isGlobalAdmin])

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
      setRequest(updated)
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
      setRequest(updated)
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
      setRequest(updated)
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
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="h-20 animate-pulse rounded-xl bg-secondary/40" />
        <div className="h-64 animate-pulse rounded-xl bg-secondary/40" />
      </div>
    )
  }

  if (!request) return null

  const isTerminal = request.status === 'CANCELLED' || request.status === 'ARCHIVED'
  const canCancel = !isTerminal && request.status !== 'COMPLETED'

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        breadcrumbs={requestDetailBreadcrumbs(request.title)}
        icon={<ClipboardList size={20} />}
        title={request.title}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Description */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold text-text-muted uppercase tracking-wide">
              Descrição
            </h3>
            <p className="whitespace-pre-wrap text-sm text-text">{request.description}</p>
          </section>

          {/* Messages / History tabs */}
          <section className="rounded-xl border border-border bg-surface">
            <div className="flex border-b border-border">
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
              <div className="flex flex-col gap-4 p-5">
                {messages.length === 0 ? (
                  <p className="text-sm text-text-muted">Nenhuma mensagem ainda.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {!isTerminal ? (
                  <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border pt-4">
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
              <div className="p-5">
                {history.length === 0 ? (
                  <p className="text-sm text-text-muted">Nenhum evento registrado.</p>
                ) : (
                  <ol className="flex flex-col gap-3">
                    {history.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm text-text">{entry.event}{entry.description ? ` — ${entry.description}` : ''}</p>
                          <p className="text-xs text-text-muted">
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

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Meta info */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-text-muted uppercase tracking-wide">
              Informações
            </h3>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs text-text-muted">Status</dt>
                <dd className="mt-1">
                  <RequestStatusBadge status={request.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Prioridade</dt>
                <dd className="mt-1">
                  <RequestPriorityBadge priority={request.priority} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted flex items-center gap-1">
                  <Clock size={12} /> Criada em
                </dt>
                <dd className="mt-0.5 text-text">
                  {dateTimeFormatter.format(new Date(request.createdAt))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted flex items-center gap-1">
                  <Clock size={12} /> Atualizada em
                </dt>
                <dd className="mt-0.5 text-text">
                  {dateTimeFormatter.format(new Date(request.updatedAt))}
                </dd>
              </div>
            </dl>
          </section>

          {/* Change status */}
          {request.permissions.canEdit && !isTerminal ? (
            <section className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold text-text-muted uppercase tracking-wide">
                Alterar status
              </h3>
              <div className="flex flex-col gap-2">
                <Select
                  label="Novo status"
                  hideLabel
                  name="changeStatus"
                  options={CHANGE_STATUS_OPTIONS}
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as ChangeStatusPayload['status'])}
                />
                <Button
                  variant="primary"
                  fullWidth
                  disabled={
                    isChangingStatus ||
                    statusValue === request.status
                  }
                  onClick={handleChangeStatus}
                >
                  {isChangingStatus ? 'Salvando...' : 'Confirmar status'}
                </Button>
              </div>
            </section>
          ) : null}

          {/* Assignees */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1">
                <UserCheck size={14} /> Responsáveis
              </h3>
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
              <ul className="flex flex-col gap-2">
                {request.assignees.map((a) => (
                  <li key={a.id} className="text-sm text-text">{fullName(a)}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Observers */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1">
                <Users size={14} /> Observadores
              </h3>
              {request.permissions.canEdit && !isTerminal ? (
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
              <ul className="flex flex-col gap-2">
                {request.observers.map((o) => (
                  <li key={o.id} className="text-sm text-text">{fullName(o)}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Modals */}
      {showEditModal ? (
        <EditModal
          request={request}
          onClose={() => setShowEditModal(false)}
          onSaved={(r) => { setRequest(r); setShowEditModal(false) }}
        />
      ) : null}

      {assignMode ? (
        <AssignModal
          requestId={request.id}
          sectorId={request.sectorId}
          current={assignMode === 'assignees' ? request.assignees : request.observers}
          mode={assignMode}
          onClose={() => setAssignMode(null)}
          onSaved={(r) => { setRequest(r); setAssignMode(null) }}
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
