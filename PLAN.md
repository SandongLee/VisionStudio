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
- [ ] **Step 2.1**: File System Access API (`showDirectoryPicker`) 모듈 및 fallback (`webkitdirectory`) 구현 (`src/utils/fileSystem.js`)
- [ ] **Step 2.2**: 탐색기 사이드바 컴포넌트 (`Explorer.jsx`) 구축 - 로컬 폴더 선택, 재귀적 폴더/파일 트리 렌더링
- [ ] **Step 2.3**: Explorer에서 폴더/파일 클릭 시 현재 선택 항목(Active item / Active folder) 전역 상태 연동
- [ ] **Git Commit**: `feat: implement file explorer and directory picker integration`

---

## 📌 Phase 3: 썸네일 그리드 & 캐싱 시스템 (Thumbnail Grid & Caching)
- [ ] **Step 3.1**: 이미지 & 비디오 썸네일 자동 생성 및 Caching 유틸리티 (`src/utils/thumbnailGenerator.js`) 구현
- [ ] **Step 3.2**: 썸네일 그리드 컴포넌트 (`ThumbnailGrid.jsx`) 구현 (이미지/동영상 구분 뱃지, 비디오 재생시간 표기)
- [ ] **Step 3.3**: 썸네일 영역 검색어 필터링, 확장자 필터(전체/이미지/동영상), 정렬 기능 추가
- [ ] **Git Commit**: `feat: implement thumbnail grid generator with filters and caching`

---

## 📌 Phase 4: 이미지 뷰어 구현 (Advanced Image Viewer)
- [ ] **Step 4.1**: 이미지 뷰어 컴포넌트 (`ImageViewer.jsx`) 구축 - 캔버스/SVG/IMG 기반 줌(Zoom In/Out), 팬(Pan/Drag)
- [ ] **Step 4.2**: 90도 회전, 상하/좌우 반전, 핏 화면 / 원본 100% 뷰 조작 컨트롤러 구축
- [ ] **Step 4.3**: 이미지 정보 패널 (파일명, 해상도, 용량, EXIF/마지막 수정일) 팝오버 기능 추가
- [ ] **Git Commit**: `feat: implement interactive image viewer with zoom, pan, rotation`

---

## 📌 Phase 5: 비디오 뷰어 구현 (Custom Video Viewer with Frame Step & Snapshot)
- [ ] **Step 5.1**: 비디오 뷰어 컴포넌트 (`VideoViewer.jsx`) 구축 - HTML5 커스텀 컨트롤러 (재생/일시정지, 타임바, 볼륨, 재생시간)
- [ ] **Step 5.2**: 고급 기능 구현 - 재생 속도(0.25x~2.0x), 10초 이동, 프레임 단위 Step (0.05초 이동)
- [ ] **Step 5.3**: 비디오 현재 프레임 스냅샷 캡처(다운로드) 및 PiP 모드 지원
- [ ] **Git Commit**: `feat: implement video viewer with playback speed, frame step, snapshot`

---

## 📌 Phase 6: 메인 뷰어 통합 & UI Polish & Keyboard Shortcuts
- [ ] **Step 6.1**: Split Pane (사이드바 - 썸네일 - 메인 뷰어) 리사이즈 핸들 조절 기능 구현
- [ ] **Step 6.2**: 키보드 단축키 지원 (← / → 이전/다음 미디어, Space 재생/일시정지, F/Esc 전체화면)
- [ ] **Step 6.3**: 비어 있는 상태(Empty State), 로딩 스피너, 에러 처리 UI 세부 다듬기
- [ ] **Git Commit**: `feat: complete app integration with shortcuts, split layout, and polish`

---

## 📌 Future Enhancements (향후 기능 확장 가능 목록)
- [ ] 슬라이드쇼 (Slideshow) 자동 넘김 모드
- [ ] 태그 지정 및 즐겨찾기 (Bookmarking / Tagging) 기능 (IndexedDB 연동)
- [ ] 미디어 비교 뷰어 (Split Screen 2개 미디어 비교)
- [ ] 오디오 파일 지원 확장 (.mp3, .wav, .flac 등)
