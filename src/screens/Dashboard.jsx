import {
  Bell,
  BriefcaseBusiness,
  CalendarRange,
  MapPin,
  MessageSquareText,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { apiClient, getApiError } from '../services/apiClient'

function normalizeUser(item, fallback = {}) {
  const id = item?.id || item?._id || item?.userId || item?.uuid || fallback.id

  return {
    id,
    name: item?.name || item?.email || fallback.name || 'Jashan user',
    email: item?.email || fallback.email || '',
    role: item?.role || fallback.role || 'user',
    category: item?.category || fallback.category || 'General',
    city: item?.city || fallback.city || '',
    state: item?.state || fallback.state || '',
    about: item?.about || fallback.about || '',
    location: item?.location || [item?.city, item?.state].filter(Boolean).join(', ') || fallback.location || '',
    availability: item?.availability || 'Available this week',
    mutuals: item?.mutuals || 'Top match',
    accent: item?.accent || 'from-ink-900 to-ink-600',
    message: item?.message || item?.about || 'Looking to help create unforgettable experiences for your next celebration.',
  }
}

function normalizeEvent(item) {
  return {
    id: item?.id || item?._id,
    requestedBy: item?.requestedBy || item?.requested_by || '',
    toOrganizer: item?.toOrganizer || item?.to_organizer || '',
    status: item?.status || 'pending',
    about: item?.about || 'Event request',
    requirements: item?.requirements || '',
    additionalDetails: item?.additionalDetails || '',
    eventDate: item?.eventDate || item?.date || '',
  }
}

export function Dashboard() {
  const { user, token } = useSelector((state) => state.auth)
  const [profile, setProfile] = useState({
    id: user?.id || user?._id || user?.userId || user?.uuid,
    name: user?.name || 'Jashan user',
    email: user?.email || '',
    role: user?.role || 'user',
    category: user?.category || 'General',
  })
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelingId, setCancelingId] = useState(null)

  const currentUserId = useMemo(
    () => user?.id || user?._id || user?.userId || user?.uuid || profile?.id,
    [user, profile],
  )

  const loadDashboard = async () => {
   // if (!token || !currentUserId) return

    setLoading(true)

    try {
      const [usersResponse, eventsResponse] = await Promise.all([
        apiClient.get('/organizers').catch(() => ({ data: [] })),
        apiClient.get('/events').catch(() => ({ data: [] })),
      ])

      console.log('Users API response:', usersResponse.data)

      const rawUsers = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : usersResponse.data?.users || usersResponse.data?.data || []

      const rawEvents = Array.isArray(eventsResponse.data)
        ? eventsResponse.data
        : eventsResponse.data?.events || eventsResponse.data?.data || []

      setUsers(rawUsers.map((item) => normalizeUser(item)))
      setEvents(rawEvents.map((item) => normalizeEvent(item)))

      const profileResponse = await apiClient.get(`/user/${currentUserId}`).catch(() => ({ data: { user: user } }))
      const profileData = profileResponse.data?.user || profileResponse.data || user
      setProfile(normalizeUser(profileData, { name: user?.name || 'Jashan user', email: user?.email || '' }))
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [currentUserId, token])

  const feedUsers = useMemo(
    () => users.filter((member) => member.id && String(member.id) !== String(currentUserId)).slice(0, 8),
    [currentUserId, users],
  )

  const friendList = useMemo(() => feedUsers.slice(0, 6), [feedUsers])

  const userEvents = useMemo(
    () => events.filter((event) => String(event.requestedBy) === String(currentUserId) || String(event.toOrganizer) === String(currentUserId)),
    [currentUserId, events],
  )

  const handleRequestEvent = async (member) => {
    if (!currentUserId || !member?.id) return

    setSubmitting(true)

    try {
      const payload = {
        requestedBy: currentUserId,
        toOrganizer: member.id,
        eventDate: new Date().toISOString().split('T')[0],
        about: `Event request for ${member.name || 'this organizer'}`,
        requirements: 'Please share your availability and package details.',
        additionalDetails: 'Sent from the JashanTantra dashboard.',
      }

      const response = await apiClient.post('/events/register', payload)
      const createdEvent = normalizeEvent(response.data?.event || response.data?.data || response.data || payload)
      setEvents((current) => [createdEvent, ...current])
      toast.success(`Event request sent to ${member.name || 'the organizer'}.`)
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelEvent = async (eventId) => {
    if (!eventId) return

    setCancelingId(eventId)

    try {
      await apiClient.post(`/events/${eventId}/cancel`)
      setEvents((current) => current.filter((event) => String(event.id) !== String(eventId)))
      toast.success('Event request cancelled.')
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setCancelingId(null)
    }
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
    <section className="mx-auto min-h-[70vh] max-w-7xl px-4 py-6 sm:px-5 lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[28px] border border-ink-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
                {(profile.name || 'J').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-ink-900">{profile.name || 'Jashan user'}</p>
                <p className="text-xs text-ink-700">{profile.role || 'User'}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-ink-700">
              <div className="flex items-center justify-between rounded-2xl bg-ivory-50 px-3 py-2">
                <span>Profile strength</span>
                <span className="font-bold text-ink-900">82%</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-ivory-50 px-3 py-2">
                <span>Connections</span>
                <span className="font-bold text-ink-900">{users.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-ink-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-ivory-500">People</p>
              <span className="rounded-full bg-ivory-100 px-2 py-1 text-xs font-bold text-ink-700">{friendList.length}</span>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {friendList.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-ink-200 bg-ivory-50 p-4 text-sm text-ink-700">No people available from the API yet.</p>
              ) : (
                friendList.map((member) => {
                  const memberName = member.name || member.email || 'Someone'
                  const memberRole = member.role || member.category || 'User'
                  const initials = memberName
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()

                  return (
                    <div key={member.id || member.email || memberName} className="rounded-2xl border border-ink-100 bg-ivory-50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-ink-900 to-ink-600 text-xs font-bold text-white">{initials}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink-900">{memberName}</p>
                          <p className="truncate text-xs text-ink-700">{memberRole}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleRequestEvent(member)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-2 text-xs font-bold text-ink-900 transition hover:border-ivory-300 hover:text-ivory-500 disabled:cursor-wait disabled:opacity-60"
                      >
                        <CalendarRange size={14} /> Request event
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          <div className="rounded-[28px] border border-ink-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-full border border-ink-200 bg-ivory-50 px-4 py-3">
                <Search size={16} className="text-ink-400" />
                <input
                  placeholder="Search people, services, categories..."
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </div>
              <button type="button" className="grid size-11 place-items-center rounded-full bg-ink-900 text-white">
                <Bell size={16} />
              </button>
              <button type="button" className="grid size-11 place-items-center rounded-full bg-ivory-100 text-ink-900">
                <MessageSquareText size={16} />
              </button>
            </div>
          </div>

          <div className="rounded-[30px] border border-ink-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-ivory-500">Feed</p>
                <h1 className="mt-2 font-display text-3xl text-ink-900">Explore connections</h1>
              </div>
              <button type="button" className="inline-flex items-center gap-2 rounded-full bg-ivory-100 px-3 py-2 text-xs font-bold text-ink-900">
                <BriefcaseBusiness size={14} /> Services
              </button>
            </div>

            <div className="max-h-[80vh] space-y-4 overflow-y-auto pr-1">
              {loading ? (
                <p className="rounded-2xl border border-dashed border-ink-200 bg-ivory-50 p-4 text-sm text-ink-700">Loading people...</p>
              ) : feedUsers.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-ink-200 bg-ivory-50 p-4 text-sm text-ink-700">No users found from the /users API.</p>
              ) : (
                feedUsers.map((member) => {
                  const memberName = member.name || member.email || 'Someone'
                  const role = member.role || member.category || 'Service provider'
                  const location = member.location || [member.city, member.state].filter(Boolean).join(', ') || 'New Delhi'
                  const availability = member.availability || 'Available this week'
                  const accent = member.accent || 'from-ink-900 to-ink-600'
                  const description = member.message || member.about || 'Looking to help create unforgettable experiences for your next celebration.'

                  return (
                    <article key={member.id || member.email || memberName} className="rounded-[28px] border border-ink-100 bg-ivory-50 p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-lg font-bold text-white`}>
                          {memberName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h2 className="text-xl font-bold text-ink-900">{memberName}</h2>
                              <p className="text-sm text-ink-700">{role}</p>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-leaf-500 shadow-sm">
                              {availability}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-600">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                              <MapPin size={12} /> {location}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-1">{member.mutuals || 'Top match'}</span>
                          </div>

                          <p className="mt-4 text-sm leading-6 text-ink-700">{description}</p>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleRequestEvent(member)}
                              className="rounded-full bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-700 disabled:cursor-wait disabled:opacity-60"
                            >
                              Request event
                            </button>
                            <button type="button" className="rounded-full border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 transition hover:border-ivory-300">
                              View profile
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        </main>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[28px] border border-ink-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-ivory-500">Quick stats</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-ivory-50 p-3">
                <p className="text-xs text-ink-500">Active requests</p>
                <p className="mt-1 text-2xl font-bold text-ink-900">{userEvents.length}</p>
              </div>
              <div className="rounded-2xl bg-ivory-50 p-3">
                <p className="text-xs text-ink-500">Confirmed bookings</p>
                <p className="mt-1 text-2xl font-bold text-ink-900">{userEvents.filter((event) => event.status === 'confirmed').length}</p>
              </div>
              <div className="rounded-2xl bg-ivory-50 p-3">
                <p className="text-xs text-ink-500">Saved vendors</p>
                <p className="mt-1 text-2xl font-bold text-ink-900">{feedUsers.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-ink-100 bg-white p-4 shadow-sm">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-ivory-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-ink-700">
              <Sparkles size={12} /> Event requests
            </div>

            <div className="mt-4 space-y-3 text-sm text-ink-700">
              {userEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-ink-200 bg-ivory-50 p-3 text-sm text-ink-700">No event requests yet.</p>
              ) : (
                userEvents.slice(0, 5).map((event) => {
                  const canCancel = String(event.requestedBy) === String(currentUserId) || String(event.toOrganizer) === String(currentUserId)

                  return (
                    <div key={event.id || event.about} className="rounded-2xl border border-ink-100 bg-ivory-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-ink-900">{event.about}</p>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-ink-700">{event.status}</span>
                      </div>

                      <p className="mt-2 text-xs text-ink-600">{event.eventDate || 'Date not set'}</p>

                      {canCancel && (
                        <button
                          type="button"
                          disabled={cancelingId === event.id}
                          onClick={() => handleCancelEvent(event.id)}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                        >
                          <X size={12} /> {cancelingId === event.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
