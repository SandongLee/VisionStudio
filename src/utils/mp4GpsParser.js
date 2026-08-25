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
 * Parse QuickTime / MP4 ISOBMFF ArrayBuffer to extract GPS coordinates
 */
export async function parseMp4Gps(file) {
  if (!file) return null

  try {
    // Read first 5MB of file where moov/udta atoms reside
    const sliceSize = Math.min(file.size, 5 * 1024 * 1024)
    const buffer = await file.slice(0, sliceSize).arrayBuffer()
    const view = new DataView(buffer)
    const u8 = new Uint8Array(buffer)

    // 1. Traverse MP4 Container Atoms looking for 'moov' -> 'udta' / 'meta'
    let gpsResult = searchAtoms(view, u8, 0, buffer.byteLength)
    if (gpsResult) return gpsResult

    // 2. Fallback: Byte string pattern scan for ISO 6709 coordinate strings in moov buffer
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
 * Recursive ISOBMFF Atom Parser
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
