import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin.api'
import { queryKeys } from '@/constants/queryKeys'
import { getApiError } from '@/api/client'

export function useDeleteSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (auditId: string) => adminApi.deleteSale(auditId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminDashboard })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useRestoreSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (auditId: string) => adminApi.restoreSale(auditId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminDashboard })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useAdminDashboard() {
  return useQuery({ queryKey: queryKeys.adminDashboard, queryFn: adminApi.getDashboard })
}

export function useAdminStock() {
  return useQuery({ queryKey: queryKeys.adminStock, queryFn: adminApi.getStock })
}

export function useStockChange() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      partId,
      action,
      value,
      comment,
    }: {
      partId: string
      action: 'increase' | 'decrease' | 'set' | 'return'
      value: number
      comment?: string
    }) => {
      if (action === 'decrease') return adminApi.decreaseStock(partId, value, comment)
      if (action === 'return') return adminApi.returnStock(partId, value, comment)
      if (action === 'increase') return adminApi.increaseStock(partId, value, comment)
      return adminApi.setStock(partId, value, comment)
    },
    onSuccess: (data, vars) => {
      if (vars.action === 'decrease') {
        toast.success(`Продано — остаток: ${data.stock_before} → ${data.stock_after} шт`)
      } else if (vars.action === 'return') {
        toast.success(`Возврат — остаток: ${data.stock_before} → ${data.stock_after} шт`)
      } else {
        toast.success(`Остаток установлен: ${data.stock_after} шт`)
      }
      qc.invalidateQueries({ queryKey: queryKeys.adminStock })
      qc.invalidateQueries({ queryKey: queryKeys.adminDashboard })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}
