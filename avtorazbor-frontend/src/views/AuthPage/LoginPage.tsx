'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

const schema = z.object({
  email: z.string().email('Неверный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormData = z.infer<typeof schema>

export function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const { access_token, refresh_token } = await authApi.login(data.email, data.password)
      useAuthStore.getState().setAccessToken(access_token)
      const user = await authApi.me()
      setAuth(user, access_token, refresh_token)
      toast.success('Добро пожаловать!')
      router.push(searchParams?.get('next') ?? ROUTES.HOME)
    } catch {
      toast.error('Неверный email или пароль')
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-bg-surface border border-border rounded-xl p-6">
        <div className="text-center mb-6">
          <span className="text-accent font-bold text-2xl">АвтоРазбор</span>
          <h1 className="text-lg font-semibold text-text-primary mt-2">Вход в аккаунт</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="hover:text-text-primary"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            }
            {...register('password')}
          />
          <Button type="submit" loading={isSubmitting} className="w-full mt-1">
            Войти
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          Нет аккаунта?{' '}
          <Link href={ROUTES.REGISTER} className="text-accent hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
