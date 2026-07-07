# Live Pocket 배포 안내: Vercel + Supabase

이 프로젝트는 Vercel 웹 호스팅과 Supabase PostgreSQL 조합으로 배포할 수 있습니다.

## 1. Supabase에서 DB 만들기

1. Supabase에서 새 Project를 만듭니다.
2. Project Dashboard의 `Connect` 버튼을 누릅니다.
3. Vercel 배포에는 Supabase Pooler connection string을 권장합니다.
4. 복사한 값을 Vercel의 `DATABASE_URL` 환경변수에 넣습니다.

Supabase 공식 문서 기준으로 connection string은 Dashboard의 `Connect` 버튼에서 확인합니다.

## 2. Vercel에서 프로젝트 연결

1. Vercel에서 `Add New Project`를 누릅니다.
2. GitHub 저장소 `ms01park/livepocket`을 선택합니다.
3. Framework Preset은 `Other` 또는 자동 감지 그대로 둡니다.
4. Build Command는 비워둬도 됩니다.
5. Install Command는 기본값 `npm install`을 사용합니다.

이 저장소에는 Vercel용 `vercel.json`과 `/api/server.js`가 포함되어 있습니다.

## 3. Vercel Environment Variables

Vercel Project Settings의 Environment Variables에 아래 값을 등록하세요.

```env
DATABASE_URL=Supabase_Pooler_Connection_String
APP_BASE_URL=https://your-project.vercel.app
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=change-this-password
PGPOOL_MAX=1
```

중요:

- `APP_BASE_URL`은 Vercel 배포 URL 또는 연결한 커스텀 도메인으로 설정합니다.
- `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`는 운영용 값으로 반드시 바꿉니다.
- 서버가 시작될 때 위 슈퍼 어드민 계정이 생성 또는 갱신됩니다.
- Supabase Pooler 주소를 쓰면 Vercel 서버리스 환경에서 DB 연결 수를 줄이는 데 유리합니다.

## 4. 기존 SQLite 데이터 이전

기존 `live-pocket.db` 데이터를 Supabase PostgreSQL로 옮기려면 로컬에서 `DATABASE_URL`을 Supabase 값으로 설정한 뒤 실행합니다.

```bash
npm run migrate:pg
```

주의: 마이그레이션 스크립트는 대상 PostgreSQL 테이블을 비운 뒤 SQLite 데이터를 복사합니다. 이미 운영 데이터가 있으면 먼저 백업하세요.

## 5. 배포 후 확인

- `/` 홈 화면
- `/login.html` 회원 로그인
- `/admin-login.html` 슈퍼 어드민 로그인
- 공연 등록/수정
- 예매 생성
- 입금 확인 후 QR 표시
- `/tickets/verify/...` QR 확인 페이지
