import React, { useState, useEffect } from 'react'
import { 
  Sliders, 
  X, 
  Copy, 
  Check, 
  FileText, 
  HardDrive, 
  Calendar, 
  Camera, 
  MapPin, 
  Tag, 
  Image as ImageIcon, 
  Film, 
  ExternalLink,
  Plus,
  Aperture,
  Compass,
  Star,
  HardDriveUpload,
  Info
} from 'lucide-react'
import { getFileFromEntry, getFileExtension } from '../utils/fileSystem'
import { formatBytes, formatDuration } from '../utils/thumbnailGenerator'
import { parseFileExif, calculateAspectRatio } from '../utils/exifParser'
import './FileProperties.css'

// Preset Quick Suggested Tags
const QUICK_SUGGESTED_TAGS = ['즐겨찾기', '풍경', '인물', '여행', '스크린샷', '중요']

export default function FileProperties({ fileEntry, fileMetadata, onClose }) {
  const [fileObj, setFileObj] = useState(null)
  const [copied, setCopied] = useState(false)
  const [objectUrl, setObjectUrl] = useState(null)
  
  // EXIF Metadata State
  const [exifData, setExifData] = useState(null)
  const [isParsingExif, setIsParsingExif] = useState(false)

  // Custom User Tags State (Persisted in localStorage)
  const [userTags, setUserTags] = useState([])
  const [newTagInput, setNewTagInput] = useState('')

  // Safe Storage Key Helper
  const getStorageKey = (entry) => {
    const rawKey = entry.id || entry.path || entry.name
    return 'vt_tags_v2_' + encodeURIComponent(rawKey)
  }

  // Load File & EXIF & Saved User Tags
  useEffect(() => {
    let isMounted = true
    let createdUrl = null

    setExifData(null)
    setUserTags([])

    if (fileEntry) {
      // 1. Load saved user tags from localStorage
      const key = getStorageKey(fileEntry)
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          setUserTags(JSON.parse(saved))
        } catch (e) {
          setUserTags([])
        }
      }

      // 2. Load file & EXIF/Windows Metadata
      getFileFromEntry(fileEntry).then(async (f) => {
        if (isMounted && f) {
          setFileObj(f)
          createdUrl = URL.createObjectURL(f)
          setObjectUrl(createdUrl)

          if (fileEntry.mediaType === 'image') {
            setIsParsingExif(true)
            const parsed = await parseFileExif(f)
            if (isMounted) {
              setExifData(parsed)
              setIsParsingExif(false)
            }
          }
        }
      })
    }

    return () => {
      isMounted = false
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [fileEntry])

  if (!fileEntry) {
    return (
      <div className="properties-panel-container">
        <div className="properties-header">
          <span className="properties-title"><Sliders size={14} /> 파일 속성</span>
          {onClose && <button className="icon-action-btn" onClick={onClose}><X size={14} /></button>}
        </div>
        <div style={{ padding: '24px 16px', color: 'var(--text-dark)', fontSize: '0.85rem', textAlign: 'center' }}>
          선택된 파일이 없습니다.
        </div>
      </div>
    )
  }

  // Add Custom Tag Handler
  const handleAddTag = (tagName) => {
    const trimmed = tagName.trim().replace(/^#/, '')
    if (trimmed && !userTags.includes(trimmed)) {
      const updated = [...userTags, trimmed]
      setUserTags(updated)
      localStorage.setItem(getStorageKey(fileEntry), JSON.stringify(updated))
      setNewTagInput('')
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    handleAddTag(newTagInput)
  }

  // Remove Tag Handler
  const handleRemoveTag = (tagToRemove) => {
    const updated = userTags.filter((t) => t !== tagToRemove)
    setUserTags(updated)
    localStorage.setItem(getStorageKey(fileEntry), JSON.stringify(updated))
  }

  // Copy Filename
  const handleCopyName = () => {
    navigator.clipboard.writeText(fileEntry.name)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ext = getFileExtension(fileEntry.name).toUpperCase()

  // Dimensions & Aspect Ratio & Resolution Tags
  const width = fileMetadata ? (fileMetadata.videoWidth || fileMetadata.naturalWidth) : null
  const height = fileMetadata ? (fileMetadata.videoHeight || fileMetadata.naturalHeight) : null
  const aspectRatio = (width && height) ? calculateAspectRatio(width, height) : null

  // Resolution Auto Tag (4K / FHD / HD)
  let resTag = null
  if (width && height) {
    if (width >= 3840 || height >= 2160) resTag = '4K UHD'
    else if (width >= 1920 || height >= 1080) resTag = 'FHD (1080p)'
    else if (width >= 1280 || height >= 720) resTag = 'HD (720p)'
  }

  // Camera, GPS & Windows Embedded Metadata shorthand
  const camera = exifData ? exifData.camera : null
  const gps = exifData ? exifData.gps : null
  const winTags = (exifData && exifData.fileMetadataTags) ? exifData.fileMetadataTags : []
  const winTitle = exifData && exifData.image ? exifData.image.title : null
  const winRating = exifData && exifData.image ? exifData.image.rating : null

  const hasCameraData = camera && (camera.make || camera.model || camera.fNumber || camera.iso)
  const hasGpsData = gps && gps.latitude && gps.longitude

  return (
    <div className="properties-panel-container">
      {/* Header */}
      <div className="properties-header">
        <span className="properties-title">
          <Sliders size={14} style={{ color: 'var(--accent-primary)' }} />
          파일 속성 (Properties)
        </span>
        {onClose && (
          <button className="icon-action-btn" onClick={onClose} title="속성 창 닫기">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="properties-body">
        {/* Preview Thumbnail Card */}
        <div className="prop-preview-card">
          {objectUrl ? (
            fileEntry.mediaType === 'video' ? (
              <video src={objectUrl} className="prop-preview-img" muted preload="metadata" />
            ) : (
              <img src={objectUrl} alt={fileEntry.name} className="prop-preview-img" />
            )
          ) : (
            <div style={{ color: 'var(--text-dark)' }}>
              {fileEntry.mediaType === 'video' ? <Film size={32} /> : <ImageIcon size={32} />}
            </div>
          )}
        </div>

        {/* 1. Tag Manager Section */}
        <div className="prop-section">
          <div className="prop-section-title">
            <Tag size={13} style={{ color: 'var(--accent-primary)' }} />
            태그 정보 (Tags)
          </div>

          {/* Add Custom Tag Form */}
          <form className="tag-input-row" onSubmit={handleFormSubmit}>
            <input 
              type="text" 
              placeholder="앱 커스텀 태그 추가... (Enter)"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="tag-input"
            />
            <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '4px 10px' }}>
              <Plus size={14} />
              <span>추가</span>
            </button>
          </form>

          {/* Quick Suggested Tag Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dark)' }}>빠른 추천 태그:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {QUICK_SUGGESTED_TAGS.map((sTag) => (
                <button
                  key={sTag}
                  type="button"
                  onClick={() => handleAddTag(sTag)}
                  className="quick-tag-btn"
                  disabled={userTags.includes(sTag)}
                >
                  + #{sTag}
                </button>
              ))}
            </div>
          </div>

          {/* Windows File Embedded Tags (XPKeywords / IPTC / XMP) */}
          {winTags.length > 0 && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HardDriveUpload size={12} />
                Windows 이미지 자체 태그 (XPKeywords):
              </span>
              <div className="prop-tag-list">
                {winTags.map((wt) => (
                  <span key={wt} className="prop-tag-chip win-file-tag" title="윈도우 파일 탐색기 속성에 저장된 태그">
                    #{wt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active Tag Chips List */}
          <div className="prop-tag-list" style={{ marginTop: '8px' }}>
            {/* System Auto Tags */}
            <span className="prop-tag-chip system-tag" title="자동 시스템 태그">
              #{ext}
            </span>
            <span className="prop-tag-chip system-tag" title="미디어 분류 태그">
              #{fileEntry.mediaType === 'video' ? '동영상' : '이미지'}
            </span>
            {resTag && (
              <span className="prop-tag-chip system-tag" title="해상도 규격 태그">
                #{resTag}
              </span>
            )}
            {aspectRatio && (
              <span className="prop-tag-chip system-tag" title="화면비 태그">
                #{aspectRatio}
              </span>
            )}

            {/* Custom User Tags */}
            {userTags.map((t) => (
              <span key={t} className="prop-tag-chip user-tag">
                #{t}
                <button type="button" className="tag-remove-btn" onClick={() => handleRemoveTag(t)} title="태그 삭제">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Windows Explorer Rating & Title (If available) */}
        {(winTitle || (winRating && winRating > 0)) && (
          <div className="prop-section">
            <div className="prop-section-title">
              <Star size={13} style={{ color: 'var(--accent-amber)' }} />
              Windows 설명 & 등급
            </div>
            {winTitle && (
              <div className="prop-item-row">
                <span className="prop-label">제목/설명</span>
                <span className="prop-value">{winTitle}</span>
              </div>
            )}
            {winRating && winRating > 0 && (
              <div className="prop-item-row">
                <span className="prop-label">등급 (Rating)</span>
                <span className="prop-value" style={{ color: 'var(--accent-amber)', display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < winRating ? 'var(--accent-amber)' : 'none'} />
                  ))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 2. Image & Media Spec Info */}
        <div className="prop-section">
          <div className="prop-section-title">
            <ImageIcon size={13} style={{ color: 'var(--accent-cyan)' }} />
            이미지 & 미디어 규격
          </div>

          {width && height && (
            <div className="prop-item-row">
              <span className="prop-label">해상도 (Dimensions)</span>
              <span className="prop-value">{width} × {height} px {aspectRatio ? `(${aspectRatio})` : ''}</span>
            </div>
          )}

          {exifData && exifData.image && exifData.image.colorSpace && (
            <div className="prop-item-row">
              <span className="prop-label">색상 공간 (Color Space)</span>
              <span className="prop-value">{exifData.image.colorSpace}</span>
            </div>
          )}

          {fileMetadata && fileMetadata.duration > 0 && (
            <div className="prop-item-row">
              <span className="prop-label">비디오 총 재생시간</span>
              <span className="prop-value">{formatDuration(fileMetadata.duration)} ({Math.round(fileMetadata.duration)}초)</span>
            </div>
          )}

          {fileObj && (
            <div className="prop-item-row">
              <span className="prop-label">파일 크기</span>
              <span className="prop-value">{formatBytes(fileObj.size)}</span>
            </div>
          )}
        </div>

        {/* 3. Camera EXIF Metadata */}
        <div className="prop-section">
          <div className="prop-section-title">
            <Camera size={13} style={{ color: 'var(--accent-amber)' }} />
            카메라 정보 (EXIF)
          </div>

          {isParsingExif ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>EXIF 메타데이터 파싱 중...</span>
          ) : hasCameraData ? (
            <div className="camera-grid">
              {camera.make && (
                <div className="camera-cell">
                  <span className="camera-cell-label">제조사</span>
                  <span className="camera-cell-val">{camera.make}</span>
                </div>
              )}
              {camera.model && (
                <div className="camera-cell">
                  <span className="camera-cell-label">카메라 모델</span>
                  <span className="camera-cell-val">{camera.model}</span>
                </div>
              )}
              {camera.fNumber && (
                <div className="camera-cell">
                  <span className="camera-cell-label">조리개</span>
                  <span className="camera-cell-val">{camera.fNumber}</span>
                </div>
              )}
              {camera.exposureTime && (
                <div className="camera-cell">
                  <span className="camera-cell-label">셔터 스피드</span>
                  <span className="camera-cell-val">{camera.exposureTime}</span>
                </div>
              )}
              {camera.iso && (
                <div className="camera-cell">
                  <span className="camera-cell-label">ISO 감도</span>
                  <span className="camera-cell-val">{camera.iso}</span>
                </div>
              )}
              {camera.focalLength && (
                <div className="camera-cell">
                  <span className="camera-cell-label">초점 거리</span>
                  <span className="camera-cell-val">{camera.focalLength}</span>
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
              카메라 EXIF 정보가 포함되어 있지 않습니다.
            </span>
          )}
        </div>

        {/* 4. GPS Location Metadata */}
        <div className="prop-section">
          <div className="prop-section-title">
            <MapPin size={13} style={{ color: 'var(--accent-rose)' }} />
            GPS 위치 정보
          </div>

          {hasGpsData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="prop-item-row">
                <span className="prop-label">위도 (Latitude)</span>
                <span className="prop-value">{gps.latitude.toFixed(6)}°</span>
              </div>
              <div className="prop-item-row">
                <span className="prop-label">경도 (Longitude)</span>
                <span className="prop-value">{gps.longitude.toFixed(6)}°</span>
              </div>
              {gps.altitude && (
                <div className="prop-item-row">
                  <span className="prop-label">고도 (Altitude)</span>
                  <span className="prop-value">{gps.altitude}</span>
                </div>
              )}
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="map-link-btn"
              >
                <Compass size={14} />
                Google Maps에서 지도 보기
                <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
              GPS 위치 정보가 포함되어 있지 않습니다.
            </span>
          )}
        </div>

        {/* 5. System File Details */}
        <div className="prop-section">
          <div className="prop-section-title">
            <FileText size={13} style={{ color: 'var(--text-muted)' }} />
            파일 시스템 정보
          </div>

          <div className="prop-item-row">
            <span className="prop-label">파일명</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span className="prop-value" title={fileEntry.name}>{fileEntry.name}</span>
              <button className="icon-action-btn" onClick={handleCopyName} title="파일명 복사">
                {copied ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {fileObj && (
            <div className="prop-item-row">
              <span className="prop-label">마지막 수정일</span>
              <span className="prop-value">{new Date(fileObj.lastModified).toLocaleString()}</span>
            </div>
          )}

          <div className="prop-item-row">
            <span className="prop-label">상대 경로</span>
            <span className="prop-value" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {fileEntry.path || fileEntry.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
