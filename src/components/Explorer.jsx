import React, { useState, useRef } from 'react'
import { 
  FolderOpen, 
  Folder, 
  FolderExpanded, 
  ChevronRight, 
  ChevronDown, 
  FolderTree, 
  RefreshCw,
  Layers,
  UploadCloud
} from 'lucide-react'
import { 
  openDirectoryPicker, 
  scanDirectoryHandle, 
  buildTreeFromWebkitFileList 
} from '../utils/fileSystem'
import './Explorer.css'

function TreeNodeItem({ node, activeFolderId, onSelectFolder, level = 0 }) {
  const [isOpen, setIsOpen] = useState(level === 0)
  const hasChildren = node.children && node.children.length > 0
  const isActive = activeFolderId === node.id

  const handleToggle = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleClick = (e) => {
    e.stopPropagation()
    onSelectFolder(node)
  }

  return (
    <div className="tree-node-wrapper">
      <div 
        className={`tree-node-row ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${8 + level * 14}px` }}
        onClick={handleClick}
      >
        <span 
          className="toggle-icon" 
          onClick={hasChildren ? handleToggle : undefined}
          style={{ opacity: hasChildren ? 1 : 0.2 }}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        
        <Folder className="folder-icon" size={16} />
        <span className="folder-name" title={node.name}>{node.name}</span>
        
        {node.mediaCount > 0 && (
          <span className="file-count-badge">{node.mediaCount}</span>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="tree-node-children">
          {node.children.map((child) => (
            <TreeNodeItem 
              key={child.id} 
              node={child} 
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Explorer({ 
  treeData, 
  setTreeData, 
  activeFolder, 
  setActiveFolder,
  isLoading,
  setIsLoading
}) {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Open directory via File System Access API
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
      console.warn('File System Access API unsupported or cancelled, falling back to file input:', err)
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback webkitdirectory file input handler
  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setIsLoading(true)
      const rootNode = buildTreeFromWebkitFileList(files)
      setTreeData(rootNode)
      setActiveFolder(rootNode)
      setIsLoading(false)
    }
  }

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      setIsLoading(true)
      const rootNode = buildTreeFromWebkitFileList(files)
      if (rootNode) {
        setTreeData(rootNode)
        setActiveFolder(rootNode)
      }
      setIsLoading(false)
    }
  }

  return (
    <div 
      className={`explorer-container ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        webkitdirectory="true"
        directory="true"
        multiple
        style={{ display: 'none' }}
      />

      <div className="explorer-header">
        <div className="explorer-title-row">
          <span className="explorer-title">Folder Explorer</span>
          {treeData && (
            <div className="explorer-actions">
              <button 
                className="icon-action-btn" 
                title="다시 읽기"
                onClick={handleOpenFolder}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleOpenFolder}
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          {isLoading ? (
            <RefreshCw className="spin" size={16} />
          ) : (
            <FolderOpen size={16} />
          )}
          <span>{treeData ? '폴더 변경' : '로컬 폴더 선택'}</span>
        </button>
      </div>

      <div className="explorer-tree-body">
        {treeData ? (
          <TreeNodeItem 
            node={treeData} 
            activeFolderId={activeFolder ? activeFolder.id : null}
            onSelectFolder={(folder) => setActiveFolder(folder)}
          />
        ) : (
          <div className="explorer-empty">
            <div className={`drop-zone-border ${isDragOver ? 'drag-over' : ''}`}>
              <UploadCloud size={32} style={{ color: 'var(--accent-primary)', marginBottom: '8px' }} />
              <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                폴더 선택 또는 드롭
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                로컬 이미지/동영상 폴더를 탐색합니다
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
