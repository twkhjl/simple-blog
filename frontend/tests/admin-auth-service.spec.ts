import { afterEach, describe, expect, it, vi } from 'vitest'
import { persistAdminRecoverySessionFromUrl } from '../src/services/adminAuth'

describe('admin recovery session URL parsing', () => {
  afterEach(() => {
    window.sessionStorage.clear()
    window.history.replaceState({}, '', '/')
    vi.restoreAllMocks()
  })

  it('persists recovery session from current query bootstrap format', () => {
    window.history.replaceState(
      {},
      '',
      '/?admin_reset=1#access_token=token-1&refresh_token=refresh-1&type=recovery',
    )

    const persisted = persistAdminRecoverySessionFromUrl()

    expect(persisted).toBe(true)
    expect(window.sessionStorage.getItem('admin-recovery-session')).toContain('token-1')
  })

  it('persists recovery session from legacy hash-router format', () => {
    window.history.replaceState(
      {},
      '',
      '/#/access_token=token-2&refresh_token=refresh-2&type=recovery',
    )

    const persisted = persistAdminRecoverySessionFromUrl()

    expect(persisted).toBe(true)
    expect(window.sessionStorage.getItem('admin-recovery-session')).toContain('token-2')
  })
})
