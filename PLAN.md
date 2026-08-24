# Web Image & Video Viewer - Step-by-Step Development Plan

이 문서는 웹 기반 이미지 및 동영상 Viewer 개발 프로젝트의 단계별 가이드 및 상태 기록 문서입니다.
세션이 중단되더라도 `PLAN.md`를 확인하여 이전 작업을 이어 진행할 수 있습니다.

---

## 📌 Phase 1: 프로젝트 기초 구성 & 디자인 시스템 (Project Setup & Design System)
- [x] **Step 1.1**: Vite + React 기반 프로젝트 초기화 및 `package.json` 세팅 (`lucide-react` 등 dependencies 설치)
- [x] **Step 1.2**: Vanilla CSS 기반 프리미엄 다크 테마 및 Layout CSS 변수, CSS Reset 구축 (`src/styles/global.css`)
- [x] **Step 1.3**: 프로젝트 기본 폴더 구조 정리 및 메인 App Shell 스켈레톤 구현
- [x] **Git Commit**: `feat: initialize Vite React project with design system shell`

---

## 📌 Phase 2: Explorer & File System Access API 구현 (Local Directory Integration)
- [x] **Step 2.1**: File System Access API (`showDirectoryPicker`) 모듈 및 fallback (`webkitdirectory`) 구현 (`src/utils/fileSystem.js`)
- [x] **Step 2.2**: 탐색기 사이드바 컴포넌트 (`Explorer.jsx`) 구축 - 로컬 폴더 선택, 재귀적 폴더/파일 트리 렌더링
- [x] **Step 2.3**: Explorer에서 폴더/파일 클릭 시 현재 선택 항목(Active item / Active folder) 전역 상태 연동
- [x] **Git Commit**: `feat: implement file explorer and directory picker integration`

---

## 📌 Phase 3: 썸네일 그리드 & 캐싱 시스템 (Thumbnail Grid & Caching)
- [x] **Step 3.1**: 이미지 & 비디오 썸네일 자동 생성 및 Caching 유틸리티 (`src/utils/thumbnailGenerator.js`) 구현
- [x] **Step 3.2**: 썸네일 그리드 컴포넌트 (`ThumbnailGrid.jsx`) 구현 (이미지/동영상 구분 뱃지, 비디오 재생시간 표기)
- [x] **Step 3.3**: 썸네일 영역 검색어 필터링, 확장자 필터(전체/이미지/동영상), 정렬 기능 추가
- [x] **Git Commit**: `feat: implement thumbnail grid generator with filters and caching`

---

## 📌 Phase 4: 이미지 뷰어 구현 (Advanced Image Viewer)
- [x] **Step 4.1**: 이미지 뷰어 컴포넌트 (`ImageViewer.jsx`) 구축 - 캔버스/SVG/IMG 기반 줌(Zoom In/Out), 팬(Pan/Drag)
- [x] **Step 4.2**: 90도 회전, 상하/좌우 반전, 핏 화면 / 원본 100% 뷰 조작 컨트롤러 구축
- [x] **Step 4.3**: 이미지 정보 패널 (파일명, 해상도, 용량, EXIF/마지막 수정일) 팝오버 기능 추가
- [x] **Git Commit**: `feat: implement interactive image viewer with zoom, pan, rotation`

---

## 📌 Phase 5: 비디오 뷰어 구현 (Custom Video Viewer with Frame Step & Snapshot)
- [x] **Step 5.1**: 비디오 뷰어 컴포넌트 (`VideoViewer.jsx`) 구축 - HTML5 커스텀 컨트롤러 (재생/일시정지, 타임바, 볼륨, 재생시간)
- [x] **Step 5.2**: 고급 기능 구현 - 재생 속도(0.25x~2.0x), 10초 이동, 프레임 단위 Step (0.05초 이동)
- [x] **Step 5.3**: 비디오 현재 프레임 스냅샷 캡처(다운로드) 및 PiP 모드 지원
- [x] **Git Commit**: `feat: implement video viewer with playback speed, frame step, snapshot`

---

## 📌 Phase 6: 메인 뷰어 통합 & UI Polish & Keyboard Shortcuts
- [x] **Step 6.1**: Split Pane (사이드바 - 썸네일 - 메인 뷰어) 리사이즈 핸들 조절 기능 구현
- [x] **Step 6.2**: 키보드 단축키 지원 (← / → 이전/다음 미디어, Space 재생/일시정지, F/Esc 전체화면)
- [x] **Step 6.3**: 비어 있는 상태(Empty State), 로딩 스피너, 에러 처리 UI 세부 다듬기
- [x] **Git Commit**: `feat: complete app integration with shortcuts, split layout, and polish`

---

## 📌 Phase 7: 파일 속성 패널 & 상단 메뉴바 구현 (Properties Panel & Menu Bar)
- [x] **Step 7.1**: 상단 메뉴바 컴포넌트 (`MenuBar.jsx`) 구축 ([파일], [보기], [도구], [도움말] 드롭다운 및 단축키 안내 modal)
- [x] **Step 7.2**: 하단 Viewer 영역 우측 분할 속성 패널 컴포넌트 (`FileProperties.jsx`) 구현 (파일명, 경로, 용량, 해상도/길이, MIME 타입, 수정일, 비주얼 태그 등 상세 정보)
- [x] **Step 7.3**: 메인 App 통합 및 속성 패널 토글/리사이즈 지원
- [x] **Git Commit**: `feat: implement top menu bar and right file properties side panel`

