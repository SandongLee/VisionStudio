import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  PictureInPicture2, 
  Maximize, 
  Info,
  SlidersHorizontal
} from 'lucide-react'
import { getFileFromEntry } from '../utils/fileSystem'
import { formatBytes, formatDuration } from '../utils/thumbnailGenerator'
import './VideoViewer.css'

export default function VideoViewer({ fileEntry }) {
  const videoRef = useRef(null)
  const [videoUrl, setVideoUrl] = useState(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  
  // Load video file ObjectURL
  useEffect(() => {
    let isMounted = true
    let createdUrl = null

    setIsPlaying(false)
    setCurrentTime(0)

    getFileFromEntry(fileEntry).then((file) => {
      if (isMounted && file) {
        createdUrl = URL.createObjectURL(file)
        setVideoUrl(createdUrl)
      }
    })

    return () => {
      isMounted = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [fileEntry])

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Handle Seek Slider
  const handleSeek = (e) => {
    const targetSec = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = targetSec
      setCurrentTime(targetSec)
    }
  }

  // Skip Seconds
  const skipSeconds = (secs) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        Math.max(videoRef.current.currentTime + secs, 0),
        duration
      )
    }
  }

  // Frame Step (0.04s ≈ 1 frame at 25fps)
  const stepFrame = (deltaSec) => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
      videoRef.current.currentTime = Math.min(
        Math.max(videoRef.current.currentTime + deltaSec, 0),
        duration
      )
    }
  }

  // Change Volume
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val
      setIsMuted(val === 0)
    }
  }

  // Mute Toggle
  const toggleMute = () => {
    if (!videoRef.current) return
    const newMuted = !isMuted
    setIsMuted(newMuted)
    videoRef.current.muted = newMuted
  }

  // Playback Speed Change
  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value)
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  // Capture Current Frame Snapshot
  const captureSnapshot = () => {
    const video = videoRef.current
    if (!video) return

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1920
      canvas.height = video.videoHeight || 1080
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const cleanName = fileEntry.name.replace(/\.[^/.]+$/, '')
        a.download = `snapshot_${cleanName}_${Math.floor(currentTime)}s.jpg`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.95)
    } catch (err) {
      console.error('Failed to capture snapshot:', err)
    }
  }

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (e) {
      console.warn('PiP error:', e)
    }
  }

  return (
    <div className="video-viewer-container">
      <div className="video-element-wrapper" onClick={togglePlay}>
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="main-video"
            onTimeUpdate={() => setCurrentTime(videoRef.current ? videoRef.current.currentTime : 0)}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration)
                videoRef.current.volume = volume
                videoRef.current.playbackRate = playbackSpeed
              }
            }}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        <div className="big-play-overlay" onClick={togglePlay}>
          {isPlaying ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
        </div>
      </div>

      {/* Control Bar */}
      <div className="video-control-bar">
        {/* Timeline Slider */}
        <div className="timeline-slider-wrapper">
          <input 
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="timeline-progress-input"
            style={{
              background: `linear-gradient(to right, var(--accent-primary) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.15) ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
        </div>

        <div className="controls-row">
          {/* Left Controls */}
          <div className="controls-group">
            <button className="icon-action-btn" title={isPlaying ? '일시정지' : '재생'} onClick={togglePlay}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button className="icon-action-btn" title="10초 뒤로" onClick={() => skipSeconds(-10)}>
              <RotateCcw size={16} />
            </button>

            <button className="icon-action-btn" title="10초 앞으로" onClick={() => skipSeconds(10)}>
              <RotateCw size={16} />
            </button>

            <div className="toolbar-divider" />

            {/* Frame Step Controls */}
            <button className="icon-action-btn" title="이전 프레임 (-0.04s)" onClick={() => stepFrame(-0.04)}>
              <ChevronLeft size={18} />
            </button>

            <button className="icon-action-btn" title="다음 프레임 (+0.04s)" onClick={() => stepFrame(0.04)}>
              <ChevronRight size={18} />
            </button>

            {/* Time Indicator */}
            <span className="time-display">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="controls-group">
            {/* Speed Selector */}
            <select 
              value={playbackSpeed}
              onChange={handleSpeedChange}
              className="speed-select"
              title="재생 속도"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1.0}>1.0x (보통)</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2.0x</option>
            </select>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button className="icon-action-btn" title={isMuted ? '음소거 해제' : '음소거'} onClick={toggleMute}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input 
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <div className="toolbar-divider" />

            {/* Snapshot */}
            <button className="icon-action-btn" title="현재 프레임 스냅샷 저장" onClick={captureSnapshot}>
              <Camera size={18} />
            </button>

            {/* PiP */}
            <button className="icon-action-btn" title="Picture-in-Picture Mode" onClick={togglePiP}>
              <PictureInPicture2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
