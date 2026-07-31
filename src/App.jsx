import React, { useState, useEffect, useRef } from 'react'
import { 
  Eye, 
  FolderOpen, 
  Image as ImageIcon, 
  Film, 
  Maximize2, 
  Minimize2,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Sparkles
} from 'lucide-react'
import Explorer from './components/Explorer'
import ThumbnailGrid from './components/ThumbnailGrid'
import ImageViewer from './components/ImageViewer'
import VideoViewer from './components/VideoViewer'
import './App.css'

export default function App() {
  const [treeData, setTreeData] = useState(null)
  const [activeFolder, setActiveFolder] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileMetadata, setFileMetadata] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Resizable Panel dimensions
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [thumbnailHeight, setThumbnailHeight] = useState(240)
  const isDraggingSidebar = useRef(false)
  const isDraggingThumbnails = useRef(false)

  const viewerContainerRef = useRef(null)

  // Active folder's media files list
  const activeMediaFiles = activeFolder ? activeFolder.mediaFiles || [] : []

  // Auto select first file when active folder changes if no file is selected
  useEffect(() => {
    if (activeFolder && activeFolder.mediaFiles && activeFolder.mediaFiles.length > 0) {
      setSelectedFile(activeFolder.mediaFiles[0])
    } else {
      setSelectedFile(null)
    }
  }, [activeFolder])

  // Mouse Drag Resizing handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSidebar.current) {
        setSidebarWidth(Math.min(Math.max(e.clientX, 180), 500))
      }
      if (isDraggingThumbnails.current) {
        // Offset by header (52px)
        const newH = e.clientY - 52
        setThumbnailHeight(Math.min(Math.max(newH, 100), 500))
      }
    }

    const handleMouseUp = () => {
      isDraggingSidebar.current = false
      isDraggingThumbnails.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Keyboard Shortcuts Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (!activeMediaFiles || activeMediaFiles.length === 0) return

      const currentIndex = activeMediaFiles.findIndex((f) => selectedFile && f.id === selectedFile.id)

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prevIndex = (currentIndex - 1 + activeMediaFiles.length) % activeMediaFiles.length
        setSelectedFile(activeMediaFiles[prevIndex])
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % activeMediaFiles.length
        setSelectedFile(activeMediaFiles[nextIndex])
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeMediaFiles, selectedFile])

  // Toggle Fullscreen View
  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error)
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error)
    }
  }

  // File Select Handler
  const handleSelectFile = (file, metadata) => {
    setSelectedFile(file)
    setFileMetadata(metadata)
  }

  // Previous / Next file navigation
  const currentFileIndex = activeMediaFiles.findIndex((f) => selectedFile && f.id === selectedFile.id)
  const hasPrev = currentFileIndex > 0
  const hasNext = currentFileIndex >= 0 && currentFileIndex < activeMediaFiles.length - 1

  const navigateFile = (dir) => {
    if (currentFileIndex === -1) return
    const newIdx = currentFileIndex + dir
    if (newIdx >= 0 && newIdx < activeMediaFiles.length) {
      setSelectedFile(activeMediaFiles[newIdx])
    }
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="app-brand">
          <Eye className="brand-icon" size={22} />
          <span>VisionStudio</span>
          <span className="badge badge-image" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>
            <Sparkles size={10} /> Pro
          </span>
        </div>

        <div className="header-info">
          {activeFolder ? (
            <div className="current-path" title={activeFolder.path}>
              📁 {activeFolder.path} ({activeMediaFiles.length} 항목)
            </div>
          ) : (
            <span style={{ color: 'var(--text-dark)', fontSize: '0.85rem' }}>
              로컬 폴더를 열어서 미디어를 감상하세요
            </span>
          )}
        </div>
      </header>

      {/* Main App Body */}
      <div className="app-body">
        {/* Explorer Sidebar */}
        <aside className="sidebar-panel" style={{ width: sidebarWidth }}>
          <Explorer 
            treeData={treeData}
            setTreeData={setTreeData}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </aside>

        {/* Resizer Sidebar / Main */}
        <div 
          className="resizer-v"
          onMouseDown={() => { isDraggingSidebar.current = true }}
        />

        {/* Main Content Area */}
        <main className="main-content-panel">
          {/* Top: Thumbnail Strip / Grid Section */}
          <section className="thumbnails-section" style={{ height: thumbnailHeight }}>
            <ThumbnailGrid 
              mediaFiles={activeMediaFiles}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
            />
          </section>

          {/* Resizer Thumbnails / Viewer */}
          <div 
            className="resizer-h"
            onMouseDown={() => { isDraggingThumbnails.current = true }}
          />

          {/* Bottom: Main Media Viewer Section */}
          <section className="viewer-section" ref={viewerContainerRef}>
            {selectedFile ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {/* Top Overlay Controls (File Name & Navigation) */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(15, 20, 30, 0.75)',
                  backdropFilter: 'blur(12px)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <button 
                    className="icon-action-btn" 
                    disabled={!hasPrev} 
                    onClick={() => navigateFile(-1)}
                    title="이전 미디어 (←)"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </span>

                  <button 
                    className="icon-action-btn" 
                    disabled={!hasNext} 
                    onClick={() => navigateFile(1)}
                    title="다음 미디어 (→)"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Fullscreen Button Top Right */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                  <button 
                    className="icon-action-btn" 
                    onClick={toggleFullscreen} 
                    title="전체 화면 (F)"
                    style={{ background: 'rgba(15, 20, 30, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)' }}
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>

                {/* Render Viewer based on Media Type */}
                {selectedFile.mediaType === 'image' ? (
                  <ImageViewer fileEntry={selectedFile} fileMetadata={fileMetadata} />
                ) : (
                  <VideoViewer fileEntry={selectedFile} />
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '12px',
                color: 'var(--text-dark)'
              }}>
                <HardDrive size={48} strokeWidth={1.2} style={{ color: 'var(--accent-primary)', opacity: 0.6 }} />
                <h4 style={{ color: 'var(--text-muted)', fontWeight: 500 }}>미디어 뷰어</h4>
                <p style={{ fontSize: '0.85rem' }}>
                  좌측에서 폴더를 선택하고 상단 썸네일에서 이미지 또는 동영상을 클릭하세요.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
