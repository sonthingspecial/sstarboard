interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 animate-pulse ${className}`}>
      <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded mb-3" />
      <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded" />
    </div>
  )
}
