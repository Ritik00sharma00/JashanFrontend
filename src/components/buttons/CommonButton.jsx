import { ArrowUpRight } from 'lucide-react'

export function CommonButton({ children, variant = 'primary', href = '#', icon = true }) {
  const styles = {
    primary: 'bg-ink-900 text-white hover:bg-ink-700',
    secondary: 'border border-ink-200 bg-white text-ink-900 hover:border-ink-900',
    light: 'bg-white text-ink-900 hover:bg-ivory-100',
  }

  return <a href={href} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors ${styles[variant]}`}>{children}{icon && <ArrowUpRight size={16} strokeWidth={2.5} />}</a>
}