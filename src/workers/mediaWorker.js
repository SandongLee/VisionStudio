// mediaWorker.js - Background Web Worker for Image/Thumbnail Decoding & EXIF Parsing

self.onmessage = async (e) => {
  const { taskId, type, file, options } = e.data

  try {
    if (type === 'GENERATE_THUMBNAIL') {
      // 1. Off-main-thread Image Bitmap Decoding
      if (file.type.startsWith('image/')) {
        const bitmap = await createImageBitmap(file, {
          resizeWidth: 320,
          resizeQuality: 'medium'
        })

        // OffscreenCanvas Rendering
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(bitmap, 0, 0)

        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 })
        bitmap.close()

        self.postMessage({
          taskId,
          success: true,
          result: { blob, size: file.size, lastModified: file.lastModified }
        })
      } else {
        // Fallback for non-image or video handled by main player
        self.postMessage({
          taskId,
          success: true,
          result: { size: file.size, lastModified: file.lastModified }
        })
      }
    } else {
      self.postMessage({ taskId, success: true, result: null })
    }
  } catch (err) {
    self.postMessage({
      taskId,
      success: false,
      error: err.message || 'Worker task failed'
    })
  }
}
