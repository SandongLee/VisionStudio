# VisionStudio - Image & Video Web Viewer 완료보고서

웹 브라우저에서 로컬 폴더를 직접 탐색하고, 이미지와 동영상을 고성능 썸네일 그리드, 맞춤형 메인 뷰어, **카메라 EXIF / GPS / 최초 생성일 파일 속성 패널**, 상단 메뉴바 및 **Google Maps 지도 뷰어 (Thumbnail Marker)**와 함께 감상/분석할 수 있는 **VisionStudio Web Viewer** 개발이 완벽히 완료되었습니다.

---

## 🎨 주요 기능 및 레이아웃 구성

### 1. 📋 파일 속성 패널 (`FileProperties`)
- **📅 최초 생성일 / 촬영 일시 (`Creation Date / DateTimeOriginal`)**:
  - 카메라/스마트폰 EXIF 촬영 일시 및 시스템 생성 날짜 우선 표시
- **🏷️ 사용자 태그 관리자 (Tag Manager)** 및 **윈도우 전용 속성 태그 (`XPKeywords`)** 한글 무깨짐 파싱
- **📷 카메라 정보 (EXIF)** 및 **📍 GPS 위치 정보 (Google Maps 연동)**

### 2. 🗺️ Google Maps 지도 뷰어 (`MapView`)
- 썸네일 툴바 중앙의 **[🗺️ Google Maps에서 보기]** 전용 버튼
- 컴팩트 32x32 썸네일 마커 & 마커 클릭 시 **원래 상세 뷰어로 즉시 복귀**

### 3. 📌 상단 메뉴바 (`MenuBar`) & 📂 Explorer & 🖼️ Thumbnail Grid & 🔍 Media Viewer

---

## 🛠️ 실행 및 배포 주소

- **웹 서비스 주소**: `https://sandonglee.github.io/VisionStudio/`
- **GitHub 저장소**: `https://github.com/sandonglee/VisionStudio.git`
