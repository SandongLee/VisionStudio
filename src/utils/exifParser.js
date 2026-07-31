// exifParser.js - EXIF Metadata & Windows Explorer Properties Auto-Decoder
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
 * Repair Mojibake UTF-8 bytes stored as Latin-1 string in IPTC (e.g. Samsung/Android Gallery IPTC Keywords)
 */
function fixLatin1Utf8Mojibake(str) {
  if (typeof str !== 'string') return str
  const cleaned = str.replace(/\0/g, '').trim()
  
  // 1. Try converting charCode byte sequence to UTF-8 TextDecoder
  try {
    const bytes = new Uint8Array(cleaned.length)
    for (let i = 0; i < cleaned.length; i++) {
      bytes[i] = cleaned.charCodeAt(i) & 0xff
    }
    const decoded = new TextDecoder('utf-8').decode(bytes)
    if (/[가-힣]/.test(decoded)) {
      return decoded
    }
  } catch (e) {}

  // 2. Try URI escape decoding
  try {
    const decodedUri = decodeURIComponent(escape(cleaned))
    if (/[가-힣]/.test(decodedUri)) {
      return decodedUri
    }
  } catch (e) {}

  return cleaned
}

/**
 * Smart Multi-Encoding Auto-Decoder for Korean and International EXIF/Windows Tags
 */
function decodeSmartString(rawInput) {
  if (rawInput === null || rawInput === undefined) return ''

  if (typeof rawInput === 'string') {
    return fixLatin1Utf8Mojibake(rawInput)
  }

  let u8 = null
  if (rawInput instanceof Uint8Array) {
    u8 = rawInput
  } else if (Array.isArray(rawInput)) {
    u8 = new Uint8Array(rawInput)
  } else if (rawInput.buffer) {
    u8 = new Uint8Array(rawInput.buffer, rawInput.byteOffset || 0, rawInput.byteLength || rawInput.length)
  }

  if (!u8 || u8.length === 0) return ''

  try {
    const text16 = new TextDecoder('utf-16le').decode(u8).replace(/\0/g, '').trim()
    if (/[가-힣]/.test(text16) || (/^[a-zA-Z0-9\s;,._#-]+$/.test(text16) && text16.length > 0)) {
      return text16
    }
  } catch (e) {}

  try {
    const textEuc = new TextDecoder('euc-kr').decode(u8).replace(/\0/g, '').trim()
    if (/[가-힣]/.test(textEuc)) {
      return textEuc
    }
  } catch (e) {}

  try {
    const textUtf8 = new TextDecoder('utf-8').decode(u8).replace(/\0/g, '').trim()
    if (textUtf8) {
      return fixLatin1Utf8Mojibake(textUtf8)
    }
  } catch (e) {}

  return ''
}

/**
 * Split keywords string into clean individual tag array
 */
function parseXPKeywords(rawKeywords) {
  if (!rawKeywords) return []

  let decodedText = ''
  if (Array.isArray(rawKeywords)) {
    decodedText = rawKeywords.map(decodeSmartString).join(';')
  } else {
    decodedText = decodeSmartString(rawKeywords)
  }

  return decodedText
    .split(/[;,]/)
    .map((k) => k.trim().replace(/^#/, ''))
    .filter((k) => k.length > 0 && !/^[\s\0]+$/.test(k))
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

    // 1. Extract Tags
    let fileMetadataTags = []
    if (rawData.subject) {
      if (Array.isArray(rawData.subject)) {
        rawData.subject.forEach((s) => fileMetadataTags.push(...parseXPKeywords(s)))
      } else {
        fileMetadataTags.push(...parseXPKeywords(rawData.subject))
      }
    }
    if (rawData.XPKeywords) {
      fileMetadataTags.push(...parseXPKeywords(rawData.XPKeywords))
    }
    if (rawData.Keywords) {
      if (Array.isArray(rawData.Keywords)) {
        rawData.Keywords.forEach((k) => fileMetadataTags.push(...parseXPKeywords(k)))
      } else {
        fileMetadataTags.push(...parseXPKeywords(rawData.Keywords))
      }
    }
    fileMetadataTags = Array.from(new Set(fileMetadataTags))

    // 2. Title & Rating
    const rawTitle = rawData.XPTitle || rawData.Title || rawData.Headline || null
    const winTitle = rawTitle ? decodeSmartString(rawTitle) : null
    const winRating = rawData.Rating || rawData.XPRating || null

    // 3. Camera Info
    const camera = {
      make: rawData.Make ? decodeSmartString(rawData.Make) : null,
      model: rawData.Model ? decodeSmartString(rawData.Model) : null,
      lens: rawData.LensModel || rawData.LensInfo || null,
      fNumber: rawData.FNumber ? `f/${rawData.FNumber}` : null,
      exposureTime: rawData.ExposureTime ? (
        rawData.ExposureTime < 1 ? `1/${Math.round(1 / rawData.ExposureTime)}s` : `${rawData.ExposureTime}s`
      ) : null,
      iso: rawData.ISO ? `ISO ${rawData.ISO}` : null,
      focalLength: rawData.FocalLength ? `${rawData.FocalLength}mm` : null,
      flash: rawData.Flash ? String(rawData.Flash) : null
    }

    // 4. GPS Info
    const gps = {
      latitude: rawData.latitude || null,
      longitude: rawData.longitude || null,
      altitude: rawData.altitude ? `${Math.round(rawData.altitude)}m` : null
    }

    // 5. Creation Date (DateTimeOriginal / CreateDate)
    const rawCreated = rawData.DateTimeOriginal || rawData.CreateDate || rawData.ModifyDate || null
    const createdDate = rawCreated ? new Date(rawCreated).toLocaleString() : null

    // 6. Image Specs
    const image = {
      colorSpace: rawData.ColorSpace === 1 ? 'sRGB' : (rawData.ColorSpace ? String(rawData.ColorSpace) : 'sRGB'),
      dateTimeOriginal: createdDate,
      createdDate: createdDate,
      software: rawData.Software ? decodeSmartString(rawData.Software) : null,
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
