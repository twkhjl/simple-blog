import { describe, expect, it } from 'vitest'
import { slugifyTagName, uniqTagInputs } from '../src/lib/tags'

describe('tag helpers', () => {
  it('keeps chinese characters in tag slug', () => {
    expect(slugifyTagName('西子灣')).toBe('西子灣')
    expect(slugifyTagName('西子灣 夕陽')).toBe('西子灣-夕陽')
  })

  it('deduplicates chinese tags with normalized spacing', () => {
    expect(uniqTagInputs([' 西子灣 ', '西子灣', '西子灣   '])).toEqual(['西子灣'])
  })
})
