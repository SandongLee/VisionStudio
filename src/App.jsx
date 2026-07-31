import React, { useState } from 'react'
import { Eye, FolderOpen, Image as ImageIcon, Film, SlidersHorizontal } from 'lucide-react'
import './App.css'

function App() {
  const [folderName, setFolderName] = useState(null)
  const [mediaFiles, setMediaFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  
  // Panel resizing states
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [thumbnailHeight, setThumbnailHeight] = useState(220)

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="app-header">
        <div className="app-brand">
          <Eye className="brand-icon" size={24} />
          <span>VisionStudio</span>
        </div>
        <div className="header-info">
          {folderName ? (
            <div className="current-path">
              📁 {folderName} ({mediaFiles.length} 항목)
            </div>
          ) : (
            <span style={{ color: 'var(--text-dark)' }}>선택된 폴더 없음</span>
          )}
        </div>
      </header>

      {/* Main Split Layout Body */}
      <div className="app-body">
        {/* Explorer Sidebar */}
        <aside className="sidebar-panel" style={{ width: sidebarWidth }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>EXPLORER</h3>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              <FolderOpen size={18} />
              폴더 열기
            </button>
          </div>
          <div style={{ padding: '16px', color: 'var(--text-dark)', fontSize: '0.85rem' }}>
            폴더를 선택하면 여기에 트리 구조가 표시됩니다.
          </div>
        </aside>

        {/* Resizer Sidebar/Main */}
        <div className="resizer-v" />

        {/* Main Content Area (Thumbnails Top, Viewer Bottom) */}
        <main className="main-content-panel">
          {/* Thumbnails Section */}
          <section className="thumbnails-section" style={{ height: thumbnailHeight }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>THUMBNAILS</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>{mediaFiles.length} 미디어</span>
            </div>
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dark)', fontSize: '0.9rem' }}>
              폴더를 선택하여 이미지 및 동영상 썸네일을 불러오세요.
            </div>
          </section>

          {/* Resizer Thumbnails/Viewer */}
          <div className="resizer-h" />

          {/* Media Viewer Section */}
          <section className="viewer-section">
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text-dark)' }}>
              <ImageIcon size={48} strokeWidth={1.2} />
              <p style={{ fontSize: '0.95rem' }}>썸네일 목록에서 이미지 또는 동영상을 선택하세요.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
