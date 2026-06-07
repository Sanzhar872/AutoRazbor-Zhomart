import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin.api'
import { queryKeys } from '@/constants/queryKeys'
import { getApiError } from '@/api/client'

export function useAdminDashboard() {
  return useQuery({ queryKey: queryKeys.adminDashboard, queryFn: adminApi.getDashboard })
}

export function useAdminStock(q?: string, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.adminStock, q ?? '', page],
    queryFn: () => adminApi.getStock(q, page),
  })
}

export function useAdminSales(params?: { status?: string; date_from?: string; date_to?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin-sales', params],
    queryFn: () => adminApi.getSales(params),
  })
}

// Продать товар
export function useCreateSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ partId, qty, comment }: { partId: string; qty: number; comment?: string }) =>
      adminApi.createSale(partId, qty, comment),
    onSuccess: (data) => {
      toast.success(`Продано ${data.qty} шт · ${data.total_kzt.toLocaleString('ru')} KZT`)
      qc.invalidateQueries({ queryKey: queryKeys.adminStock })
      qc.invalidateQueries({ queryKey: queryKeys.adminDashboard })
      qc.invalidateQueries({ queryKey: ['admin-sales'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

// Вернуть продажу
export function useReturnSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (saleId: string) => adminApi.returnSale(saleId),
    onSuccess: (data) => {
      toast.success(`Возврат: ${data.qty} шт · ${data.total_kzt.toLocaleString('ru')} KZT вычтено из выручки`)
      qc.invalidateQueries({ queryKey: queryKeys.adminStock })
      qc.invalidateQueries({ queryKey: queryKeys.adminDashboard })
      qc.invalidateQueries({ queryKey: ['admin-sales'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

// Удалить продажу (исправление ошибки)
export function useDeleteSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (saleId: string) => adminApi.deleteSale(saleId),
    onSuccess: () => {
      toast.success('Запись удалена, склад восстановлен')
      qc.invalidateQueries({ queryKey: queryKeys.adminStock })
      qc.invalidateQueries({ queryKey: queryKeys.adminDashboard })
      qc.invalidateQueries({ queryKey: ['admin-sales'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

// Увеличить склад вручную
export function useIncreaseStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ partId, delta, comment }: { partId: string; delta: number; comment?: string }) =>
      adminApi.increaseStock(partId, delta, comment),
    onSuccess: (data) => {
      toast.success(`Склад пополнен: ${data.stock} шт`)
      qc.invalidateQueries({ queryKey: queryKeys.adminStock })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}
