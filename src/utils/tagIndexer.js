// tagIndexer.js - Fast Tag Indexer for Selected Folder Media Files
import { getFileFromEntry, getFileExtension } from './fileSystem'
import { parseFileExif, calculateAspectRatio } from './exifParser'

/**
 * Extracts all tags for a single media file:
 * - User custom tags (from localStorage)
 * - Windows XPKeywords / IPTC / XMP tags (from EXIF)
 * - Auto system tags (extension, media type, resolution)
 */
export async function getFileTags(fileEntry) {
  const tags = new Set()

  if (!fileEntry) return tags

  // 1. System Auto Tags (Extension & Type)
  const ext = getFileExtension(fileEntry.name).toUpperCase()
  if (ext) tags.add(ext)
  tags.add(fileEntry.mediaType === 'video' ? '동영상' : '이미지')

  // 2. User Custom Tags (from localStorage)
  const rawKey = fileEntry.id || fileEntry.path || fileEntry.name
  const saved = localStorage.getItem('vt_tags_v2_' + encodeURIComponent(rawKey))
  if (saved) {
    try {
      const userTags = JSON.parse(saved)
      if (Array.isArray(userTags)) {
        userTags.forEach((t) => tags.add(t.trim().replace(/^#/, '')))
      }
    } catch (e) {}
  }

  // 3. EXIF Embedded Tags (XPKeywords, Keywords, Subject)
  if (fileEntry.mediaType === 'image') {
    try {
      const fObj = await getFileFromEntry(fileEntry)
      if (fObj) {
        const exif = await parseFileExif(fObj)
        if (exif && exif.fileMetadataTags && Array.isArray(exif.fileMetadataTags)) {
          exif.fileMetadataTags.forEach((t) => tags.add(t.trim().replace(/^#/, '')))
        }
      }
    } catch (err) {
      console.warn('Tag extraction failed for:', fileEntry.name, err)
    }
  }

  return tags
}

/**
 * Scan all media files in current folder to build:
 * 1. fileTagMap: Map<fileId, Set<tag>>
 * 2. availableTags: Array<{ tag: string, count: number }> sorted by count descending
 */
export async function buildFolderTagIndex(mediaFiles = []) {
  const fileTagMap = new Map()
  const tagCountMap = new Map()

  for (const fileEntry of mediaFiles) {
    const fileTags = await getFileTags(fileEntry)
    fileTagMap.set(fileEntry.id, fileTags)

    fileTags.forEach((tag) => {
      if (!tag) return
      tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1)
    })
  }

  // Convert tag count map to array sorted by frequency
  const availableTags = Array.from(tagCountMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ko'))

  return { fileTagMap, availableTags }
}
