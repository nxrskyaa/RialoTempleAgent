export function normalizeXHandle(value: string) {
  return value.replace('@', '').trim()
}

export function getXAvatarUrl(value: string) {
  const handle = normalizeXHandle(value)
  return handle ? `https://unavatar.io/x/${encodeURIComponent(handle)}` : ''
}
