import { describe, expect, it } from 'vitest'

import {
  DISPLAY_NAME_HEADER,
  encodeDisplayName,
  getPresenceColor,
  normalizeDisplayName,
  readDisplayNameHeader,
} from './identity'

describe('auth identity', () => {
  it('normalizes readable Unicode display names', () => {
    expect(normalizeDisplayName('  Mika   Chen  ')).toBe('Mika Chen')
    expect(normalizeDisplayName('小 明')).toBe('小 明')
  })

  it('rejects unsafe or unusable display names', () => {
    expect(normalizeDisplayName('x')).toBeNull()
    expect(normalizeDisplayName('<script>')).toBeNull()
    expect(normalizeDisplayName('a'.repeat(33))).toBeNull()
  })

  it('round-trips display names through an ASCII-safe request header', () => {
    const headers = new Headers({
      [DISPLAY_NAME_HEADER]: encodeDisplayName('小 明'),
    })
    expect(readDisplayNameHeader(headers)).toBe('小 明')
  })

  it('assigns a stable presence color from the user id', () => {
    expect(getPresenceColor('user-123')).toBe(getPresenceColor('user-123'))
  })
})
