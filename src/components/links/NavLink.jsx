import { Link } from 'react-router-dom'

export function NavLink({ to, children }) {
  return <Link to={to} className="text-sm font-semibold text-ink-700 transition-colors hover:text-ivory-500">{children}</Link>
}