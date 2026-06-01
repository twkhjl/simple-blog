import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('login record admin apis', () => {
  it('rejects editor from reading all admin login records', async () => {
    const res = await app.request('/api/admin/login-records', {
      headers: {
        Authorization: 'Bearer editor-token',
      },
    })

    expect(res.status).toBe(403)
  })

  it('allows admin to read all admin login records', async () => {
    const res = await app.request('/api/admin/login-records', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(res.status).toBe(200)

    const payload = await res.json() as {
      success: boolean
      data: {
        items: Array<{ surface: string }>
      }
    }

    expect(payload.success).toBe(true)
    expect(payload.data.items).toEqual([])
  })

  it('allows admin to switch user login record surface', async () => {
    const res = await app.request('/api/admin/user-login-records?surface=front&result=failure&identifier=user', {
      headers: {
        Authorization: 'Bearer admin-token',
      },
    })

    expect(res.status).toBe(200)

    const payload = await res.json() as {
      success: boolean
      data: {
        items: Array<{ surface: string, result: string, identifier: string }>
      }
    }

    expect(payload.success).toBe(true)
    expect(payload.data.items).toEqual([])
  })
})
