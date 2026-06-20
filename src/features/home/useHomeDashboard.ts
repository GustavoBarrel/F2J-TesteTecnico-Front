import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { isApiError } from '../../services/api'
import * as meService from '../../services/meService'
import * as requestService from '../../services/requestService'
import type { MeSector, Request } from '../../types/request.types'
import {
  buildActionInbox,
  countSectorOpen,
  filterAssignedActiveRequests,
  filterFinalRequests,
  filterSectorPreviewRequests,
  isOpenStatus,
  needsRequesterReview,
  sortByUrgency,
} from './homeUtils'

const FETCH_LIMIT = 50
const PREVIEW_LIMIT = 5
const ACTION_LIMIT = 10

export interface SectorOverviewData {
  sector: MeSector
  queueRequests: Request[]
  assignedRequests: Request[]
  queueTotal: number
  assignedTotal: number
  activeTotal: number
  isLoading: boolean
}

export function useHomeDashboard(userId?: string) {
  const { showToast } = useToast()
  const [sectors, setSectors] = useState<MeSector[]>([])
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [assignedRequests, setAssignedRequests] = useState<Request[]>([])
  const [sectorOverview, setSectorOverview] = useState<SectorOverviewData[]>([])
  const [isLoadingSectors, setIsLoadingSectors] = useState(true)
  const [isLoadingMy, setIsLoadingMy] = useState(true)
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(true)

  useEffect(() => {
    setIsLoadingSectors(true)
    meService
      .getMySectors()
      .then(setSectors)
      .catch((err) => {
        if (isApiError(err)) showToast(err.message)
      })
      .finally(() => setIsLoadingSectors(false))
  }, [showToast])

  const loadMyRequests = useCallback(() => {
    setIsLoadingMy(true)
    requestService
      .getMyRequests({ limit: FETCH_LIMIT })
      .then((res) => setMyRequests(res.data))
      .catch((err) => {
        if (isApiError(err)) showToast(err.message)
      })
      .finally(() => setIsLoadingMy(false))
  }, [showToast])

  useEffect(() => {
    loadMyRequests()
  }, [loadMyRequests])

  useEffect(() => {
    setIsLoadingAssigned(true)
    requestService
      .getAssignedRequests({ limit: FETCH_LIMIT })
      .then((res) => setAssignedRequests(res.data))
      .catch((err) => {
        if (isApiError(err)) showToast(err.message)
      })
      .finally(() => setIsLoadingAssigned(false))
  }, [showToast])

  useEffect(() => {
    if (sectors.length === 0) {
      setSectorOverview([])
      return
    }

    setSectorOverview(
      sectors.map((sector) => ({
        sector,
        queueRequests: [],
        assignedRequests: [],
        queueTotal: 0,
        assignedTotal: 0,
        activeTotal: countSectorOpen([sector]),
        isLoading: true,
      })),
    )

    void Promise.all(
      sectors.map(async (sector) => {
        try {
          const [queueRes, allRes] = await Promise.all([
            requestService.getSectorRequests(sector.id, {
              scope: 'queue',
              limit: PREVIEW_LIMIT,
            }),
            requestService.getSectorRequests(sector.id, { limit: FETCH_LIMIT }),
          ])
          const assignedPool = filterAssignedActiveRequests(allRes.data)

          return {
            sector,
            queueRequests: filterSectorPreviewRequests(queueRes.data, PREVIEW_LIMIT),
            assignedRequests: filterSectorPreviewRequests(assignedPool, PREVIEW_LIMIT),
            queueTotal: queueRes.meta.total,
            assignedTotal: assignedPool.length,
            activeTotal: countSectorOpen([sector]),
            isLoading: false,
          }
        } catch (err) {
          if (isApiError(err)) showToast(err.message)
          return {
            sector,
            queueRequests: [],
            assignedRequests: [],
            queueTotal: 0,
            assignedTotal: 0,
            activeTotal: countSectorOpen([sector]),
            isLoading: false,
          }
        }
      }),
    ).then(setSectorOverview)
  }, [sectors, showToast])

  const openMyRequests = useMemo(
    () =>
      myRequests
        .filter((request) => isOpenStatus(request.status))
        .sort(sortByUrgency)
        .slice(0, PREVIEW_LIMIT),
    [myRequests],
  )

  const openMyTotal = useMemo(
    () => myRequests.filter((request) => isOpenStatus(request.status)).length,
    [myRequests],
  )

  const completedRequests = useMemo(
    () => filterFinalRequests(myRequests, PREVIEW_LIMIT),
    [myRequests],
  )

  const completedTotal = useMemo(
    () => myRequests.filter((request) => !isOpenStatus(request.status)).length,
    [myRequests],
  )

  const assignedWork = useMemo(
    () => assignedRequests.filter((request) => isOpenStatus(request.status)),
    [assignedRequests],
  )

  const pendingApproval = useMemo(
    () => myRequests.filter((request) => needsRequesterReview(request, userId)),
    [myRequests, userId],
  )

  const actionItems = useMemo(() => {
    if (!userId) return []
    return buildActionInbox(assignedRequests, myRequests, userId, ACTION_LIMIT)
  }, [assignedRequests, myRequests, userId])

  const sectorActiveCount = useMemo(() => countSectorOpen(sectors), [sectors])

  const sectorQueueCount = useMemo(
    () => sectorOverview.reduce((acc, sector) => acc + sector.queueTotal, 0),
    [sectorOverview],
  )

  const sectorAssignedCount = useMemo(
    () => sectorOverview.reduce((acc, sector) => acc + sector.assignedTotal, 0),
    [sectorOverview],
  )

  return {
    sectors,
    sectorOverview,
    openMyRequests,
    openMyTotal,
    completedRequests,
    completedTotal,
    assignedWork,
    pendingApproval,
    actionItems,
    sectorActiveCount,
    sectorQueueCount,
    sectorAssignedCount,
    isLoadingSectors,
    isLoadingMy,
    isLoadingAssigned,
    isLoadingAction: isLoadingMy || isLoadingAssigned,
    hasSectors: !isLoadingSectors && sectors.length > 0,
  }
}
