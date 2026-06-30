'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface InfoModalProps {
  title: string
  description: string
  onClose: () => void
}

export function InfoModal({ title, description, onClose }: InfoModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-light rounded-card shadow-2xl p-6 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 pr-6">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
