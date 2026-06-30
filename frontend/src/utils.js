export function timeAgo(dateStr) {
  if (!dateStr) return null
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 5)  return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const mins = Math.floor(seconds / 60)
  if (mins < 60)    return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}
