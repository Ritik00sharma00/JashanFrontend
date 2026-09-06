import { ArrowRight, Check, Mail, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../../store/slices/authSlice'

export function AuthModal({ mode, onClose, onModeChange }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const authStatus = useSelector((state) => state.auth.status)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const isSignup = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    const request = isSignup
      ? dispatch(registerUser({ email, password, name, category: 'General', age: '18+', role: 'user' })).unwrap()
      : dispatch(loginUser({ email, password })).unwrap()

    try {
      await toast.promise(request, {
        loading: isSignup ? 'Creating your account...' : 'Signing you in...',
        success: isSignup ? 'Account created. Welcome to JashanTantra!' : 'Welcome back!',
        error: (error) => error,
      })
      onClose()
      navigate('/dashboard')
    } catch {
      // toast.promise displays the rejected API message.
    }
  }

  const inputClass = 'w-full bg-transparent text-sm text-ink-900 outline-none'
  const fieldClass = 'flex items-center gap-3 rounded-xl border border-ink-200 bg-white/70 px-3.5 py-3 focus-within:border-ivory-500'

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-900/45 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-2xl shadow-ink-900/25 backdrop-blur-2xl md:grid-cols-[.82fr_1.18fr]">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-white/70 text-ink-700 transition-colors hover:bg-white" aria-label="Close authentication modal"><X size={18} /></button>
      <div className="hidden bg-ink-900 p-9 text-white md:flex md:flex-col md:justify-between"><div><span className="grid size-10 place-items-center rounded-xl bg-ivory-400 text-ink-900"><Sparkles size={19} /></span><p className="mt-16 font-display text-4xl leading-tight">The best<br />jashans start<br />with <span className="text-ivory-300">people.</span></p></div><div className="space-y-4 text-sm text-ink-200"><p className="flex items-center gap-3"><ShieldCheck size={17} className="text-ivory-300" /> Trusted local organizers</p><p className="flex items-center gap-3"><Check size={17} className="text-leaf-300" /> Celebrations made personal</p></div></div>
      <div className="p-6 sm:p-10"><div className="max-w-md"><p className="text-xs font-bold uppercase tracking-[.2em] text-ivory-500">Welcome to JashanTantra</p><h2 id="auth-title" className="mt-3 font-display text-4xl text-ink-900">{isSignup ? 'Make room for more jashan.' : 'Good to see you again.'}</h2><p className="mt-3 text-sm leading-6 text-ink-700">{isSignup ? 'Create your free account and find your celebration people.' : 'Sign in to pick up where your next celebration left off.'}</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {isSignup && <label className="block"><span className="mb-1.5 block text-xs font-bold text-ink-700">Your name</span><span className={fieldClass}><UserRound size={17} className="text-ink-300" /><input required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Aarav Sharma" /></span></label>}
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-ink-700">Email address</span><span className={fieldClass}><Mail size={17} className="text-ink-300" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="you@example.com" /></span></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-ink-700">Password</span><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${fieldClass} ${inputClass}`} placeholder="At least 6 characters" /></label>
          <button disabled={authStatus === 'loading'} type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-700 disabled:cursor-wait disabled:opacity-60">{authStatus === 'loading' ? 'Please wait...' : isSignup ? 'Create my account' : 'Continue to dashboard'} {authStatus !== 'loading' && <ArrowRight size={16} />}</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-700">{isSignup ? 'Already have an account?' : 'New to JashanTantra?'} <button type="button" onClick={() => onModeChange(isSignup ? 'login' : 'signup')} className="font-bold text-ivory-500 hover:text-ink-900">{isSignup ? 'Log in' : 'Create an account'}</button></p>
      </div></div>
    </div>
  </div>
}
