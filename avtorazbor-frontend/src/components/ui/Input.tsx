import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </span>
          )}
          {rightIcon && (
            <span className="absolute right-0 top-0 bottom-0 flex items-center text-text-muted">
              {rightIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary',
              'placeholder:text-text-muted transition-colors duration-150',
              'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-danger focus:border-danger focus:ring-danger/30',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
