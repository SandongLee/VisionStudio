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
  Sparkles,
  Sliders
} from 'lucide-react'
import MenuBar from './components/MenuBar'
import Explorer from './components/Explorer'
import ThumbnailGrid from './components/ThumbnailGrid'
import ImageViewer from './components/ImageViewer'
import VideoViewer from './components/VideoViewer'
import FileProperties from './components/FileProperties'
import MapView from './components/MapView'
import TagSearchModal from './components/TagSearchModal'
import { openDirectoryPicker, scanDirectoryHandle, collectAllMediaFiles } from './utils/fileSystem'
import './App.css'

export default function App() {
  const [treeData, setTreeData] = useState(null)
  const [activeFolder, setActiveFolder] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileMetadata, setFileMetadata] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Requirement 1: Automatic subfolder media file inclusion toggle (default: true)
  const [includeSubfolders, setIncludeSubfolders] = useState(true)

  // Requirement 3: Tag Search Query
  const [activeTagQuery, setActiveTagQuery] = useState('')
  const [showTagSearchModal, setShowTagSearchModal] = useState(false)

  // View mode state (Normal Viewer vs Google Maps View)
  const [isMapView, setIsMapView] = useState(false)

  // Visibility States for Panels
  const [showSidebar, setShowSidebar] = useState(true)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [showProperties, setShowProperties] = useState(true)

  // Resizable Panel dimensions
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [thumbnailHeight, setThumbnailHeight] = useState(220)
  const [propertiesWidth, setPropertiesWidth] = useState(280)

  const isDraggingSidebar = useRef(false)
  const isDraggingThumbnails = useRef(false)
  const isDraggingProperties = useRef(false)

  const viewerContainerRef = useRef(null)

  // Calculate active media files list (Recursively including subfolders if enabled)
  const activeMediaFiles = activeFolder ? collectAllMediaFiles(activeFolder, includeSubfolders) : []

  // Auto select first file when active folder changes if no file is selected
  useEffect(() => {
    if (activeMediaFiles && activeMediaFiles.length > 0) {
      // Keep selected file if still in active list, otherwise set to first file
      if (!selectedFile || !activeMediaFiles.some((f) => f.id === selectedFile.id)) {
        setSelectedFile(activeMediaFiles[0])
      }
    } else {
      setSelectedFile(null)
    }
  }, [activeFolder, includeSubfolders])

  // Open Folder Action
  const handleOpenFolder = async () => {
    try {
      setIsLoading(true)
      const dirHandle = await openDirectoryPicker()
      if (!dirHandle) {
        setIsLoading(false)
        return
      }
      const rootNode = await scanDirectoryHandle(dirHandle)
      setTreeData(rootNode)
      setActiveFolder(rootNode)
    } catch (err) {
      console.warn('Failed to open directory:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Mouse Drag Resizing handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSidebar.current) {
        setSidebarWidth(Math.min(Math.max(e.clientX, 160), 480))
      }
      if (isDraggingThumbnails.current) {
        const newH = e.clientY - 88
        setThumbnailHeight(Math.min(Math.max(newH, 100), 450))
      }
      if (isDraggingProperties.current) {
        const newW = window.innerWidth - e.clientX
        setPropertiesWidth(Math.min(Math.max(newW, 200), 450))
      }
    }

    const handleMouseUp = () => {
      isDraggingSidebar.current = false
      isDraggingThumbnails.current = false
      isDraggingProperties.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Keyboard Shortcuts Navigation & Ctrl+T Tag Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return

      if (e.ctrlKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault()
        setShowTagSearchModal(true)
        return
      }

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
    if (isMapView) {
      setIsMapView(false)
    }
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
      {/* Top MenuBar */}
      <MenuBar 
        onOpenFolder={handleOpenFolder}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showSidebar={showSidebar}
        onToggleThumbnails={() => setShowThumbnails(!showThumbnails)}
        showThumbnails={showThumbnails}
        onToggleProperties={() => setShowProperties(!showProperties)}
        showProperties={showProperties}
        onToggleFullscreen={toggleFullscreen}
        onOpenTagSearch={() => setShowTagSearchModal(true)}
      />

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
              📁 {activeFolder.path} ({activeMediaFiles.length} 항목 {includeSubfolders ? '[하위폴더 포함]' : ''})
            </div>
          ) : (
            <span style={{ color: 'var(--text-dark)', fontSize: '0.85rem' }}>
              상단 메뉴 [파일] → [로컬 폴더 열기]로 시작하세요
            </span>
          )}
        </div>
      </header>

      {/* Main App Body */}
      <div className="app-body">
        {/* Explorer Sidebar */}
        {showSidebar && (
          <>
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
            <div 
              className="resizer-v"
              onMouseDown={() => { isDraggingSidebar.current = true }}
            />
          </>
        )}

        {/* Main Content Area */}
        <main className="main-content-panel">
          {/* Top: Thumbnail Strip / Grid Section */}
          {showThumbnails && (
            <>
              <section className="thumbnails-section" style={{ height: thumbnailHeight }}>
                <ThumbnailGrid 
                  mediaFiles={activeMediaFiles}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                  isMapView={isMapView}
                  onToggleMapView={() => setIsMapView(!isMapView)}
                  includeSubfolders={includeSubfolders}
                  onToggleIncludeSubfolders={() => setIncludeSubfolders(!includeSubfolders)}
                  activeTagQuery={activeTagQuery}
                  onClearTagQuery={() => setActiveTagQuery('')}
                />
              </section>
              <div 
                className="resizer-h"
                onMouseDown={() => { isDraggingThumbnails.current = true }}
              />
            </>
          )}

          {/* Bottom: Split Media Viewer (Left) + File Properties (Right) */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* Left Viewer Section / Map View */}
            <section className="viewer-section" ref={viewerContainerRef} style={{ flex: 1 }}>
              {isMapView ? (
                <MapView 
                  mediaFiles={activeMediaFiles}
                  onSelectFileAndReturn={(file) => {
                    setSelectedFile(file)
                    setIsMapView(false)
                  }}
                  onClose={() => setIsMapView(false)}
                />
              ) : selectedFile ? (
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

                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

                  {/* Top Right Action Buttons */}
                  <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', gap: '6px' }}>
                    <button 
                      className={`icon-action-btn ${showProperties ? 'active' : ''}`} 
                      onClick={() => setShowProperties(!showProperties)} 
                      title="파일 속성 패널 토글"
                      style={{ background: 'rgba(15, 20, 30, 0.75)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)' }}
                    >
                      <Sliders size={18} />
                    </button>

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
                    폴더를 선택하고 상단 썸네일에서 미디어를 선택하세요.
                  </p>
                </div>
              )}
            </section>

            {/* Resizer Viewer / Properties */}
            {showProperties && (
              <>
                <div 
                  className="resizer-v"
                  onMouseDown={() => { isDraggingProperties.current = true }}
                />
                {/* Right Properties Section */}
                <FileProperties 
                  fileEntry={selectedFile}
                  fileMetadata={fileMetadata}
                  onClose={() => setShowProperties(false)}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Requirement 3: Tag Search Modal */}
      {showTagSearchModal && (
        <TagSearchModal 
          activeTagQuery={activeTagQuery}
          onApplyTagQuery={(tag) => setActiveTagQuery(tag)}
          onClose={() => setShowTagSearchModal(false)}
        />
      )}
    </div>
  )
}
