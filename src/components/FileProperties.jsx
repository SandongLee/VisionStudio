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
  Compass
} from 'lucide-react'
import { getFileFromEntry, getFileExtension } from '../utils/fileSystem'
import { formatBytes, formatDuration } from '../utils/thumbnailGenerator'
import { parseFileExif, calculateAspectRatio } from '../utils/exifParser'
import './FileProperties.css'

export default function FileProperties({ fileEntry, fileMetadata, onClose }) {
  const [fileObj, setFileObj] = useState(null)
  const [copied, setCopied] = useState(false)
  const [objectUrl, setObjectUrl] = useState(null)
  
  // EXIF Metadata State
  const [exifData, setExifData] = useState(null)
  const [isParsingExif, setIsParsingExif] = useState(false)

  // Custom User Tags State (Persisted in localStorage)
  const [tags, setTags] = useState([])
  const [newTagInput, setNewTagInput] = useState('')

  // Load File & Parse EXIF & Load Saved Tags
  useEffect(() => {
    let isMounted = true
    let createdUrl = null

    setExifData(null)
    setTags([])

    if (fileEntry) {
      // Load saved tags from localStorage
      const savedTags = localStorage.getItem(`tags_${fileEntry.id}`)
      if (savedTags) {
        try {
          setTags(JSON.parse(savedTags))
        } catch (e) {
          setTags([])
        }
      }

      getFileFromEntry(fileEntry).then(async (f) => {
        if (isMounted && f) {
          setFileObj(f)
          createdUrl = URL.createObjectURL(f)
          setObjectUrl(createdUrl)

          // Parse EXIF if image
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

  // Add Tag Handler
  const handleAddTag = (e) => {
    e.preventDefault()
    const trimmed = newTagInput.trim().replace(/^#/, '')
    if (trimmed && !tags.includes(trimmed)) {
      const updated = [...tags, trimmed]
      setTags(updated)
      localStorage.setItem(`tags_${fileEntry.id}`, JSON.stringify(updated))
      setNewTagInput('')
    }
  }

  // Remove Tag Handler
  const handleRemoveTag = (tagToRemove) => {
    const updated = tags.filter((t) => t !== tagToRemove)
    setTags(updated)
    localStorage.setItem(`tags_${fileEntry.id}`, JSON.stringify(updated))
  }

  // Copy Filename
  const handleCopyName = () => {
    navigator.clipboard.writeText(fileEntry.name)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ext = getFileExtension(fileEntry.name).toUpperCase()

  // Dimensions & Aspect Ratio
  const width = fileMetadata ? (fileMetadata.videoWidth || fileMetadata.naturalWidth) : null
  const height = fileMetadata ? (fileMetadata.videoHeight || fileMetadata.naturalHeight) : null
  const aspectRatio = (width && height) ? calculateAspectRatio(width, height) : null

  // Camera & GPS Data shorthand
  const camera = exifData ? exifData.camera : null
  const gps = exifData ? exifData.gps : null
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

        {/* 1. Custom User Tags Manager */}
        <div className="prop-section">
          <div className="prop-section-title">
            <Tag size={13} style={{ color: 'var(--accent-primary)' }} />
            사용자 태그 (User Tags)
          </div>

          <form className="tag-input-row" onSubmit={handleAddTag}>
            <input 
              type="text" 
              placeholder="새 태그 입력... (Enter)"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="tag-input"
            />
            <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '4px 8px' }}>
              <Plus size={14} />
            </button>
          </form>

          <div className="prop-tag-list">
            <span className="prop-tag-chip" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
              #{ext}
            </span>
            <span className="prop-tag-chip" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
              #{fileEntry.mediaType}
            </span>

            {tags.map((t) => (
              <span key={t} className="prop-tag-chip">
                #{t}
                <button type="button" className="tag-remove-btn" onClick={() => handleRemoveTag(t)}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>

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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>EXIF 파싱 중...</span>
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
