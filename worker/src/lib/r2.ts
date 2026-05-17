import type { WorkerBindings } from '../types'

export function buildFileUrl(env: WorkerBindings | undefined, key: string): string {
  const baseUrl = env?.R2_PUBLIC_BASE_URL ?? 'https://api.yourdomain.com/files'
  return `${baseUrl.replace(/\/$/, '')}/${key}`
}
