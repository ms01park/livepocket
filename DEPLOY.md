# Live Pocket 무료 배포 안내

## 추천 구조

- 웹 호스팅: Koyeb Free Web Service 같은 Node.js 지원 호스팅
- 데이터베이스: 무료 PostgreSQL(Koyeb PostgreSQL, Neon, Supabase 등)
- 앱 실행: `npm start`

이제 앱은 SQLite 파일이 아니라 `DATABASE_URL` 환경변수로 연결되는 PostgreSQL을 사용합니다.

## 서버 환경변수

무료 호스팅의 Environment Variables에 아래 값을 등록하세요.

```env
PORT=3000
APP_BASE_URL=https://your-domain.com
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=change-this-password
```

중요:

- `APP_BASE_URL`은 실제 접속 주소로 설정합니다.
- `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`는 운영용으로 반드시 바꿉니다.
- 서버가 시작될 때 `.env`의 슈퍼 어드민 비밀번호로 계정이 갱신됩니다.
- 무료 PostgreSQL이 외부 SSL 연결을 요구하면 기본 설정으로 동작합니다. 로컬 PostgreSQL을 쓸 때는 `PGSSLMODE=disable`을 추가하세요.

## Koyeb 배포 요약

1. GitHub에 프로젝트를 올립니다.
2. Koyeb에서 Web Service를 새로 만들고 GitHub 저장소를 연결합니다.
3. Build command는 비워두거나 `npm install`을 사용합니다.
4. Run command는 `npm start`로 둡니다.
5. PostgreSQL DB를 만들고 발급된 connection string을 `DATABASE_URL`에 넣습니다.
6. `APP_BASE_URL`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`도 함께 등록합니다.
7. 배포 후 `/`, `/login.html`, `/admin-login.html`을 확인합니다.

## 기존 SQLite 데이터 이전

기존 `live-pocket.db` 데이터를 PostgreSQL로 옮기려면:

1. 먼저 서버를 한 번 실행해서 PostgreSQL 테이블을 생성합니다.
2. 앱을 잠시 멈춥니다.
3. `DATABASE_URL`이 설정된 상태에서 아래 명령을 실행합니다.

```bash
npm run migrate:pg
```

다른 SQLite 파일을 지정하려면:

```bash
node scripts/migrate-sqlite-to-postgres.cjs ./live-pocket.db
```

주의: 마이그레이션 스크립트는 PostgreSQL의 기존 운영 데이터를 `TRUNCATE`한 뒤 SQLite 데이터를 복사합니다. 운영 DB에 이미 중요한 데이터가 있으면 먼저 백업하세요.

## 업로드할 파일

- `server.js`
- `package.json`
- `package-lock.json`
- `*.html`
- `assets/`
- `config/`
- `scripts/`

업로드하지 않아도 되는 파일:

- `live-pocket.db`
- `live-pocket.db-shm`
- `live-pocket.db-wal`
- `*.pptx`
- `~$*.pptx`

## 배포 후 확인

- 홈 화면 공연 목록 노출
- 회원가입/로그인
- 슈퍼 어드민 로그인
- 공연 등록/수정
- 예매 생성
- 입금 확인 후 QR 표시
- QR 확인 URL 접속
