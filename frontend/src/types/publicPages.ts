export interface PublicNavItem {
  label: string
  to: string
}

export interface PublicFooterLink {
  label: string
  to: string
}

export interface PublicMetric {
  label: string
  value: string
}

export interface PublicSection {
  title: string
  body: string
}

export interface PublicContactCard {
  label: string
  value: string
}

export interface PublicContactField {
  id: string
  label: string
  placeholder: string
  type: 'text' | 'email' | 'textarea'
}

export interface PublicMockPost {
  id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  coverImageUrl: string
  category: string
  readTime: string
  author: string
  content: string[]
}
