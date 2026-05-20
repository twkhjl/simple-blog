import type { UploadedFilePayload } from '../types'

const ALLOWED_IMAGE_TYPE_LIST = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

const ALLOWED_IMAGE_TYPES: ReadonlySet<string> = new Set(ALLOWED_IMAGE_TYPE_LIST)

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export const ACCEPTED_IMAGE_TYPES = ALLOWED_IMAGE_TYPE_LIST.join(',')

interface CreateImageUploaderOptions {
  postForm: <T>(path: string, body: FormData) => Promise<T>
  t: (key: string) => string
}

export function isSupportedImageType(file: File) {
  return ALLOWED_IMAGE_TYPES.has(file.type)
}

export function createImageUploader({ postForm, t }: CreateImageUploaderOptions) {
  return {
    async upload(file: File): Promise<UploadedFilePayload> {
      if (!isSupportedImageType(file)) {
        throw new Error(t('common.messages.inlineImageMustBeImage'))
      }

      if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(t('common.messages.inlineImageTooLarge'))
      }

      const formData = new FormData()
      formData.set('folder', 'posts')
      formData.set('file', file)

      return postForm<UploadedFilePayload>('/api/files/upload', formData)
    },
  }
}
