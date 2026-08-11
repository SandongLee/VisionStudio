import React, { useState } from 'react'
import { Tag, Search, X, Check, Filter } from 'lucide-react'
import './TagSearchModal.css'

export default function TagSearchModal({ 
  activeTagQuery = '', 
  onApplyTagQuery, 
  onClose 
}) {
  const [inputTag, setInputTag] = useState(activeTagQuery)

  // Popular preset tag suggestions
  const presetTags = ['강릉', '경포', '아이슬란드', '오로라', '즐겨찾기', '풍경', '인물', '여행', '4K', 'JPG', '동영상']

  const handleSubmit = (e) => {
    e.preventDefault()
    onApplyTagQuery(inputTag.trim())
    onClose()
  }

  const handleSelectPreset = (tag) => {
    const trimmed = tag.replace(/^#/, '')
    onApplyTagQuery(trimmed)
    onClose()
  }

  const handleClear = () => {
    setInputTag('')
    onApplyTagQuery('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tag-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} style={{ color: 'var(--accent-primary)' }} />
            도구: 태그 검색 (Search by Tags)
          </span>
          <button className="icon-action-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          선택된 폴더 내 이미지/동영상 중 입력한 태그가 포함된 파일만 필터링하여 상단에 정렬(Sorting)합니다.
        </p>

        {/* Tag Input Form */}
        <form onSubmit={handleSubmit} className="tag-search-input-row">
          <input 
            type="text" 
            placeholder="태그 입력 (예: 강릉, 여행, 4K, JPG...)" 
            value={inputTag}
            onChange={(e) => setInputTag(e.target.value)}
            className="tag-search-input"
            autoFocus
          />
          <button type="submit" className="btn btn-primary">
            <Search size={16} />
            <span>검색</span>
          </button>
        </form>

        {/* Popular Preset Suggestions */}
        <div className="suggested-tags-group">
          <span className="suggested-tags-title">추천 태그 키워드</span>
          <div className="tag-chips-container">
            {presetTags.map((tag) => (
              <button 
                key={tag}
                type="button"
                className={`modal-tag-chip ${activeTagQuery === tag ? 'active' : ''}`}
                onClick={() => handleSelectPreset(tag)}
              >
                <Tag size={12} />
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          {activeTagQuery ? (
            <button className="btn btn-sm" onClick={handleClear} style={{ color: 'var(--accent-rose)' }}>
              <X size={14} />
              태그 검색 해제
            </button>
          ) : <div />}

          <button className="btn btn-sm" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
