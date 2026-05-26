import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('legacy public media component cleanup', () => {
  it('removes the old PublicCoverMedia component', () => {
    const componentPath = resolve(__dirname, '../src/components/public/PublicCoverMedia.vue')
    expect(existsSync(componentPath)).toBe(false)
  })
})
