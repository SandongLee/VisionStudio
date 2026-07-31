import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { 
  MapPin, 
  X, 
  RefreshCw, 
  Compass, 
  Image as ImageIcon,
  ArrowLeft
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
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
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

  // Scan all files in current folder for GPS data
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const scanFilesForGps = async () => {
      const results = []

      for (const fileEntry of mediaFiles) {
        if (fileEntry.mediaType === 'image') {
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

  // Create Custom HTML Leaflet DivIcon with photo thumbnail preview
  const createThumbnailIcon = (item) => {
    const thumbSrc = item.thumbnailUrl
    const htmlString = `
      <div className="photo-marker-pin" title="${item.fileEntry.name}">
        ${thumbSrc 
          ? `<img src="${thumbSrc}" class="photo-marker-img" alt="${item.fileEntry.name}" />`
          : `<div style="color: white; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">📷</div>`
        }
      </div>
    `
    return L.divIcon({
      html: htmlString,
      className: 'custom-photo-marker-wrapper',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    })
  }

  return (
    <div className="map-view-container">
      {/* Top Floating Overlay Bar */}
      <div className="map-top-bar">
        <div className="map-info-title">
          <MapPin size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span>Google Maps / 지도 뷰어</span>
          <span className="badge badge-image" style={{ marginLeft: '8px' }}>
            GPS 미디어 ({gpsMediaList.length} / {mediaFiles.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={onClose}
            title="원래 메인 뷰어로 돌아가기"
          >
            <ArrowLeft size={14} />
            <span>뷰어로 돌아가기</span>
          </button>

          <button className="icon-action-btn" onClick={onClose} title="닫기">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="map-empty-overlay">
          <RefreshCw className="spin" size={32} style={{ color: 'var(--accent-cyan)' }} />
          <p style={{ color: 'var(--text-main)', fontWeight: 500, marginTop: '8px' }}>
            폴더 내 파일의 GPS 위치 정보를 분석 중입니다...
          </p>
        </div>
      )}

      {/* Empty State Overlay if no GPS metadata found */}
      {!isLoading && gpsMediaList.length === 0 && (
        <div className="map-empty-overlay">
          <Compass size={40} style={{ color: 'var(--accent-amber)' }} />
          <h4 style={{ color: 'var(--text-main)', fontWeight: 600 }}>GPS 위치 데이터 없음</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            현재 폴더의 이미지/동영상 파일에 저장된 GPS 위도/경도 정보가 없습니다.
          </p>
          <button className="btn btn-sm btn-primary" onClick={onClose} style={{ marginTop: '8px' }}>
            <ArrowLeft size={14} />
            메인 뷰어로 돌아가기
          </button>
        </div>
      )}

      {/* Interactive Map Container */}
      <MapContainer 
        center={gpsMediaList.length > 0 ? [gpsMediaList[0].gps.latitude, gpsMediaList[0].gps.longitude] : defaultCenter} 
        zoom={13} 
        className="map-element"
        zoomControl={false}
      >
        {/* Dark CartoDB / OpenStreetMap Map Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {gpsMediaList.length > 0 && <AutoFitBounds markers={gpsMediaList} />}

        {/* Thumbnail Markers */}
        {gpsMediaList.map((item) => (
          <Marker
            key={item.fileEntry.id}
            position={[item.gps.latitude, item.gps.longitude]}
            icon={createThumbnailIcon(item)}
            eventHandlers={{
              click: () => {
                onSelectFileAndReturn(item.fileEntry)
              }
            }}
          >
            <Popup className="map-photo-popup">
              <div 
                style={{ cursor: 'pointer', textAlign: 'center', padding: '4px' }}
                onClick={() => onSelectFileAndReturn(item.fileEntry)}
              >
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.fileEntry.name} 
                  style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                />
                <p style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: '4px', margin: 0 }}>
                  {item.fileEntry.name}
                </p>
                <span style={{ fontSize: '0.7rem', color: '#6366f1' }}>
                  👆 클릭하여 상세 뷰어로 보기
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
