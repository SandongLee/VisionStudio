// thumbnailGenerator.js - Asynchronous Media Thumbnail Generator & ObjectURL Caching System

const thumbnailCache = new Map()

/**
 * Generate object URL for file entry
 */
export function getOrCreateObjectURL(fileEntry) {
  if (fileEntry.objectUrl) return fileEntry.objectUrl
  
  if (fileEntry.fileObj) {
    fileEntry.objectUrl = URL.createObjectURL(fileEntry.fileObj)
    return fileEntry.objectUrl
  }
  return null
}

/**
 * Generate video frame thumbnail at specific timestamp (default 1.0s)
 */
export function generateVideoThumbnail(file, targetTime = 1.0) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    
    const fileUrl = URL.createObjectURL(file)
    video.src = fileUrl

    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
    }

    video.onloadedmetadata = () => {
      // Seek to target time (or half duration if video is shorter)
      const seekTime = Math.min(targetTime, video.duration > 0 ? video.duration / 2 : 0)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        const aspect = video.videoWidth / video.videoHeight || 16 / 9
        canvas.width = 320
        canvas.height = 320 / aspect

        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          cleanup()
          if (blob) {
            const thumbUrl = URL.createObjectURL(blob)
            resolve({
              thumbnailUrl: thumbUrl,
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            })
          } else {
            resolve({ thumbnailUrl: fileUrl, duration: video.duration })
          }
        }, 'image/jpeg', 0.8)
      } catch (e) {
        console.warn('Canvas thumbnail capture failed, fallback to raw url:', e)
        cleanup()
        resolve({ thumbnailUrl: fileUrl, duration: video.duration })
      }
    }

    video.onerror = () => {
      cleanup()
      resolve({ thumbnailUrl: null, duration: 0 })
    }
  })
}

/**
 * Cached Thumbnail Resolver
 */
export async function getMediaThumbnail(fileEntry, getFileFn) {
  if (thumbnailCache.has(fileEntry.id)) {
    return thumbnailCache.get(fileEntry.id)
  }

  try {
    const file = await getFileFn(fileEntry)
    if (!file) return { thumbnailUrl: null }

    if (fileEntry.mediaType === 'image') {
      const imgUrl = URL.createObjectURL(file)
      const result = { thumbnailUrl: imgUrl, size: file.size, lastModified: file.lastModified }
      thumbnailCache.set(fileEntry.id, result)
      return result
    } else if (fileEntry.mediaType === 'video') {
      const videoResult = await generateVideoThumbnail(file, 1.0)
      const result = { 
        thumbnailUrl: videoResult.thumbnailUrl, 
        duration: videoResult.duration,
        videoWidth: videoResult.videoWidth,
        videoHeight: videoResult.videoHeight,
        size: file.size,
        lastModified: file.lastModified
      }
      thumbnailCache.set(fileEntry.id, result)
      return result
    }
  } catch (err) {
    console.error('Failed to generate thumbnail for:', fileEntry.name, err)
  }

  return { thumbnailUrl: null }
}

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format seconds to MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
