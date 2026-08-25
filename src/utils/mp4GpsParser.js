// mp4GpsParser.js - Native MP4/MOV ISOBMFF QuickTime Atom GPS Location Parser

/**
 * Parses ISO-6709 coordinate string (e.g., "+37.8117+128.8988/" or "+37.8117+128.8988+038.000/")
 */
export function parseIso6709(str) {
  if (!str || typeof str !== 'string') return null
  const match = str.match(/([+-]\d+\.?\d*)\s*([+-]\d+\.?\d*)/)
  if (match) {
    const lat = parseFloat(match[1])
    const lon = parseFloat(match[2])
    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { latitude: lat, longitude: lon }
    }
  }
  return null
}

/**
 * Read a box header (type + size, handling the 64-bit extended size form) at a given
 * file offset without loading the box's payload. Used to walk top-level boxes cheaply,
 * since 'mdat' (raw media data) can be hundreds of MB and 'moov' can sit before OR after it.
 */
async function readBoxHeader(file, offset) {
  const fileSize = file.size
  if (offset + 8 > fileSize) return null

  const headerBuf = await file.slice(offset, Math.min(offset + 16, fileSize)).arrayBuffer()
  if (headerBuf.byteLength < 8) return null

  const view = new DataView(headerBuf)
  const u8 = new Uint8Array(headerBuf)
  const type = String.fromCharCode(u8[4], u8[5], u8[6], u8[7])

  let size = view.getUint32(0)
  let headerSize = 8

  if (size === 1) {
    // 64-bit extended size stored in the next 8 bytes
    if (headerBuf.byteLength < 16) return null
    const high = view.getUint32(8)
    const low = view.getUint32(12)
    size = high * 0x100000000 + low
    headerSize = 16
  } else if (size === 0) {
    // Size 0 means "box extends to the end of the file" (last box, e.g. a streamed mdat)
    size = fileSize - offset
  }

  if (size < headerSize || offset + size > fileSize) return null

  return { type, offset, size, headerSize }
}

/**
 * Walk top-level boxes of the file (ftyp, mdat, moov, free, ...) looking for a specific
 * box type, without reading box payloads. Works regardless of whether 'moov' is placed
 * before or after 'mdat' (iPhone/Android camera recordings commonly write 'moov' last,
 * since only "web-optimized"/faststart exports move it to the front).
 */
async function findTopLevelBox(file, targetType) {
  let offset = 0
  const fileSize = file.size

  while (offset + 8 <= fileSize) {
    const box = await readBoxHeader(file, offset)
    if (!box) break

    if (box.type === targetType) return box

    offset += box.size
  }

  return null
}

/**
 * Parse QuickTime / MP4 ISOBMFF file to extract GPS coordinates embedded in 'moov'.
 */
export async function parseMp4Gps(file) {
  if (!file) return null

  try {
    // 1. Locate the 'moov' box anywhere in the file (front OR back) via a cheap header-only walk,
    //    then read ONLY that byte range instead of the whole file.
    const moovBox = await findTopLevelBox(file, 'moov')
    if (moovBox) {
      const moovBuffer = await file.slice(moovBox.offset, moovBox.offset + moovBox.size).arrayBuffer()
      const moovView = new DataView(moovBuffer)
      const moovU8 = new Uint8Array(moovBuffer)

      const gpsResult = searchAtoms(moovView, moovU8, 0, moovBuffer.byteLength)
      if (gpsResult) return gpsResult

      // Fallback: raw byte-string pattern scan restricted to the moov box itself
      const text = new TextDecoder('ascii', { fatal: false }).decode(moovU8)
      const isoMatch = text.match(/([+-]\d{2}\.\d{3,}[+-]\d{3}\.\d{3,}\/?)/)
      if (isoMatch) {
        const parsed = parseIso6709(isoMatch[1])
        if (parsed) return parsed
      }

      // A valid 'moov' box was found and fully scanned but has no GPS atom -> genuinely no GPS data
      return null
    }

    // 2. Last-resort fallback for non-standard/malformed files where the top-level box walk
    //    failed to find a well-formed 'moov' header: scan the first 5MB as raw bytes.
    const sliceSize = Math.min(file.size, 5 * 1024 * 1024)
    const buffer = await file.slice(0, sliceSize).arrayBuffer()
    const u8 = new Uint8Array(buffer)
    const text = new TextDecoder('ascii', { fatal: false }).decode(u8)
    const isoMatch = text.match(/([+-]\d{2}\.\d{3,}[+-]\d{3}\.\d{3,}\/?)/)
    if (isoMatch) {
      const parsed = parseIso6709(isoMatch[1])
      if (parsed) return parsed
    }
  } catch (err) {
    console.warn('MP4 GPS parsing error:', err)
  }

  return null
}

/**
 * Recursive ISOBMFF Atom Parser (operates on an already-loaded buffer, e.g. just the moov box)
 */
function searchAtoms(view, u8, startOffset, endOffset) {
  let offset = startOffset

  while (offset + 8 <= endOffset) {
    let size = view.getUint32(offset)
    const type = String.fromCharCode(
      u8[offset + 4],
      u8[offset + 5],
      u8[offset + 6],
      u8[offset + 7]
    )

    if (size === 1 && offset + 16 <= endOffset) {
      // 64-bit extended size
      const high = view.getUint32(offset + 8)
      const low = view.getUint32(offset + 12)
      size = high * 0x100000000 + low
    } else if (size === 0) {
      // Box extends to the end of the current container
      size = endOffset - offset
    }

    if (size <= 0 || offset + size > endOffset) {
      // Invalid atom size boundary
      break
    }

    const payloadOffset = offset + 8
    const payloadSize = size - 8

    // Direct QuickTime '©xyz' Location Atom found!
    if (type === '©xyz' || type === 'xyz ') {
      const textSlice = new TextDecoder('ascii').decode(u8.subarray(payloadOffset, payloadOffset + payloadSize))
      const gps = parseIso6709(textSlice)
      if (gps) return gps
    }

    // Container atoms: recursive dive
    if (['moov', 'udta', 'meta', 'keys', 'ilst', 'trak', 'mdia', 'minf', 'stbl'].includes(type)) {
      const subOffset = type === 'meta' ? payloadOffset + 4 : payloadOffset // 'meta' is a FullAtom (skip 4 version/flags bytes)
      const res = searchAtoms(view, u8, subOffset, offset + size)
      if (res) return res
    }

    offset += size
  }

  return null
}
