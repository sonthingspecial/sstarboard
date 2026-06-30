interface SectionAnchorProps {
  id: string
  className?: string
  children: React.ReactNode
}

export function SectionAnchor({ id, className = '', children }: SectionAnchorProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 px-4 py-10 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </section>
  )
}
