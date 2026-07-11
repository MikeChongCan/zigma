export const DISPLAY_NAME_HEADER = 'x-offset-display-name'
export const DISPLAY_NAME_MAX_LENGTH = 32

export type AuthIdentity = {
  id: string
  name: string
  image?: string | null
  isAnonymous: boolean
}

export function normalizeDisplayName(value: string): string | null {
  const normalized = value.normalize('NFKC').trim().replace(/\s+/g, ' ')

  if (normalized.length < 2 || normalized.length > DISPLAY_NAME_MAX_LENGTH) {
    return null
  }

  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._'’-]*$/u.test(normalized)) {
    return null
  }

  return normalized
}

export function encodeDisplayName(value: string): string {
  return encodeURIComponent(value)
}

export function readDisplayNameHeader(headers?: Headers): string | null {
  const value = headers?.get(DISPLAY_NAME_HEADER)
  if (!value) return null

  try {
    return normalizeDisplayName(decodeURIComponent(value))
  } catch {
    return null
  }
}

export function getPresenceColor(identityId: string): string {
  const colors = [
    '#ff6b45',
    '#a9d36e',
    '#68a7ff',
    '#f0bf4f',
    '#d58cff',
    '#53d6c3',
  ]
  let hash = 0
  for (const character of identityId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return colors[hash % colors.length]
}
