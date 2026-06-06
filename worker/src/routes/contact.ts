import { createSupabaseAdminClient } from '../lib/supabase'
import type { ContactMessageRecord, ContactMessageStatus, WorkerBindings } from '../types'

interface DbContactMessageRow {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactMessageStatus
  request_ip: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
  processed_at: string | null
}

interface ContactSubmissionPayload {
  name: string
  email: string
  subject: string
  message: string
}

interface ContactSubmissionMeta {
  requestIp: string | null
  userAgent: string | null
}

interface ContactListFilters {
  status?: ContactMessageStatus | 'all'
  search?: string
}

const CONTACT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const CONTACT_RATE_LIMIT_COUNT = 3

const mockContactMessages: ContactMessageRecord[] = [
  {
    id: 'contact-1',
    name: '王小明',
    email: 'reader@example.com',
    subject: '合作洽詢',
    message: '想了解你們是否提供技術內容合作與顧問服務。',
    status: 'pending',
    requestIp: '203.0.113.10',
    userAgent: 'Mozilla/5.0',
    createdAt: '2026-06-05T09:30:00.000Z',
    updatedAt: '2026-06-05T09:30:00.000Z',
    processedAt: null,
  },
]

function nowIso() {
  return new Date().toISOString()
}

function mapDbContactMessage(row: DbContactMessageRow): ContactMessageRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    requestIp: row.request_ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    processedAt: row.processed_at,
  }
}

function normalizeContactSubmission(payload: Partial<ContactSubmissionPayload> | null) {
  return {
    name: typeof payload?.name === 'string' ? payload.name.trim() : '',
    email: typeof payload?.email === 'string' ? payload.email.trim() : '',
    subject: typeof payload?.subject === 'string' ? payload.subject.trim() : '',
    message: typeof payload?.message === 'string' ? payload.message.trim() : '',
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function matchesSearch(message: ContactMessageRecord, search: string) {
  const keyword = search.trim().toLowerCase()
  if (!keyword) {
    return true
  }

  return (
    message.name.toLowerCase().includes(keyword)
    || message.email.toLowerCase().includes(keyword)
    || message.subject.toLowerCase().includes(keyword)
  )
}

function toAdminListItem(message: ContactMessageRecord) {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    subject: message.subject,
    status: message.status,
    createdAt: message.createdAt,
    processedAt: message.processedAt,
  }
}

function toAdminDetail(message: ContactMessageRecord) {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    status: message.status,
    requestIp: message.requestIp,
    userAgent: message.userAgent,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    processedAt: message.processedAt,
  }
}

async function countRecentSubmissionsByIp(env: WorkerBindings | undefined, requestIp: string | null) {
  if (!requestIp) {
    return 0
  }

  const cutoffIso = new Date(Date.now() - CONTACT_RATE_LIMIT_WINDOW_MS).toISOString()
  const adminClient = env ? createSupabaseAdminClient(env) : null

  if (!adminClient) {
    return mockContactMessages.filter(message =>
      message.requestIp === requestIp && message.createdAt >= cutoffIso,
    ).length
  }

  const { data, error } = await adminClient
    .from('contact_messages')
    .select('id')
    .eq('request_ip', requestIp)
    .gte('created_at', cutoffIso)

  if (error || !data) {
    return 0
  }

  return data.length
}

export async function submitContactMessage(
  env: WorkerBindings | undefined,
  payload: Partial<ContactSubmissionPayload> | null,
  meta: ContactSubmissionMeta,
) {
  const normalized = normalizeContactSubmission(payload)
  if (!normalized.name || !normalized.email || !normalized.subject || !normalized.message) {
    return { error: 'All contact fields are required.', code: 'VALIDATION_ERROR' as const, message: null }
  }

  if (!isValidEmail(normalized.email)) {
    return { error: 'Email format is invalid.', code: 'VALIDATION_ERROR' as const, message: null }
  }

  const recentCount = await countRecentSubmissionsByIp(env, meta.requestIp)
  if (recentCount >= CONTACT_RATE_LIMIT_COUNT) {
    return { error: 'Too many contact submissions. Please try again later.', code: 'RATE_LIMITED' as const, message: null }
  }

  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const created: ContactMessageRecord = {
      id: crypto.randomUUID(),
      name: normalized.name,
      email: normalized.email,
      subject: normalized.subject,
      message: normalized.message,
      status: 'pending',
      requestIp: meta.requestIp,
      userAgent: meta.userAgent,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      processedAt: null,
    }
    mockContactMessages.unshift(created)
    return { error: null, code: null, message: created }
  }

  const { data, error } = await adminClient
    .from('contact_messages')
    .insert({
      name: normalized.name,
      email: normalized.email,
      subject: normalized.subject,
      message: normalized.message,
      status: 'pending',
      request_ip: meta.requestIp,
      user_agent: meta.userAgent,
    })
    .select('id, name, email, subject, message, status, request_ip, user_agent, created_at, updated_at, processed_at')
    .single()

  if (error || !data) {
    return { error: 'Failed to submit contact message.', code: 'INTERNAL_ERROR' as const, message: null }
  }

  return { error: null, code: null, message: mapDbContactMessage(data as DbContactMessageRow) }
}

export async function listAdminContactMessages(env: WorkerBindings | undefined, filters: ContactListFilters = {}) {
  const status = filters.status ?? 'all'
  const search = filters.search?.trim() ?? ''
  const adminClient = env ? createSupabaseAdminClient(env) : null

  if (!adminClient) {
    return mockContactMessages
      .filter(message => status === 'all' || message.status === status)
      .filter(message => matchesSearch(message, search))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toAdminListItem)
  }

  let query = adminClient
    .from('contact_messages')
    .select('id, name, email, subject, message, status, request_ip, user_agent, created_at, updated_at, processed_at')
    .order('created_at', { ascending: false })

  if (status === 'pending' || status === 'processed') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error || !data) {
    return []
  }

  return (data as DbContactMessageRow[]).map(mapDbContactMessage).map(toAdminListItem)
}

export async function getAdminContactMessageById(id: string, env?: WorkerBindings) {
  const adminClient = env ? createSupabaseAdminClient(env) : null
  if (!adminClient) {
    const record = mockContactMessages.find(message => message.id === id) ?? null
    return record ? toAdminDetail(record) : null
  }

  const { data, error } = await adminClient
    .from('contact_messages')
    .select('id, name, email, subject, message, status, request_ip, user_agent, created_at, updated_at, processed_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return toAdminDetail(mapDbContactMessage(data as DbContactMessageRow))
}

export async function updateAdminContactMessageStatus(
  env: WorkerBindings | undefined,
  id: string,
  status: ContactMessageStatus,
) {
  const processedAt = status === 'processed' ? nowIso() : null
  const adminClient = env ? createSupabaseAdminClient(env) : null

  if (!adminClient) {
    const target = mockContactMessages.find(message => message.id === id)
    if (!target) {
      return { error: 'Contact message not found.', message: null }
    }

    target.status = status
    target.processedAt = processedAt
    target.updatedAt = nowIso()
    return { error: null, message: toAdminDetail(target) }
  }

  const { data, error } = await adminClient
    .from('contact_messages')
    .update({
      status,
      processed_at: processedAt,
    })
    .eq('id', id)
    .select('id, name, email, subject, message, status, request_ip, user_agent, created_at, updated_at, processed_at')
    .maybeSingle()

  if (error || !data) {
    return { error: 'Contact message not found.', message: null }
  }

  return { error: null, message: toAdminDetail(mapDbContactMessage(data as DbContactMessageRow)) }
}
