// fileSystem.js - File System Access API & Progressive Streaming Directory Scanner

export const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'])
export const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'ogv'])

export function getFileExtension(filename) {
  if (!filename || !filename.includes('.')) return ''
  return filename.split('.').pop().toLowerCase()
}

export function getMediaType(filename) {
  const ext = getFileExtension(filename)
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'
  return null
}

export function isMediaFile(filename) {
  return getMediaType(filename) !== null
}

/**
 * Open local directory using File System Access API
 */
export async function openDirectoryPicker() {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('FILE_SYSTEM_API_UNSUPPORTED')
  }
  
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read'
    })
    return dirHandle
  } catch (err) {
    if (err.name === 'AbortError') return null
    throw err
  }
}

/**
 * Progressive Streaming Directory Reader (Method 5 + Method 1 Stream)
 * Yields root items immediately in <0.05s, then streams subfolder entries in chunked batches
 */
export async function scanDirectoryStreaming(dirHandle, onBatchStream = null, parentPath = '') {
  const path = parentPath ? `${parentPath}/${dirHandle.name}` : dirHandle.name
  
  const rootNode = {
    id: path,
    name: dirHandle.name,
    path: path,
    type: 'directory',
    handle: dirHandle,
    children: [],
    mediaFiles: [],
    mediaCount: 0
  }

  const subDirQueue = []
  let currentBatch = []
  const BATCH_SIZE = 40

  const emitBatch = () => {
    if (currentBatch.length > 0 && onBatchStream) {
      onBatchStream([...currentBatch])
      currentBatch = []
    }
  }

  try {
    // 1. First Pass: Fast scan ROOT folder files only for instant <0.05s UI display
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
        subDirQueue.push({ handle: entry, parentPath: path })
      } else if (entry.kind === 'file') {
        const mediaType = getMediaType(entry.name)
        if (mediaType) {
          const fileObj = {
            id: `${path}/${entry.name}`,
            name: entry.name,
            path: `${path}/${entry.name}`,
            type: 'file',
            mediaType: mediaType,
            handle: entry,
            parentPath: path
          }
          rootNode.mediaFiles.push(fileObj)
          rootNode.mediaCount += 1
          currentBatch.push(fileObj)

          if (currentBatch.length >= BATCH_SIZE) {
            emitBatch()
          }
        }
      }
    }

    emitBatch()

    // 2. Second Pass: Stream subfolders in non-blocking async chunks
    for (const subDir of subDirQueue) {
      await new Promise((resolve) => setTimeout(resolve, 0))

      const subDirNode = await scanDirectoryHandle(subDir.handle, subDir.parentPath, (fileObj) => {
        currentBatch.push(fileObj)
        if (currentBatch.length >= BATCH_SIZE) {
          emitBatch()
        }
      })

      rootNode.children.push(subDirNode)
      rootNode.mediaCount += subDirNode.mediaCount
    }

    emitBatch()

    rootNode.children.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    rootNode.mediaFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  } catch (err) {
    console.error(`Failed to read directory ${dirHandle.name}:`, err)
  }

  return rootNode
}

/**
 * Standard Directory Scanner with progress callback
 */
export async function scanDirectoryHandle(dirHandle, parentPath = '', onProgress = null) {
  const path = parentPath ? `${parentPath}/${dirHandle.name}` : dirHandle.name
  
  const node = {
    id: path,
    name: dirHandle.name,
    path: path,
    type: 'directory',
    handle: dirHandle,
    children: [],
    mediaFiles: [],
    mediaCount: 0
  }

  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
        
        const subDirNode = await scanDirectoryHandle(entry, path, onProgress)
        node.children.push(subDirNode)
        node.mediaCount += subDirNode.mediaCount
      } else if (entry.kind === 'file') {
        const mediaType = getMediaType(entry.name)
        if (mediaType) {
          const fileObj = {
            id: `${path}/${entry.name}`,
            name: entry.name,
            path: `${path}/${entry.name}`,
            type: 'file',
            mediaType: mediaType,
            handle: entry,
            parentPath: path
          }
          node.mediaFiles.push(fileObj)
          node.mediaCount += 1
          if (onProgress) onProgress(fileObj)
        }
      }
    }

    node.children.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    node.mediaFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  } catch (err) {
    console.error(`Failed to read directory ${dirHandle.name}:`, err)
  }

  return node
}

/**
 * Collect all media files in a folder and all its subfolders recursively
 */
export function collectAllMediaFiles(node, includeSubfolders = true) {
  if (!node) return []
  if (!includeSubfolders) return node.mediaFiles || []

  let allFiles = [...(node.mediaFiles || [])]

  if (node.children && node.children.length > 0) {
    for (const childNode of node.children) {
      allFiles = allFiles.concat(collectAllMediaFiles(childNode, true))
    }
  }

  const map = new Map()
  allFiles.forEach((file) => map.set(file.id, file))
  return Array.from(map.values())
}

/**
 * Helper to get a File object from FileHandle or File input entry
 */
export async function getFileFromEntry(entry) {
  if (entry.handle && typeof entry.handle.getFile === 'function') {
    return await entry.handle.getFile()
  }
  if (entry.fileObj instanceof File) {
    return entry.fileObj
  }
  return null
}

/**
 * Parse HTML5 input webkitdirectory file list into tree structure
 */
export function buildTreeFromWebkitFileList(fileList, onProgress = null) {
  if (!fileList || fileList.length === 0) return null

  const rootName = fileList[0].webkitRelativePath.split('/')[0] || 'Selected Folder'
  const rootNode = {
    id: rootName,
    name: rootName,
    path: rootName,
    type: 'directory',
    children: [],
    mediaFiles: [],
    mediaCount: 0
  }

  const dirMap = new Map()
  dirMap.set(rootName, rootNode)

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    const mediaType = getMediaType(file.name)
    if (!mediaType) continue

    const parts = file.webkitRelativePath.split('/')
    let currentPath = ''

    for (let p = 0; p < parts.length - 1; p++) {
      const part = parts[p]
      const parentPath = currentPath
      currentPath = currentPath ? `${currentPath}/${part}` : part

      if (!dirMap.has(currentPath)) {
        const newDir = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: 'directory',
          children: [],
          mediaFiles: [],
          mediaCount: 0
        }
        dirMap.set(currentPath, newDir)

        if (parentPath && dirMap.has(parentPath)) {
          dirMap.get(parentPath).children.push(newDir)
        }
      }
    }

    const parentDir = dirMap.get(currentPath || rootName)
    if (parentDir) {
      const fileEntry = {
        id: file.webkitRelativePath || `${rootName}/${file.name}`,
        name: file.name,
        path: file.webkitRelativePath || `${rootName}/${file.name}`,
        type: 'file',
        mediaType: mediaType,
        fileObj: file,
        parentPath: currentPath || rootName
      }
      parentDir.mediaFiles.push(fileEntry)
      if (onProgress) onProgress(fileEntry)

      let pathSegments = (currentPath || rootName).split('/')
      let cumulativePath = ''
      for (const seg of pathSegments) {
        cumulativePath = cumulativePath ? `${cumulativePath}/${seg}` : seg
        if (dirMap.has(cumulativePath)) {
          dirMap.get(cumulativePath).mediaCount += 1
        }
      }
    }
  }

  return rootNode
}
