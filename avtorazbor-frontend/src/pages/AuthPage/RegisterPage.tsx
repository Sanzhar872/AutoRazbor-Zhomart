import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { toast } from 'sonner'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

const schema = z.object({
  full_name: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Неверный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register(data)
      const { access_token, refresh_token } = await authApi.login(data.email, data.password)
      useAuthStore.getState().setAccessToken(access_token)
      const user = await authApi.me()
      setAuth(user, access_token, refresh_token)
      toast.success('Аккаунт создан!')
      navigate(ROUTES.HOME)
    } catch {
      toast.error('Ошибка регистрации. Возможно, такой email уже используется.')
    }
  }

  return (
    <>
      <Helmet><title>Регистрация — АвтоРазбор</title></Helmet>
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-bg-surface border border-border rounded-xl p-6">
          <div className="text-center mb-6">
            <span className="text-accent font-bold text-2xl">АвтоРазбор</span>
            <h1 className="text-lg font-semibold text-text-primary mt-2">Создать аккаунт</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Имя"
              placeholder="Иван Иванов"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="Минимум 8 символов"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Телефон (необязательно)"
              type="tel"
              placeholder="+7 000 000 00 00"
              {...register('phone')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Зарегистрироваться
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-4">
            Уже есть аккаунт?{' '}
            <Link to={ROUTES.LOGIN} className="text-accent hover:underline">Войти</Link>
          </p>
        </div>
      </div>
    </>
  )
}
