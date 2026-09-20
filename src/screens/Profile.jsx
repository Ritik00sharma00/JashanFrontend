import {
  CalendarDays,
  ChevronRight,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { apiClient, getApiError } from '../services/apiClient'

const emptyEventForm = {
  toOrganizer: '',
  eventDate: '',
  about: '',
  requirements: '',
  additionalDetails: '',
}

function decodeJwtPayload(token) {
  if (!token) return null

  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )

    return JSON.parse(json)
  } catch {
    return null
  }
}

function getDisplayUser(data, fallback = {}) {
  if (!data || typeof data !== 'object') return fallback
  return {
    id: data.id || data._id || data.userId || data.uuid || fallback.id,
    name: data.name || fallback.name || 'Jashan user',
    email: data.email || fallback.email || '',
    role: data.role || fallback.role || 'user',
    category: data.category || fallback.category || 'General',
    age: data.age || fallback.age || '',
    phoneNumber: data.phoneNumber || data.phone || fallback.phoneNumber || '',
    city: data.city || fallback.city || '',
    state: data.state || fallback.state || '',
    address: data.address || fallback.address || '',
    about: data.about || fallback.about || '',
  }
}

export function Profile() {
  const { user, token } = useSelector((state) => state.auth)
  const [profile, setProfile] = useState(getDisplayUser(user))
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [submittingEvent, setSubmittingEvent] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const currentUserId = useMemo(
    () => user?.id || user?._id || user?.userId || user?.uuid || profile?.id || decodeJwtPayload(token)?.id || decodeJwtPayload(token)?._id || decodeJwtPayload(token)?.userId,
    [user, profile, token],
  )

  const organizerOptions = useMemo(
    () => users.filter((member) => (member.role === 'organizer' || member.role === 'admin') && (member.id || member._id) !== currentUserId),
    [users, currentUserId],
  )

  const friendList = useMemo(
    () => users.filter((member) => (member.id || member._id) !== currentUserId).slice(0, 8),
    [users, currentUserId],
  )

  useEffect(() => {
    if (!token || !currentUserId) return

    const loadDashboard = async () => {
      setLoading(true)

      try {
        const [profileResponse, usersResponse, eventsResponse] = await Promise.all([
          apiClient.get(`/user/${currentUserId}`),
          apiClient.get('/admin/users').catch(() => ({ data: { users: [] } })),
          apiClient.get('/admin/events').catch(() => ({ data: { events: [] } })),
        ])

        const nextProfile = getDisplayUser(profileResponse.data?.user || profileResponse.data || user)
        setProfile(nextProfile)

        const nextUsers = Array.isArray(usersResponse.data)
          ? usersResponse.data
          : usersResponse.data?.users || []
        setUsers(nextUsers)

        const nextEvents = Array.isArray(eventsResponse.data)
          ? eventsResponse.data
          : eventsResponse.data?.events || []
        setEvents(nextEvents)
      } catch (error) {
        toast.error(getApiError(error))
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [currentUserId, token, refreshKey, user])

  useEffect(() => {
    if (organizerOptions.length && !eventForm.toOrganizer) {
      setEventForm((current) => ({
        ...current,
        toOrganizer: organizerOptions[0].id || organizerOptions[0]._id,
      }))
    }
  }, [organizerOptions, eventForm.toOrganizer])

  const handleProfileChange = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  const handleProfileSave = async () => {
    if (!currentUserId) {
      toast.error('Your session is missing a user id. Please log in again.')
      return
    }

    setSavingProfile(true)

    try {
      const payload = {
        name: profile.name,
        category: profile.category,
        age: profile.age,
        city: profile.city,
        state: profile.state,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        about: profile.about,
        role: profile.role,
      }

      const response = await apiClient.patch(`/user/${currentUserId}/profile`, payload)
      const updatedProfile = getDisplayUser(response.data?.user || response.data || profile)
      setProfile(updatedProfile)
      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleEventSubmit = async (event) => {
    event.preventDefault()
    if (!currentUserId) return

    setSubmittingEvent(true)

    try {
      const payload = {
        requestedBy: currentUserId,
        toOrganizer: eventForm.toOrganizer,
        eventDate: eventForm.eventDate || new Date().toISOString().split('T')[0],
        about: eventForm.about,
        requirements: eventForm.requirements,
        additionalDetails: eventForm.additionalDetails,
      }

      const response = await apiClient.post('/events/register', payload)
      const createdEvent = response.data?.event || response.data?.data || response.data
      setEvents((current) => [createdEvent, ...current])
      setEventForm(emptyEventForm)
      toast.success('Event request sent successfully.')
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setSubmittingEvent(false)
    }
  }

  const handleFriendRequest = (member) => {
    const organizerId = member.id || member._id
    if (!organizerId) return

    setEventForm((current) => ({
      ...current,
      toOrganizer: organizerId,
    }))

    document.getElementById('event-request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    toast.success(`Event request ready for ${member.name || member.email || 'this organizer'}.`)
  }

  if (!token) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-5 py-20">
        <div className="rounded-3xl border border-ink-100 bg-white p-10 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-ivory-500">Access required</p>
          <h1 className="mt-4 font-display text-4xl text-ink-900">Please log in first</h1>
          <p className="mt-3 text-ink-700">Your dashboard will be available once you have an active session.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 sm:px-5 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.22em] text-ivory-500">
            <Sparkles size={14} /> Your jashan space
          </p>
          <h1 className="font-display text-4xl text-ink-900 sm:text-5xl">Welcome back, {profile.name || 'friend'}.</h1>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <RefreshCcw size={16} /> Refresh data
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-[28px] border border-ink-100 bg-white shadow-sm">
            <div className="h-20 bg-gradient-to-r from-ink-900 via-ink-800 to-ivory-300" />
            <div className="px-5 pb-5 pt-0">
              <div className="-mt-9 flex items-center justify-between">
                <div className="grid size-16 place-items-center rounded-2xl border-4 border-white bg-ivory-200 text-xl font-bold text-ink-900">
                  {(profile.name || 'J').charAt(0).toUpperCase()}
                </div>
                <span className="rounded-full bg-leaf-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-leaf-500">
                  {profile.role || 'User'}
                </span>
              </div>

              <div className="mt-4">
                <h2 className="font-display text-2xl text-ink-900">{profile.name || 'Jashan user'}</h2>
                <p className="mt-1 text-sm text-ink-700">{profile.category || 'General category'}</p>
              </div>

              <div className="mt-4 space-y-2 text-sm text-ink-700">
                <p className="flex items-center gap-2"><MapPin size={15} className="text-ink-300" /> {profile.city || 'City not added'}{profile.state ? `, ${profile.state}` : ''}</p>
                <p className="flex items-center gap-2"><Mail size={15} className="text-ink-300" /> {profile.email || 'No email'}</p>
              </div>

              <button
                type="button"
                onClick={() => document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-700"
              >
                Edit profile <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-ink-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-ivory-500">Network</p>
                <h3 className="mt-2 font-display text-2xl text-ink-900">Friend list</h3>
              </div>
              <span className="rounded-full bg-ivory-100 px-2 py-1 text-xs font-bold text-ink-700">{friendList.length}</span>
            </div>

            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {friendList.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-ink-200 bg-ivory-50 p-4 text-sm text-ink-700">No friends yet.</p>
              ) : (
                friendList.map((member) => {
                  const memberId = member.id || member._id || member.email
                  const memberName = member.name || 'Jashan friend'
                  const initials = memberName
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()

                  return (
                    <div key={memberId} className="rounded-2xl border border-ink-100 bg-ivory-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-ink-900 text-xs font-bold text-white">{initials}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink-900">{memberName}</p>
                          <p className="truncate text-xs text-ink-700">{member.role || 'User'} · {member.category || 'General'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFriendRequest(member)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-2 text-xs font-bold text-ink-900 transition hover:border-ivory-300 hover:text-ivory-500"
                      >
                        <Plus size={14} /> Event request
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-ink-100 bg-white p-5 shadow-sm">
              <CalendarDays className="text-leaf-500" size={20} />
              <p className="mt-8 text-sm text-ink-300">Event requests</p>
              <p className="mt-1 text-3xl font-bold text-ink-900">{events.length}</p>
            </div>
            <div className="rounded-[26px] border border-ink-100 bg-white p-5 shadow-sm">
              <UserRound className="text-ivory-500" size={20} />
              <p className="mt-8 text-sm text-ink-300">Registered users</p>
              <p className="mt-1 text-3xl font-bold text-ink-900">{users.length}</p>
            </div>
            <div className="rounded-[26px] border border-ink-100 bg-white p-5 shadow-sm">
              <ShieldCheck className="text-leaf-500" size={20} />
              <p className="mt-8 text-sm text-ink-300">Profile status</p>
              <p className="mt-1 text-3xl font-bold text-ink-900">{profile.role || 'user'}</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-ink-100 bg-white p-5 shadow-sm sm:p-6" id="profile-section">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-ivory-500">Profile</p>
                <h2 className="mt-2 font-display text-3xl text-ink-900">Your details</h2>
              </div>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="rounded-full bg-ink-900 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save changes'}
              </button>
            </div>

            {loading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-ink-700">
                <LoaderCircle className="animate-spin" size={16} /> Loading profile...
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">Name</span>
                  <input value={profile.name || ''} onChange={(event) => handleProfileChange('name', event.target.value)} className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">Email</span>
                  <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 text-ink-700">
                    <Mail size={16} className="text-ink-300" />
                    <span>{profile.email || '—'}</span>
                  </div>
                </label>
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">Category</span>
                  <input value={profile.category || ''} onChange={(event) => handleProfileChange('category', event.target.value)} className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">Role</span>
                  <input value={profile.role || ''} onChange={(event) => handleProfileChange('role', event.target.value)} className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">Age</span>
                  <input value={profile.age || ''} onChange={(event) => handleProfileChange('age', event.target.value)} className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">Phone</span>
                  <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5">
                    <Phone size={16} className="text-ink-300" />
                    <input value={profile.phoneNumber || ''} onChange={(event) => handleProfileChange('phoneNumber', event.target.value)} className="w-full bg-transparent outline-none" />
                  </div>
                </label>
                <label className="block text-sm text-ink-700 sm:col-span-2">
                  <span className="mb-1.5 block font-semibold">Address</span>
                  <input value={profile.address || ''} onChange={(event) => handleProfileChange('address', event.target.value)} className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">City</span>
                  <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5">
                    <MapPin size={16} className="text-ink-300" />
                    <input value={profile.city || ''} onChange={(event) => handleProfileChange('city', event.target.value)} className="w-full bg-transparent outline-none" />
                  </div>
                </label>
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">State</span>
                  <input value={profile.state || ''} onChange={(event) => handleProfileChange('state', event.target.value)} className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>
                <label className="block text-sm text-ink-700 sm:col-span-2">
                  <span className="mb-1.5 block font-semibold">About</span>
                  <textarea value={profile.about || ''} onChange={(event) => handleProfileChange('about', event.target.value)} rows={4} className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>
              </div>
            )}
          </div>

          <div id="event-request-form" className="rounded-[28px] border border-ink-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-ivory-500">Events</p>
                <h2 className="mt-2 font-display text-3xl text-ink-900">Create an event request</h2>
              </div>
              <span className="grid size-10 place-items-center rounded-full bg-ivory-100 text-ivory-500">
                <Plus size={16} />
              </span>
            </div>

            <form onSubmit={handleEventSubmit} className="mt-6 space-y-4">
              <label className="block text-sm text-ink-700">
                <span className="mb-1.5 block font-semibold">Organizer</span>
                <select
                  value={eventForm.toOrganizer}
                  onChange={(event) => setEventForm((current) => ({ ...current, toOrganizer: event.target.value }))}
                  className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400"
                >
                  <option value="">Select organizer</option>
                  {organizerOptions.map((member) => (
                    <option key={member.id || member._id || member.email} value={member.id || member._id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">Date</span>
                  <input type="date" value={eventForm.eventDate} onChange={(event) => setEventForm((current) => ({ ...current, eventDate: event.target.value }))} className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>

                <label className="block text-sm text-ink-700">
                  <span className="mb-1.5 block font-semibold">Requirements</span>
                  <input value={eventForm.requirements} onChange={(event) => setEventForm((current) => ({ ...current, requirements: event.target.value }))} placeholder="Venue, DJ, décor..." className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
                </label>
              </div>

              <label className="block text-sm text-ink-700">
                <span className="mb-1.5 block font-semibold">About the event</span>
                <textarea value={eventForm.about} onChange={(event) => setEventForm((current) => ({ ...current, about: event.target.value }))} rows={3} placeholder="Tell the organizer about your event goals and mood." className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
              </label>

              <label className="block text-sm text-ink-700">
                <span className="mb-1.5 block font-semibold">Additional details</span>
                <textarea value={eventForm.additionalDetails} onChange={(event) => setEventForm((current) => ({ ...current, additionalDetails: event.target.value }))} rows={3} placeholder="Any timing, guest count, or special note." className="w-full rounded-xl border border-ink-200 bg-ivory-50 px-3 py-2.5 outline-none transition focus:border-ivory-400" />
              </label>

              <button type="submit" disabled={submittingEvent} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-700 disabled:cursor-wait disabled:opacity-60">
                {submittingEvent ? 'Submitting...' : 'Register event'}
              </button>
            </form>
          </div>

          <div className="rounded-[28px] border border-ink-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-ivory-500">Requests</p>
            <h2 className="mt-2 font-display text-3xl text-ink-900">Event requests</h2>
            <div className="mt-5 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-ink-200 bg-ivory-50 p-4 text-sm text-ink-700">No event requests yet.</p>
              ) : (
                events.slice(0, 6).map((event) => (
                  <div key={event.id || event._id || event.eventDate} className="rounded-2xl border border-ink-100 bg-ivory-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink-900">{event.about || 'Event request'}</p>
                      <span className="rounded-full bg-ivory-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-ink-700">
                        {event.status || 'pending'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ink-700">{event.requirements || 'No requirements added yet.'}</p>
                    <p className="mt-2 text-xs text-ink-500">{event.eventDate || 'Date not set'} · {event.toOrganizer || 'Organizer pending'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
