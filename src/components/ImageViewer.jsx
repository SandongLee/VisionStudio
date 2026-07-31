import React, { useState, useEffect, useRef } from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Maximize, 
  Info, 
  RefreshCw,
  X
} from 'lucide-react'
import { getFileFromEntry } from '../utils/fileSystem'
import { formatBytes } from '../utils/thumbnailGenerator'
import './ImageViewer.css'

export default function ImageViewer({ fileEntry, fileMetadata }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const [showMeta, setShowMeta] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [fileDetails, setFileDetails] = useState(null)

  const viewportRef = useRef(null)

  // Load image object URL
  useEffect(() => {
    let isMounted = true
    let createdUrl = null

    // Reset view transformation
    setScale(1)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setPosition({ x: 0, y: 0 })

    getFileFromEntry(fileEntry).then((file) => {
      if (isMounted && file) {
        createdUrl = URL.createObjectURL(file)
        setImageUrl(createdUrl)
        setFileDetails({
          size: file.size,
          type: file.type || fileEntry.mediaType,
          lastModified: new Date(file.lastModified).toLocaleString()
        })
      }
    })

    return () => {
      isMounted = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [fileEntry])

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    setScale((prevScale) => Math.min(Math.max(prevScale * zoomFactor, 0.2), 10))
  }

  // Drag Pan start
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  // Dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  // Drag Pan end
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Double Click Zoom Toggle
  const handleDoubleClick = () => {
    if (scale !== 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  // Reset Transform
  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div className="image-viewer-container">
      {/* Viewport Canvas */}
      <div 
        ref={viewportRef}
        className="image-viewport"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={fileEntry.name} 
            className="main-image"
            onLoad={(e) => {
              setNaturalSize({
                width: e.target.naturalWidth,
                height: e.target.naturalHeight
              })
            }}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Floating Toolbar */}
      <div className="viewer-floating-bar">
        <button 
          className="icon-action-btn" 
          title="축소" 
          onClick={() => setScale((s) => Math.max(s * 0.8, 0.2))}
        >
          <ZoomOut size={18} />
        </button>

        <span className="zoom-indicator">{Math.round(scale * 100)}%</span>

        <button 
          className="icon-action-btn" 
          title="확대" 
          onClick={() => setScale((s) => Math.min(s * 1.25, 10))}
        >
          <ZoomIn size={18} />
        </button>

        <button 
          className="icon-action-btn" 
          title="초기화" 
          onClick={handleReset}
        >
          <RefreshCw size={16} />
        </button>

        <div className="toolbar-divider" />

        <button 
          className="icon-action-btn" 
          title="반시계 90도 회전" 
          onClick={() => setRotation((r) => r - 90)}
        >
          <RotateCcw size={18} />
        </button>

        <button 
          className="icon-action-btn" 
          title="시계 90도 회전" 
          onClick={() => setRotation((r) => r + 90)}
        >
          <RotateCw size={18} />
        </button>

        <button 
          className={`icon-action-btn ${flipH ? 'active' : ''}`} 
          title="좌우 반전" 
          onClick={() => setFlipH(!flipH)}
        >
          <FlipHorizontal size={18} />
        </button>

        <button 
          className={`icon-action-btn ${flipV ? 'active' : ''}`} 
          title="상하 반전" 
          onClick={() => setFlipV(!flipV)}
        >
          <FlipVertical size={18} />
        </button>

        <div className="toolbar-divider" />

        <button 
          className={`icon-action-btn ${showMeta ? 'active' : ''}`} 
          title="파일 정보" 
          onClick={() => setShowMeta(!showMeta)}
        >
          <Info size={18} />
        </button>
      </div>

      {/* Info Popover */}
      {showMeta && (
        <div className="meta-info-panel">
          <div className="meta-header">
            <span>이미지 정보</span>
            <button 
              className="icon-action-btn" 
              onClick={() => setShowMeta(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="meta-row">
            <span className="meta-label">파일명:</span>
            <span className="meta-value" title={fileEntry.name}>{fileEntry.name}</span>
          </div>

          <div className="meta-row">
            <span className="meta-label">해상도:</span>
            <span className="meta-value">
              {naturalSize.width > 0 ? `${naturalSize.width} × ${naturalSize.height} px` : '불러오는 중...'}
            </span>
          </div>

          {fileDetails && (
            <>
              <div className="meta-row">
                <span className="meta-label">파일 크기:</span>
                <span className="meta-value">{formatBytes(fileDetails.size)}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">수정일시:</span>
                <span className="meta-value">{fileDetails.lastModified}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