---

## 📌 Phase 8: 속성창 EXIF 파싱 (카메라/GPS/이미지 메타데이터) & 사용자 태그 관리
- [x] **Step 8.1**: `exifr` 파서 기반 이미지 EXIF 메타데이터 extraction 유틸리티 (`src/utils/exifParser.js`) 구현
- [x] **Step 8.2**: `FileProperties.jsx` 컴포넌트 확장 (카메라 정보, GPS 위치, XPKeywords 윈도우 태그, 커스텀 태그 관리자)
- [x] **Git Commit**: `feat: add EXIF camera, GPS data parsing and custom tag manager to file properties panel`

---

## 📌 Phase 9: Google Maps 지도 뷰어 (`MapView.jsx`) & 썸네일 마커 클릭 복귀 연동
- [x] **Step 9.1**: 썸네일 툴바 중앙에 `🗺️ Google Maps에서 보기` 버튼 추가 (`ThumbnailGrid.jsx`)
- [x] **Step 9.2**: 인터랙티브 지도 뷰어 컴포넌트 (`MapView.jsx`) 구축 (GPS 위치 스캔 & 32x32 썸네일 마커 연동, 클릭 시 복귀)
- [x] **Git Commit**: `feat: implement interactive map view with thumbnail markers and return-on-click navigation`

---

## 📌 Phase 10: GitHub Repository 동기화 & 자동 웹 서비스 배포 (GitHub Pages CI/CD)
- [x] **Step 10.1**: Vite `base: './'` 설정 및 `.github/workflows/deploy.yml` CI/CD 파일 추가
- [x] **Step 10.2**: GitHub Remote URL 연결 (`https://github.com/sandonglee/VisionStudio.git`) 및 Push 가이드 작성
- [x] **Git Commit**: `ci: add GitHub Actions workflow and base path for automated GitHub Pages deployment`

---

## 📌 Phase 11: 하위 폴더 자동 통합 조회 (Automatic Subfolder Media Inclusion)
- [x] **Step 11.1**: `fileSystem.js`에 폴더 선택 시 하위 폴더의 모든 미디어 파일들을 재귀적으로 모으는 `collectAllMediaFiles(node)` 함수 구현
- [x] **Step 11.2**: Explorer 및 App 전역 상태에서 상위 폴더 선택 시 하위 폴더 미디어 포함 토글 옵션 및 자동 통합 선택 처리
- [x] **Git Commit**: `feat: add recursive subfolder media file inclusion for selected folders`

---

## 📌 Phase 12: 대용량 파일 점진적 스트리밍 렌더링 (Progressive / Chunked Loading for Fast UI)
- [x] **Step 12.1**: `ThumbnailGrid.jsx` 및 `thumbnailGenerator.js`에 Chunked Batch rendering 및 IntersectionObserver 기반 Lazy Loading 적용
- [x] **Step 12.2**: 탐색 스캔 중 발견된 로딩 완료 파일부터 썸네일 그리드에 즉시 실시간 노출 (Progressive Streaming Display)
- [x] **Git Commit**: `feat: implement progressive streaming thumbnail loading for large file sets`

---

## 📌 Phase 13: '도구' 메뉴 '태그 검색' 기능 & 선택 폴더 내 태그 필터링/정렬 (Search & Filter by Tags)
- [x] **Step 13.1**: `MenuBar.jsx` '도구 (Tools)' 메뉴에 `🏷️ 태그 검색 (Search Tags)` 항목 및 태그 검색 전역 대화상자 추가 (`TagSearchModal.jsx`)
- [x] **Step 13.2**: 선택한 태그(사용자 태그, EXIF XPKeywords, 자동 시스템 태그)를 기준으로 선택 폴더 내 미디어 파일 필터링 & 우선 정렬(Sorting) 구현
- [x] **Git Commit**: `feat: implement tag search and filter in tools menu`

---

## 📌 Phase 14: 상단 오른쪽 현재 버전 표시 (v1.0.1) & Git Push 버전 자동 업그레이드
- [x] **Step 14.1**: `package.json` 버전을 `1.0.1`로 변경 및 `MenuBar.jsx` 우측 상단 `v1.0.1` 뱃지 표기
- [x] **Step 14.2**: `package.json`에 `"bump": "npm version patch"` 자동 버전 업그레이드 스크립트 추가
- [x] **Git Commit**: `bump: update app version to v1.0.1 with top menubar version badge`

---

## 📌 Future Enhancements (향후 기능 확장 가능 목록)
- [ ] 슬라이드쇼 (Slideshow) 자동 넘김 모드
- [ ] 태그 지정 및 즐겨찾기 (Bookmarking / Tagging) 기능 (IndexedDB 연동)
- [ ] 미디어 비교 뷰어 (Split Screen 2개 미디어 비교)
- [ ] 오디오 파일 지원 확장 (.mp3, .wav, .flac 등)
