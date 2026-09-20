import { Menu, Sparkles, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../store/slices/authSlice'
import { NavLink } from '../links/NavLink'

export function Navbar({ onAuth }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth.token)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setIsOpen(false)
  }

  const isLoggedIn = Boolean(token)

  return <header className="relative z-20 border-b border-ink-100 bg-ivory-50/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><a href="/" className="flex items-center gap-2 text-ink-900"><span className="grid size-9 place-items-center rounded-xl bg-ivory-400 text-ink-900"><Sparkles size={18} /></span><span className="font-display text-xl font-bold tracking-tight">JashanTantra</span></a><nav className="hidden items-center gap-8 md:flex"><NavLink to="/#discover">Discover</NavLink><NavLink to="/#organizers">For organizers</NavLink><NavLink to="/#story">Our story</NavLink></nav><div className="hidden items-center gap-3 md:flex">{isLoggedIn ? <button type="button" onClick={handleLogout} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-700">Log out</button> : <><button type="button" onClick={() => onAuth('login')} className="text-sm font-semibold text-ink-700 transition-colors hover:text-ivory-500">Log in</button><button type="button" onClick={() => onAuth('signup')} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-700">List your service</button></>}</div><button type="button" className="rounded-full p-2 text-ink-900 md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">{isOpen ? <X size={22} /> : <Menu size={22} />}</button></div>{isOpen && <nav className="border-t border-ink-100 px-5 py-5 md:hidden"><div className="flex flex-col gap-5"><NavLink to="/#discover">Discover</NavLink><NavLink to="/#organizers">For organizers</NavLink><NavLink to="/#story">Our story</NavLink>{isLoggedIn ? <button type="button" onClick={handleLogout} className="rounded-full bg-ink-900 px-5 py-3 text-sm font-bold text-white">Log out</button> : <><button type="button" onClick={() => { onAuth('signup'); setIsOpen(false) }} className="rounded-full bg-ink-900 px-5 py-3 text-sm font-bold text-white">List your service</button><button type="button" onClick={() => { onAuth('login'); setIsOpen(false) }} className="text-left text-sm font-semibold text-ink-700">Log in</button></>}</div></nav>}</header>
}