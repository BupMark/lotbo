export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem('lotbo_session_id')
  if (existing) return existing
  const newId = Math.random().toString(36).slice(2)
  localStorage.setItem('lotbo_session_id', newId)
  return newId
}
