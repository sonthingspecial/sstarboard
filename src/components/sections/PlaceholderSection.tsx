import { Clock } from 'lucide-react'

interface PlaceholderItem {
  label: string
}

interface PlaceholderSectionProps {
  title: string
  emoji: string
  items: PlaceholderItem[]
}

export function PlaceholderSection({ title, emoji, items }: PlaceholderSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{emoji}</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
          <Clock size={11} />
          곧 추가됩니다
        </span>
      </div>
      <div className="rounded-card border-2 border-dashed border-gray-200 dark:border-white/10 p-6">
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">이 섹션은 준비 중입니다. 추가 예정 데이터:</p>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <li
              key={item.label}
              className="text-sm text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2 text-center opacity-40 select-none"
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
