import React, { useState, useEffect, useRef } from 'react'
import { 
  FolderOpen, 
  RefreshCw, 
  Maximize, 
  Sidebar, 
  Grid, 
  Info, 
  HelpCircle, 
  X,
  Eye,
  Camera,
  RotateCcw,
  Sliders,
  Check,
  Tag
} from 'lucide-react'
import './MenuBar.css'

export default function MenuBar({
  onOpenFolder,
  onToggleSidebar,
  showSidebar,
  onToggleThumbnails,
  showThumbnails,
  onToggleProperties,
  showProperties,
  onToggleFullscreen,
  onOpenTagSearch
}) {
  const [activeMenu, setActiveMenu] = useState(null) // 'file' | 'view' | 'tools' | 'help'
  const [activeModal, setActiveModal] = useState(null) // 'shortcuts' | 'about'

  const menubarRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menubarRef.current && !menubarRef.current.contains(e.target)) {
        setActiveMenu(null)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const toggleMenu = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName)
  }

  return (
    <nav className="menubar-container" ref={menubarRef}>
      {/* File Menu */}
      <div className="menu-item-wrapper">
        <button 
          className={`menu-btn ${activeMenu === 'file' ? 'active' : ''}`}
          onClick={() => toggleMenu('file')}
        >
          파일 (F)
        </button>
        {activeMenu === 'file' && (
          <div className="menu-dropdown">
            <button className="dropdown-item" onClick={() => { onOpenFolder(); setActiveMenu(null); }}>
              <span className="dropdown-item-left"><FolderOpen size={14} /> 로컬 폴더 열기...</span>
              <span className="shortcut-text">Ctrl+O</span>
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={() => { window.location.reload(); }}>
              <span className="dropdown-item-left"><RefreshCw size={14} /> 앱 새로고침</span>
              <span className="shortcut-text">F5</span>
            </button>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="menu-item-wrapper">
        <button 
          className={`menu-btn ${activeMenu === 'view' ? 'active' : ''}`}
          onClick={() => toggleMenu('view')}
        >
          보기 (V)
        </button>
        {activeMenu === 'view' && (
          <div className="menu-dropdown">
            <button className="dropdown-item" onClick={() => { onToggleSidebar(); setActiveMenu(null); }}>
              <span className="dropdown-item-left">
                <Sidebar size={14} /> 탐색기 사이드바
              </span>
              {showSidebar && <Check size={14} style={{ color: 'var(--accent-cyan)' }} />}
            </button>
            <button className="dropdown-item" onClick={() => { onToggleThumbnails(); setActiveMenu(null); }}>
              <span className="dropdown-item-left">
                <Grid size={14} /> 썸네일 그리드
              </span>
              {showThumbnails && <Check size={14} style={{ color: 'var(--accent-cyan)' }} />}
            </button>
            <button className="dropdown-item" onClick={() => { onToggleProperties(); setActiveMenu(null); }}>
              <span className="dropdown-item-left">
                <Sliders size={14} /> 파일 속성 패널
              </span>
              {showProperties && <Check size={14} style={{ color: 'var(--accent-cyan)' }} />}
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={() => { onToggleFullscreen(); setActiveMenu(null); }}>
              <span className="dropdown-item-left"><Maximize size={14} /> 전체 화면</span>
              <span className="shortcut-text">F</span>
            </button>
          </div>
        )}
      </div>

      {/* Tools Menu */}
      <div className="menu-item-wrapper">
        <button 
          className={`menu-btn ${activeMenu === 'tools' ? 'active' : ''}`}
          onClick={() => toggleMenu('tools')}
        >
          도구 (T)
        </button>
        {activeMenu === 'tools' && (
          <div className="menu-dropdown">
            <button className="dropdown-item" onClick={() => { onOpenTagSearch(); setActiveMenu(null); }}>
              <span className="dropdown-item-left"><Tag size={14} style={{ color: 'var(--accent-cyan)' }} /> 태그 검색...</span>
              <span className="shortcut-text">Ctrl+T</span>
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item" onClick={() => { setActiveModal('shortcuts'); setActiveMenu(null); }}>
              <span className="dropdown-item-left"><HelpCircle size={14} /> 단축키 목록</span>
            </button>
          </div>
        )}
      </div>

      {/* Help Menu */}
      <div className="menu-item-wrapper">
        <button 
          className={`menu-btn ${activeMenu === 'help' ? 'active' : ''}`}
          onClick={() => toggleMenu('help')}
        >
          도움말 (H)
        </button>
        {activeMenu === 'help' && (
          <div className="menu-dropdown">
            <button className="dropdown-item" onClick={() => { setActiveModal('about'); setActiveMenu(null); }}>
              <span className="dropdown-item-left"><Info size={14} /> VisionStudio 정보</span>
            </button>
          </div>
        )}
      </div>

      {/* Shortcuts Modal */}
      {activeModal === 'shortcuts' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⌨️ 단축키 안내</span>
              <button className="icon-action-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div>
              <div className="shortcut-row"><span>이전 미디어 파일</span><span className="shortcut-text">← (Left Arrow)</span></div>
              <div className="shortcut-row"><span>다음 미디어 파일</span><span className="shortcut-text">→ (Right Arrow)</span></div>
              <div className="shortcut-row"><span>태그 검색</span><span className="shortcut-text">Ctrl + T</span></div>
              <div className="shortcut-row"><span>전체 화면 토글</span><span className="shortcut-text">F</span></div>
              <div className="shortcut-row"><span>이미지 확대 / 축소</span><span className="shortcut-text">마우스 휠 Scroll</span></div>
              <div className="shortcut-row"><span>이미지 이동</span><span className="shortcut-text">마우스 드래그</span></div>
              <div className="shortcut-row"><span>이미지 100% 뷰 토글</span><span className="shortcut-text">마우스 더블 클릭</span></div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {activeModal === 'about' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">VisionStudio Pro</span>
              <button className="icon-action-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <p><strong>VisionStudio</strong>는 웹 브라우저 기반의 고성능 로컬 이미지 및 동영상 뷰어 애플리케이션입니다.</p>
              <br />
              <p>• File System Access API를 활용한 로컬 폴더 직접 탐색</p>
              <p>• 하위 폴더 재귀적 자동 미디어 통합 조회</p>
              <p>• 대용량 파일 점진적 스트리밍 렌더링 & 태그 검색/정렬</p>
              <p>• 동영상 프레임 자동 캡처 & 캔버스 썸네일 시스템</p>
              <p>• 비디오 프레임 단위 이동 및 스냅샷 다운로드</p>
              <p>• 이미지 Zoom/Pan/Rotation 및 실시간 파일 속성 분석</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
