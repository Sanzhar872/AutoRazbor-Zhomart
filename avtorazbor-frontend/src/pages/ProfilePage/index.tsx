import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/layout/PageContainer'
import { ROUTES } from '@/constants/routes'

export function ProfilePage() {
  const { user, refreshToken, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {})
    clearAuth()
    toast.success('Вы вышли из аккаунта')
    navigate(ROUTES.HOME)
  }

  if (!user) return null

  return (
    <>
      <Helmet><title>Профиль — АвтоРазбор</title></Helmet>
      <PageContainer className="max-w-lg pb-24 md:pb-8">
        <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
          <div className="bg-accent/10 border-b border-border px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <User size={24} />
            </div>
            <div>
              <p className="font-semibold text-text-primary">{user.full_name}</p>
              <p className="text-sm text-text-secondary">{user.email}</p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-3">
            <div className="flex justify-between text-sm py-2 border-b border-border">
              <span className="text-text-muted">Роль</span>
              <span className="text-text-primary capitalize">{user.role === 'admin' ? 'Администратор' : 'Покупатель'}</span>
            </div>
            {user.phone && (
              <div className="flex justify-between text-sm py-2 border-b border-border">
                <span className="text-text-muted">Телефон</span>
                <span className="text-text-primary">{user.phone}</span>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-danger mt-4 w-full justify-start gap-2"
            >
              <LogOut size={16} />
              Выйти из аккаунта
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
