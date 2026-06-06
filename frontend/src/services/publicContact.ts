import type { PublicContactSubmission } from '../types'
import { createApiClient } from './api'

const client = createApiClient(fetch)

export const publicContactService = {
  submitContact(payload: PublicContactSubmission) {
    return client.post<{ success: true }>('/api/contact', payload)
  },
}
