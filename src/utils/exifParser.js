// exifParser.js - EXIF Metadata & GPS Extractor
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
  // Standardize common aspect ratios
  if (Math.abs(w / h - 16 / 9) < 0.05) return '16:9'
  if (Math.abs(w / h - 4 / 3) < 0.05) return '4:3'
  if (Math.abs(w / h - 3 / 2) < 0.05) return '3:2'
  if (Math.abs(w / h - 1 / 1) < 0.05) return '1:1'
  return `${w}:${h}`
}

export async function parseFileExif(file) {
  if (!file) return null

  try {
    const rawData = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      reviveValues: true
    })

    if (!rawData) return null

    // Extract Camera Info
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

    // Extract GPS Info
    const gps = {
      latitude: rawData.latitude || null,
      longitude: rawData.longitude || null,
      altitude: rawData.altitude ? `${Math.round(rawData.altitude)}m` : null
    }

    // Extract Image Specs
    const image = {
      colorSpace: rawData.ColorSpace === 1 ? 'sRGB' : (rawData.ColorSpace ? String(rawData.ColorSpace) : 'sRGB'),
      dateTimeOriginal: rawData.DateTimeOriginal ? new Date(rawData.DateTimeOriginal).toLocaleString() : null,
      software: rawData.Software || null
    }

    return { camera, gps, image, rawData }
  } catch (err) {
    console.warn('EXIF parsing skipped or unsupported file format:', err)
    return null
  }
}
