import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Image as ImageIcon, 
  Film, 
  Layers, 
  ArrowUpDown,
  Filter,
  MapPin,
  Tag,
  FolderTree,
  X,
  Check
} from 'lucide-react'
import { 
  getMediaThumbnail, 
  formatBytes, 
  formatDuration 
} from '../utils/thumbnailGenerator'
import { getFileFromEntry } from '../utils/fileSystem'
import './ThumbnailGrid.css'

function ThumbnailCard({ fileEntry, isSelected, onSelect, isTagMatched }) {
  const [thumbData, setThumbData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    getMediaThumbnail(fileEntry, getFileFromEntry).then((data) => {
      if (isMounted) {
        setThumbData(data)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [fileEntry])

  return (
    <div 
      className={`thumb-card ${isSelected ? 'selected' : ''} ${isTagMatched ? 'tag-matched' : ''}`}
      onClick={() => onSelect(fileEntry, thumbData)}
    >
      <div className="thumb-preview-wrapper">
        {/* Type Badge */}
        <span className={`badge media-type-badge ${fileEntry.mediaType === 'video' ? 'badge-video' : 'badge-image'}`}>
          {fileEntry.mediaType === 'video' ? <Film size={10} /> : <ImageIcon size={10} />}
          {fileEntry.mediaType === 'video' ? 'VIDEO' : 'IMG'}
        </span>

        {/* Subfolder Path Tag */}
        {fileEntry.parentPath && (
          <span className="subfolder-path-tag" title={fileEntry.parentPath}>
            {fileEntry.parentPath.split('/').pop()}
          </span>
        )}

        {/* Video Duration Badge */}
        {fileEntry.mediaType === 'video' && thumbData && thumbData.duration > 0 && (
          <span className="video-duration-tag">
            {formatDuration(thumbData.duration)}
          </span>
        )}

        {/* Thumbnail image or Skeleton */}
        {isLoading ? (
          <div className="thumb-skeleton" />
        ) : thumbData && thumbData.thumbnailUrl ? (
          <img 
            src={thumbData.thumbnailUrl} 
            alt={fileEntry.name} 
            className="thumb-img" 
            loading="lazy" 
          />
        ) : (
          <div style={{ color: 'var(--text-dark)' }}>
            {fileEntry.mediaType === 'video' ? <Film size={24} /> : <ImageIcon size={24} />}
          </div>
        )}
      </div>

      <div className="thumb-card-info">
        <span className="thumb-filename" title={fileEntry.name}>{fileEntry.name}</span>
        <span className="thumb-meta">
          {thumbData && thumbData.size ? formatBytes(thumbData.size) : 'Media file'}
        </span>
      </div>
    </div>
  )
}

export default function ThumbnailGrid({ 
  mediaFiles = [], 
  selectedFile, 
  onSelectFile,
  isMapView,
  onToggleMapView,
  includeSubfolders,
  onToggleIncludeSubfolders,
  selectedTags = [],
  tagMatchMode = 'OR',
  fileTagMap = new Map(),
  onRemoveTag,
  onClearAllTags,
  onToggleMatchMode,
  onOpenTagModal
}) {
  const [filterType, setFilterType] = useState('all') // 'all' | 'image' | 'video'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name' | 'type'
  const [renderLimit, setRenderLimit] = useState(40)

  const scrollAreaRef = useRef(null)

  useEffect(() => {
    setRenderLimit(40)
  }, [mediaFiles, filterType, searchQuery, selectedTags, tagMatchMode, includeSubfolders])

  // Filter Files Logic
  let filteredFiles = mediaFiles.filter((file) => {
    if (filterType === 'image' && file.mediaType !== 'image') return false
    if (filterType === 'video' && file.mediaType !== 'video') return false
    if (searchQuery.trim() !== '') {
      return file.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // Multi-Tag Matching & Sorting
  let tagMatchedSet = new Set()
  if (selectedTags && selectedTags.length > 0) {
    filteredFiles.forEach((file) => {
      const fileTags = fileTagMap.get(file.id) || new Set()
      
      let isMatch = false
      if (tagMatchMode === 'AND') {
        isMatch = selectedTags.every((t) => fileTags.has(t) || file.name.toLowerCase().includes(t.toLowerCase()))
      } else {
        isMatch = selectedTags.some((t) => fileTags.has(t) || file.name.toLowerCase().includes(t.toLowerCase()))
      }

      if (isMatch) {
        tagMatchedSet.add(file.id)
      }
    })

    // Sort tag matched files to the top!
    filteredFiles.sort((a, b) => {
      const aMatched = tagMatchedSet.has(a.id)
      const bMatched = tagMatchedSet.has(b.id)
      if (aMatched && !bMatched) return -1
      if (!aMatched && bMatched) return 1
      return a.name.localeCompare(b.name, undefined, { numeric: true })
    })
  } else {
    filteredFiles.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, undefined, { numeric: true })
      }
      if (sortBy === 'type') {
        return a.mediaType.localeCompare(b.mediaType)
      }
      return 0
    })
  }

  // Progressive scroll load
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop - clientHeight < 300) {
      if (renderLimit < filteredFiles.length) {
        setRenderLimit((prev) => Math.min(prev + 40, filteredFiles.length))
      }
    }
  }

  const visibleFiles = filteredFiles.slice(0, renderLimit)

  return (
    <div className="thumbnail-grid-container">
      {/* Toolbar Header */}
      <div className="thumb-toolbar">
        {/* Filter Tabs */}
        <div className="thumb-filter-group">
          <button 
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <Layers size={12} />
            전체 ({mediaFiles.length})
          </button>
          <button 
            className={`filter-tab ${filterType === 'image' ? 'active' : ''}`}
            onClick={() => setFilterType('image')}
          >
            <ImageIcon size={12} />
            이미지 ({mediaFiles.filter(f => f.mediaType === 'image').length})
          </button>
          <button 
            className={`filter-tab ${filterType === 'video' ? 'active' : ''}`}
            onClick={() => setFilterType('video')}
          >
            <Film size={12} />
            동영상 ({mediaFiles.filter(f => f.mediaType === 'video').length})
          </button>
        </div>

        {/* CENTER BUTTONS: Subfolder toggle, Tag Search & Map View */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className={`filter-tab ${includeSubfolders ? 'active' : ''}`}
            onClick={onToggleIncludeSubfolders}
            title="상위 폴더 선택 시 모든 하위 폴더 미디어 포함 여부 토글"
            style={{
              background: includeSubfolders ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderColor: includeSubfolders ? 'var(--accent-primary)' : 'var(--border-color)',
              color: includeSubfolders ? '#a5b4fc' : 'var(--text-muted)'
            }}
          >
            <FolderTree size={13} />
            <span>하위 폴더 자동 포함</span>
          </button>

          <button 
            className={`filter-tab ${selectedTags.length > 0 ? 'active' : ''}`}
            onClick={onOpenTagModal}
            style={{
              background: selectedTags.length > 0 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: selectedTags.length > 0 ? '#a5b4fc' : 'var(--text-main)',
              border: selectedTags.length > 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              fontWeight: 600
            }}
          >
            <Tag size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span>태그 선택 검색 {selectedTags.length > 0 ? `(${selectedTags.length})` : ''}</span>
          </button>

          <button 
            className={`filter-tab ${isMapView ? 'active' : ''}`}
            onClick={onToggleMapView}
            style={{
              background: isMapView ? 'var(--gradient-primary)' : 'rgba(6, 182, 212, 0.15)',
              color: isMapView ? '#ffffff' : 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              padding: '4px 10px',
              fontWeight: 600
            }}
          >
            <MapPin size={13} />
            <span>Google Maps에서 보기</span>
          </button>
        </div>

        {/* Right Search & Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="thumb-search-box">
            <Search className="search-icon" size={13} />
            <input 
              type="text" 
              placeholder="파일 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={12} style={{ color: 'var(--text-dark)' }} />
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">이름순</option>
              <option value="type">종류순</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Multi-Tag Filter Banner */}
      {selectedTags.length > 0 && (
        <div className="tag-search-banner">
          <div className="tag-banner-text" style={{ flexWrap: 'wrap' }}>
            <Tag size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span>다중 태그 필터링 중:</span>

            {selectedTags.map((tag) => (
              <span key={tag} className="tag-banner-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                #{tag}
                <X size={10} style={{ cursor: 'pointer' }} onClick={() => onRemoveTag(tag)} />
              </span>
            ))}

            <button 
              type="button"
              className="tag-mode-btn active"
              onClick={onToggleMatchMode}
              style={{ fontSize: '0.68rem', padding: '1px 6px', marginLeft: '4px' }}
            >
              조건: {tagMatchMode === 'OR' ? '하나 이상 (OR)' : '모두 포함 (AND)'}
            </button>

            <span style={{ color: 'var(--text-dark)', marginLeft: '4px' }}>
              ({tagMatchedSet.size}개 파일 매칭됨)
            </span>
          </div>

          <button className="icon-action-btn" onClick={onClearAllTags} title="태그 전체 선택 해제">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Grid Content Body */}
      <div className="thumb-scroll-area" ref={scrollAreaRef} onScroll={handleScroll}>
        {filteredFiles.length > 0 ? (
          <div className="thumb-grid">
            {visibleFiles.map((file) => (
              <ThumbnailCard 
                key={file.id} 
                fileEntry={file}
                isSelected={selectedFile && selectedFile.id === file.id}
                onSelect={(f, metadata) => onSelectFile(f, metadata)}
                isTagMatched={tagMatchedSet.has(file.id)}
              />
            ))}

            {renderLimit < filteredFiles.length && (
              <div className="load-more-sentinel">
                스크롤하여 {filteredFiles.length - renderLimit}개 미디어 추가 로딩...
              </div>
            )}
          </div>
        ) : (
          <div className="thumb-empty-state">
            <Filter size={32} strokeWidth={1.5} />
            <p>
              {mediaFiles.length === 0 
                ? '이 폴더에는 표시할 이미지나 동영상이 없습니다.' 
                : '검색 필터 및 선택한 태그 조건에 일치하는 파일이 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
