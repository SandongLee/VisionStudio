import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { 
  MapPin, 
  X, 
  RefreshCw, 
  Compass, 
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

  // Create Custom HTML Leaflet DivIcon with compact 32x32 thumbnail marker
  const createThumbnailIcon = (item) => {
    const thumbSrc = item.thumbnailUrl
    const htmlString = `
      <div class="photo-marker-pin" title="${item.fileEntry.name}">
        ${thumbSrc 
          ? `<img src="${thumbSrc}" class="photo-marker-img" alt="${item.fileEntry.name}" />`
          : `<div style="color: white; font-size: 10px;">📷</div>`
        }
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
      {/* Top Floating Overlay Bar */}
      <div className="map-top-bar">
        <div className="map-info-title">
          <MapPin size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Google Maps / 지도 뷰어</span>
          <span className="badge badge-image" style={{ marginLeft: '6px', fontSize: '0.68rem' }}>
            GPS 미디어 ({gpsMediaList.length} / {mediaFiles.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={onClose}
            title="원래 메인 뷰어로 돌아가기"
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={13} />
            <span>뷰어로 돌아가기</span>
          </button>

          <button className="icon-action-btn" onClick={onClose} title="닫기">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="map-empty-overlay">
          <RefreshCw className="spin" size={28} style={{ color: 'var(--accent-cyan)' }} />
          <p style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.85rem', marginTop: '6px' }}>
            폴더 내 파일의 GPS 위치 정보를 파싱하고 있습니다...
          </p>
        </div>
      )}

      {/* Empty State Overlay if no GPS metadata found */}
      {!isLoading && gpsMediaList.length === 0 && (
        <div className="map-empty-overlay">
          <Compass size={36} style={{ color: 'var(--accent-amber)' }} />
          <h4 style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>GPS 위치 데이터 없음</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            현재 폴더의 미디어 파일에 저장된 GPS 위치 정보가 없습니다.
          </p>
          <button className="btn btn-sm btn-primary" onClick={onClose} style={{ marginTop: '6px' }}>
            <ArrowLeft size={13} />
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

        {/* Compact Thumbnail Markers */}
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
                className="map-popup-content"
                onClick={() => onSelectFileAndReturn(item.fileEntry)}
              >
                {item.thumbnailUrl && (
                  <img 
                    src={item.thumbnailUrl} 
                    alt={item.fileEntry.name} 
                    className="map-popup-img"
                  />
                )}
                <p style={{ fontSize: '0.72rem', fontWeight: 600, margin: 0, color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.fileEntry.name}
                </p>
                <span style={{ fontSize: '0.68rem', color: '#818cf8' }}>
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
