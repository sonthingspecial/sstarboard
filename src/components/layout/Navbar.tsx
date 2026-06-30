'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { label: '오늘의 시황', href: '#ai-summary' },
  { label: '거시경제', href: '#macro' },
  { label: '미국주식', href: '#us-market' },
  { label: '부동산', href: '#real-estate' },
  { label: '한국주식', href: '#kr-stock' },
  { label: '대안투자', href: '#alternative' },
  { label: '뉴스', href: '#news' },
]

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    setMenuOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-navy dark:bg-navy-dark backdrop-blur-md transition-shadow ${scrolled ? 'shadow-lg' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <span className="text-gold font-bold text-xl tracking-tight">★ Sstarboard</span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-gold transition-colors rounded-md hover:bg-white/5"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-300 hover:text-gold transition-colors"
              aria-label="다크모드 토글"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-gold transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-navy dark:bg-navy-dark border-t border-white/10 px-4 pb-4">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="block py-3 text-sm text-gray-300 hover:text-gold border-b border-white/5 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
