'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-bg-elevated border-t border-border rounded-t-xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          {title && <h3 className="font-semibold text-text-primary">{title}</h3>}
          <button
            onClick={onClose}
            className="ml-auto text-text-muted hover:text-text-primary transition-colors p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  )
}
