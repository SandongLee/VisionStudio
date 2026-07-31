import React, { useState } from 'react'
import { 
  Search, 
  Image as ImageIcon, 
  Film, 
  Layers, 
  ArrowUpDown,
  Filter,
  MapPin
} from 'lucide-react'
import { 
  getMediaThumbnail, 
  formatBytes, 
  formatDuration 
} from '../utils/thumbnailGenerator'
import { getFileFromEntry } from '../utils/fileSystem'
import './ThumbnailGrid.css'

function ThumbnailCard({ fileEntry, isSelected, onSelect }) {
  const [thumbData, setThumbData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  React.useEffect(() => {
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
      className={`thumb-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(fileEntry, thumbData)}
    >
      <div className="thumb-preview-wrapper">
        {/* Type Badge */}
        <span className={`badge media-type-badge ${fileEntry.mediaType === 'video' ? 'badge-video' : 'badge-image'}`}>
          {fileEntry.mediaType === 'video' ? <Film size={10} /> : <ImageIcon size={10} />}
          {fileEntry.mediaType === 'video' ? 'VIDEO' : 'IMG'}
        </span>

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
  onToggleMapView
}) {
  const [filterType, setFilterType] = useState('all') // 'all' | 'image' | 'video'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name' | 'size' | 'type'

  // Filter logic
  let filteredFiles = mediaFiles.filter((file) => {
    if (filterType === 'image' && file.mediaType !== 'image') return false
    if (filterType === 'video' && file.mediaType !== 'video') return false
    if (searchQuery.trim() !== '') {
      return file.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // Sort logic
  filteredFiles.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, undefined, { numeric: true })
    }
    if (sortBy === 'type') {
      return a.mediaType.localeCompare(b.mediaType)
    }
    return 0
  })

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

        {/* CENTER BUTTON: Google Maps에서 보기 */}
        <button 
          className={`filter-tab ${isMapView ? 'active' : ''}`}
          onClick={onToggleMapView}
          style={{
            background: isMapView ? 'var(--gradient-primary)' : 'rgba(6, 182, 212, 0.15)',
            color: isMapView ? '#ffffff' : 'var(--accent-cyan)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            padding: '5px 14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: isMapView ? 'var(--shadow-glow)' : 'none'
          }}
          title="선택된 폴더 파일의 GPS 위치를 Google Maps 지도 썸네일로 확인"
        >
          <MapPin size={14} />
          <span>Google Maps에서 보기</span>
        </button>

        {/* Search & Sort */}
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

      {/* Grid Content Body */}
      <div className="thumb-scroll-area">
        {filteredFiles.length > 0 ? (
          <div className="thumb-grid">
            {filteredFiles.map((file) => (
              <ThumbnailCard 
                key={file.id} 
                fileEntry={file}
                isSelected={selectedFile && selectedFile.id === file.id}
                onSelect={(f, metadata) => onSelectFile(f, metadata)}
              />
            ))}
          </div>
        ) : (
          <div className="thumb-empty-state">
            <Filter size={32} strokeWidth={1.5} />
            <p>
              {mediaFiles.length === 0 
                ? '이 폴더에는 표시할 이미지나 동영상이 없습니다.' 
                : '검색 필터 조건에 일치하는 파일이 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
