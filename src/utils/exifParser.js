// exifParser.js - EXIF Metadata & Windows Explorer Properties (XPKeywords, IPTC, XMP) Extractor
import exifr from 'exifr'

/**
 * Calculate greatest common divisor for aspect ratio
 */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

export function calculateAspectRatio(width, height) {
  if (!width || !height) return ''
  const divisor = gcd(width, height)
  const w = width / divisor
  const h = height / divisor
  if (Math.abs(w / h - 16 / 9) < 0.05) return '16:9'
  if (Math.abs(w / h - 4 / 3) < 0.05) return '4:3'
  if (Math.abs(w / h - 3 / 2) < 0.05) return '3:2'
  if (Math.abs(w / h - 1 / 1) < 0.05) return '1:1'
  return `${w}:${h}`
}

/**
 * Helper to decode Windows XPKeywords string (UTF-16LE encoded array or raw string)
 */
function parseXPKeywords(rawKeywords) {
  if (!rawKeywords) return []
  let text = ''
  
  if (typeof rawKeywords === 'string') {
    text = rawKeywords
  } else if (Array.isArray(rawKeywords) || rawKeywords instanceof Uint8Array || rawKeywords instanceof Uint16Array) {
    try {
      // Decode UTF-16LE
      const decoder = new TextDecoder('utf-16le')
      const buffer = rawKeywords.buffer ? rawKeywords.buffer : new Uint8Array(rawKeywords).buffer
      text = decoder.decode(buffer)
    } catch (e) {
      text = String.fromCharCode.apply(null, rawKeywords)
    }
  }

  // Windows tags are semicolon (;) or comma (,) separated
  return text
    .replace(/\0/g, '') // remove null bytes
    .split(/[;,]/)
    .map((k) => k.trim().replace(/^#/, ''))
    .filter((k) => k.length > 0)
}

export async function parseFileExif(file) {
  if (!file) return null

  try {
    const rawData = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: true,
      mergeOutput: true,
      reviveValues: true
    })

    if (!rawData) return null

    // 1. Extract Windows Explorer & IPTC Tags (XPKeywords, Keywords, Subject)
    let fileMetadataTags = []

    if (rawData.XPKeywords) {
      fileMetadataTags.push(...parseXPKeywords(rawData.XPKeywords))
    }
    if (rawData.Keywords) {
      if (Array.isArray(rawData.Keywords)) {
        fileMetadataTags.push(...rawData.Keywords)
      } else if (typeof rawData.Keywords === 'string') {
        fileMetadataTags.push(...parseXPKeywords(rawData.Keywords))
      }
    }
    if (rawData.Subject) {
      if (Array.isArray(rawData.Subject)) {
        fileMetadataTags.push(...rawData.Subject)
      } else if (typeof rawData.Subject === 'string') {
        fileMetadataTags.push(...parseXPKeywords(rawData.Subject))
      }
    }

    // Remove duplicates
    fileMetadataTags = Array.from(new Set(fileMetadataTags))

    // 2. Extract Windows Title & Rating
    const winTitle = rawData.XPTitle || rawData.Title || rawData.Headline || null
    const winRating = rawData.Rating || rawData.XPRating || null

    // 3. Extract Camera Info
    const camera = {
      make: rawData.Make || null,
      model: rawData.Model || null,
      lens: rawData.LensModel || rawData.LensInfo || null,
      fNumber: rawData.FNumber ? `f/${rawData.FNumber}` : null,
      exposureTime: rawData.ExposureTime ? (
        rawData.ExposureTime < 1 ? `1/${Math.round(1 / rawData.ExposureTime)}s` : `${rawData.ExposureTime}s`
      ) : null,
      iso: rawData.ISO ? `ISO ${rawData.ISO}` : null,
      focalLength: rawData.FocalLength ? `${rawData.FocalLength}mm` : null,
      flash: rawData.Flash ? String(rawData.Flash) : null
    }

    // 4. Extract GPS Info
    const gps = {
      latitude: rawData.latitude || null,
      longitude: rawData.longitude || null,
      altitude: rawData.altitude ? `${Math.round(rawData.altitude)}m` : null
    }

    // 5. Extract Image Specs
    const image = {
      colorSpace: rawData.ColorSpace === 1 ? 'sRGB' : (rawData.ColorSpace ? String(rawData.ColorSpace) : 'sRGB'),
      dateTimeOriginal: rawData.DateTimeOriginal ? new Date(rawData.DateTimeOriginal).toLocaleString() : null,
      software: rawData.Software || null,
      title: winTitle,
      rating: winRating
    }

    return { 
      camera, 
      gps, 
      image, 
      fileMetadataTags, 
      rawData 
    }
  } catch (err) {
    console.warn('EXIF/Windows Metadata parsing skipped or unsupported file format:', err)
    return null
  }
}
