import type { UploadedFilePayload } from '../types'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

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
