import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { 
  MapPin, 
  X, 
  RefreshCw, 
  Compass, 
  ArrowLeft,
  Film,
  Image as ImageIcon
} from 'lucide-react'
import { getFileFromEntry } from '../utils/fileSystem'
import { parseFileExif } from '../utils/exifParser'
import { getMediaThumbnail } from '../utils/thumbnailGenerator'
import './MapView.css'

// Helper component to auto fit map bounds to all markers
function AutoFitBounds({ markers }) {
  const map = useMap()

  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.gps.latitude, m.gps.longitude]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    }
  }, [markers, map])

  return null
}

export default function MapView({ 
  mediaFiles = [], 
  onSelectFileAndReturn, 
  onClose 
}) {
  const [gpsMediaList, setGpsMediaList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Scan ALL media files (Images AND Videos) in current folder for GPS data
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const scanFilesForGps = async () => {
      const results = []

      for (const fileEntry of mediaFiles) {
        // Cross-Module verification: Scan BOTH images AND videos for GPS metadata
        if (fileEntry.mediaType === 'image' || fileEntry.mediaType === 'video') {
          try {
            const fObj = await getFileFromEntry(fileEntry)
            if (fObj) {
              const exif = await parseFileExif(fObj)
              if (exif && exif.gps && exif.gps.latitude && exif.gps.longitude) {
                const thumb = await getMediaThumbnail(fileEntry, getFileFromEntry)
                results.push({
                  fileEntry,
                  gps: exif.gps,
                  thumbnailUrl: thumb.thumbnailUrl
                })
              }
            }
          } catch (err) {
            console.warn('GPS extraction error for:', fileEntry.name, err)
          }
        }
      }

      if (isMounted) {
        setGpsMediaList(results)
        setIsLoading(false)
      }
    }

    scanFilesForGps()

    return () => {
      isMounted = false
    }
  }, [mediaFiles])

  // Default Center (Seoul / Default World view)
  const defaultCenter = [37.5665, 126.9780]

  // Create Custom HTML Leaflet DivIcon with compact 32x32 thumbnail marker
  const createThumbnailIcon = (item) => {
    const thumbSrc = item.thumbnailUrl
    const isVideo = item.fileEntry.mediaType === 'video'
    const htmlString = `
      <div class="photo-marker-pin ${isVideo ? 'video-marker-pin' : ''}" title="${item.fileEntry.name}">
        ${thumbSrc 
          ? `<img src="${thumbSrc}" class="photo-marker-img" alt="${item.fileEntry.name}" />`
          : `<div style="color: white; font-size: 10px;">${isVideo ? '🎬' : '📷'}</div>`
        }
        ${isVideo ? `<div style="position: absolute; bottom: 1px; right: 1px; background: rgba(0,0,0,0.7); color: #06b6d4; font-size: 8px; border-radius: 2px; padding: 0 2px;">▶</div>` : ''}
      </div>
    `
    return L.divIcon({
      html: htmlString,
      className: 'custom-photo-marker-wrapper',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
  }

  return (
    <div className="map-view-container">
      {/* Map View Header Toolbar */}
      <div className="map-header-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-sm btn-primary" onClick={onClose} style={{ gap: '4px' }}>
            <ArrowLeft size={14} />
            <span>뷰어로 돌아가기</span>
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={16} style={{ color: 'var(--accent-cyan)' }} />
            Google Maps 위치 지도 (GPS 마커: {gpsMediaList.length}개 위치 발견)
          </span>
        </div>

        <button className="icon-action-btn" onClick={onClose} title="지도 닫기">
          <X size={16} />
        </button>
      </div>

      {/* Map Content Body */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        {isLoading && (
          <div className="map-loading-overlay">
            <RefreshCw size={24} className="spin-icon" style={{ color: 'var(--accent-cyan)' }} />
            <span>폴더 내 사진 및 동영상 GPS 위치 탐색 중...</span>
          </div>
        )}

        <MapContainer 
          center={gpsMediaList.length > 0 ? [gpsMediaList[0].gps.latitude, gpsMediaList[0].gps.longitude] : defaultCenter} 
          zoom={gpsMediaList.length > 0 ? 12 : 3} 
          style={{ width: '100%', height: '100%', background: '#0b0f19' }}
          scrollWheelZoom={true}
        >
          {/* Dark Theme CartoDB Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Auto Fit Map Viewport to all markers */}
          <AutoFitBounds markers={gpsMediaList} />

          {/* Render Photo & Video Thumbnail Markers */}
          {gpsMediaList.map((item, idx) => (
            <Marker 
              key={`${item.fileEntry.id}_${idx}`}
              position={[item.gps.latitude, item.gps.longitude]}
              icon={createThumbnailIcon(item)}
            >
              <Popup className="photo-marker-popup" offset={[0, -10]}>
                <div 
                  className="popup-card-content"
                  onClick={() => onSelectFileAndReturn(item.fileEntry)}
                  title="클릭하여 메인 뷰어에서 원본 감상하기"
                >
                  <div className="popup-thumb-wrapper">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.fileEntry.name} className="popup-thumb-img" />
                    ) : (
                      <div style={{ color: 'var(--text-dark)' }}>
                        {item.fileEntry.mediaType === 'video' ? <Film size={24} /> : <ImageIcon size={24} />}
                      </div>
                    )}
                  </div>
                  <div className="popup-info">
                    <span className="popup-filename">{item.fileEntry.name}</span>
                    <span className="popup-gps-coords">
                      📍 {item.gps.latitude.toFixed(4)}°, {item.gps.longitude.toFixed(4)}°
                    </span>
                    <button className="btn btn-sm btn-primary popup-return-btn">
                      <span>원본 뷰어로 열기</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Empty State Banner if no GPS data found */}
        {!isLoading && gpsMediaList.length === 0 && (
          <div className="map-empty-banner">
            <MapPin size={24} style={{ color: 'var(--accent-rose)', marginBottom: '4px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>GPS 위치 정보가 있는 미디어가 없습니다.</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              현재 폴더의 사진 및 동영상 헤더에 위도/경도(GPS) 데이터가 저장되어 있는지 확인하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
