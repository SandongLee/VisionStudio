import React, { useState, useEffect } from 'react'
import { 
  Sliders, 
  X, 
  Copy, 
  Check, 
  FileText, 
  HardDrive, 
  Calendar, 
  Maximize2, 
  Film, 
  Image as ImageIcon 
} from 'lucide-react'
import { getFileFromEntry, getFileExtension } from '../utils/fileSystem'
import { formatBytes, formatDuration } from '../utils/thumbnailGenerator'
import './FileProperties.css'

export default function FileProperties({ fileEntry, fileMetadata, onClose }) {
  const [fileObj, setFileObj] = useState(null)
  const [copied, setCopied] = useState(false)
  const [objectUrl, setObjectUrl] = useState(null)

  useEffect(() => {
    let isMounted = true
    let createdUrl = null

    if (fileEntry) {
      getFileFromEntry(fileEntry).then((f) => {
        if (isMounted && f) {
          setFileObj(f)
          createdUrl = URL.createObjectURL(f)
          setObjectUrl(createdUrl)
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

  const handleCopyName = () => {
    navigator.clipboard.writeText(fileEntry.name)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ext = getFileExtension(fileEntry.name).toUpperCase()

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

        {/* Section 1: Basic Metadata */}
        <div className="prop-section">
          <div className="prop-section-title">기본 정보</div>

          <div className="prop-item-row">
            <span className="prop-label">파일명</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
              <span className="prop-value" title={fileEntry.name}>{fileEntry.name}</span>
              <button className="icon-action-btn" onClick={handleCopyName} title="파일명 복사">
                {copied ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          <div className="prop-item-row">
            <span className="prop-label">미디어 유형</span>
            <span className="prop-value">
              <span className={`badge ${fileEntry.mediaType === 'video' ? 'badge-video' : 'badge-image'}`}>
                {fileEntry.mediaType === 'video' ? '동영상 (VIDEO)' : '이미지 (IMAGE)'}
              </span>
            </span>
          </div>

          <div className="prop-item-row">
            <span className="prop-label">파일 확장자</span>
            <span className="prop-value">.{ext}</span>
          </div>

          <div className="prop-item-row">
            <span className="prop-label">파일 크기</span>
            <span className="prop-value">
              {fileObj ? formatBytes(fileObj.size) : '계산 중...'}
            </span>
          </div>
        </div>

        {/* Section 2: Media Specs */}
        <div className="prop-section">
          <div className="prop-section-title">미디어 규격</div>

          {fileMetadata && fileMetadata.videoWidth && fileMetadata.videoHeight && (
            <div className="prop-item-row">
              <span className="prop-label">해상도 (Dimensions)</span>
              <span className="prop-value">{fileMetadata.videoWidth} × {fileMetadata.videoHeight} px</span>
            </div>
          )}

          {fileMetadata && fileMetadata.duration > 0 && (
            <div className="prop-item-row">
              <span className="prop-label">총 재생 시간</span>
              <span className="prop-value">{formatDuration(fileMetadata.duration)} ({Math.round(fileMetadata.duration)}초)</span>
            </div>
          )}

          {fileObj && (
            <div className="prop-item-row">
              <span className="prop-label">MIME 타입</span>
              <span className="prop-value">{fileObj.type || `media/${ext.toLowerCase()}`}</span>
            </div>
          )}
        </div>

        {/* Section 3: System & Path */}
        <div className="prop-section">
          <div className="prop-section-title">시스템 정보</div>

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

        {/* Quick Tags */}
        <div className="prop-section">
          <div className="prop-section-title">태그 & 속성</div>
          <div className="prop-tag-list">
            <span className="prop-tag">#{ext}</span>
            <span className="prop-tag">#{fileEntry.mediaType}</span>
            {fileObj && <span className="prop-tag">#{formatBytes(fileObj.size)}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
