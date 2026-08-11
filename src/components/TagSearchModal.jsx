import React, { useState } from 'react'
import { Tag, Search, X, Check, Filter, Layers, ListFilter } from 'lucide-react'
import './TagSearchModal.css'

export default function TagSearchModal({ 
  availableTags = [], // Array<{ tag: string, count: number }>
  selectedTags = [], // Array<string>
  tagMatchMode = 'OR', // 'OR' | 'AND'
  onApplyTags, // (tagsArray, mode) => void
  onClose 
}) {
  const [localTags, setLocalTags] = useState([...selectedTags])
  const [localMode, setLocalMode] = useState(tagMatchMode)
  const [filterText, setFilterText] = useState('')
  const [customTagInput, setCustomTagInput] = useState('')

  // Toggle single tag selection
  const handleToggleTag = (tagToToggle) => {
    const trimmed = tagToToggle.trim().replace(/^#/, '')
    if (!trimmed) return

    if (localTags.includes(trimmed)) {
      setLocalTags(localTags.filter((t) => t !== trimmed))
    } else {
      setLocalTags([...localTags, trimmed])
    }
  }

  // Add tag from input
  const handleAddCustomTag = (e) => {
    e.preventDefault()
    if (customTagInput.trim()) {
      handleToggleTag(customTagInput)
      setCustomTagInput('')
    }
  }

  const handleApply = () => {
    onApplyTags(localTags, localMode)
    onClose()
  }

  const handleClearAll = () => {
    setLocalTags([])
    onApplyTags([], 'OR')
    onClose()
  }

  // Filter available tags list by text input
  const filteredAvailableTags = availableTags.filter(({ tag }) => 
    tag.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tag-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} style={{ color: 'var(--accent-cyan)' }} />
            도구: 다중 태그 검색 (Multi-Tag Search)
          </span>
          <button className="icon-action-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          현재 폴더에서 추출된 모든 태그 목록입니다. <strong>여러 태그를 다중 선택</strong>하여 해당 조건에 맞는 미디어 파일만 정렬/조회할 수 있습니다.
        </p>

        {/* Selected Tags Display Bar */}
        {localTags.length > 0 && (
          <div className="selected-tags-bar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} />
                선택된 태그 ({localTags.length}개):
              </span>

              {/* Match Mode Toggle: OR vs AND */}
              <div className="tag-mode-toggle">
                <span>조회 조건:</span>
                <button 
                  type="button"
                  className={`tag-mode-btn ${localMode === 'OR' ? 'active' : ''}`}
                  onClick={() => setLocalMode('OR')}
                  title="선택한 태그 중 하나라도 포함 (OR)"
                >
                  하나 이상 포함 (OR)
                </button>
                <button 
                  type="button"
                  className={`tag-mode-btn ${localMode === 'AND' ? 'active' : ''}`}
                  onClick={() => setLocalMode('AND')}
                  title="선택한 모든 태그를 포함 (AND)"
                >
                  모두 포함 (AND)
                </button>
              </div>
            </div>

            <div className="tag-chips-container" style={{ marginTop: '4px' }}>
              {localTags.map((tag) => (
                <span key={tag} className="modal-tag-chip selected" onClick={() => handleToggleTag(tag)}>
                  #{tag}
                  <X size={11} />
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Custom Tag Add / Filter Row */}
        <form onSubmit={handleAddCustomTag} className="tag-search-input-row">
          <input 
            type="text" 
            placeholder="태그 직접 입력 또는 아래 목록 검색..." 
            value={customTagInput}
            onChange={(e) => {
              setCustomTagInput(e.target.value)
              setFilterText(e.target.value)
            }}
            className="tag-search-input"
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 12px' }}>
            <Tag size={14} />
            <span>태그 추가</span>
          </button>
        </form>

        {/* Folder Available Tags Section */}
        <div className="folder-tags-container">
          <div className="folder-tags-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ListFilter size={13} style={{ color: 'var(--accent-amber)' }} />
              현재 폴더에서 발견된 태그 목록 ({filteredAvailableTags.length}개)
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
              태그를 클릭하여 다중 선택
            </span>
          </div>

          <div className="tag-chips-grid">
            {filteredAvailableTags.length > 0 ? (
              filteredAvailableTags.map(({ tag, count }) => {
                const isSelected = localTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`modal-tag-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleTag(tag)}
                  >
                    #{tag}
                    <span className="tag-count-badge">{count}</span>
                  </button>
                )
              })
            ) : (
              <div style={{ padding: '16px', color: 'var(--text-dark)', fontSize: '0.8rem', textAlign: 'center', width: '100%' }}>
                발견된 태그가 없습니다. 상단에서 직접 태그를 입력해 추가해 보세요.
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          {selectedTags.length > 0 || localTags.length > 0 ? (
            <button className="btn btn-sm" onClick={handleClearAll} style={{ color: 'var(--accent-rose)' }}>
              <X size={14} />
              태그 전체 선택 해제
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm" onClick={onClose}>
              취소
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleApply}>
              <Check size={14} />
              <span>적용하기 ({localTags.length}개 태그)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
