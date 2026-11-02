# Todo 앱 (3티어)

```
[브라우저] → web (React + Vite, :5173) ──/api 요청 전달──→ api (Express, :3000) → PostgreSQL (:5432)
```

| 폴더 | 역할 |
|---|---|
| `web/` | React 화면. 개발 서버(Vite)가 `/api` 요청을 API 서버로 전달(proxy)합니다. |
| `api/` | Express 서버. 할 일을 DB에 읽고 씁니다. |
| `api/db/schema.sql` | 테이블 생성 SQL |

## 필요 환경

- Node.js 18 이상 (v18.19.1에서 확인)
- PostgreSQL (apt 설치, 16에서 확인)

## 1. DB와 전용 계정 만들기 (처음 한 번)

`비밀번호`는 직접 정한 값으로 바꾸세요.

```bash
sudo -u postgres psql -c "CREATE USER todo_user WITH PASSWORD '비밀번호';"
sudo -u postgres psql -c "CREATE DATABASE todo_db OWNER todo_user;"
```

> PostgreSQL 15부터는 `public` 스키마에 아무나 테이블을 만들 수 없습니다.
> DB 소유자(OWNER)를 `todo_user`로 지정해서 이 계정이 테이블을 만들 수 있게 했습니다.

## 2. API 설정과 실행

```bash
cd api
npm install
cp .env.example .env      # 그다음 .env 의 PGPASSWORD 를 1단계 비밀번호로 수정
npm run db:init           # todos 테이블 생성 ("테이블 준비 완료" 가 나오면 성공)
npm run dev               # API 서버 실행 (코드 수정 시 자동 재시작)
```

확인 (다른 터미널에서):

```bash
curl http://localhost:3000/api/health      # {"ok":true}
```

## 3. 웹 실행

새 터미널에서:

```bash
cd web
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다.
(다른 PC에서 VM으로 접속하려면 `npm run dev -- --host` 로 실행하고 `http://VM의IP:5173` 으로 접속)

## 환경 변수 (api/.env)

| 이름 | 설명 | 예시 |
|---|---|---|
| `PORT` | API 서버 포트 | `3000` |
| `PGHOST` | DB 주소 | `localhost` |
| `PGPORT` | DB 포트 | `5432` |
| `PGDATABASE` | DB 이름 | `todo_db` |
| `PGUSER` | DB 계정 | `todo_user` |
| `PGPASSWORD` | DB 비밀번호 | (직접 정한 값) |

`.env` 는 `.gitignore` 에 있어서 Git 에 올라가지 않습니다. 예시는 `.env.example` 을 보세요.

웹의 proxy 대상 주소는 기본이 `http://localhost:3000` 이며, 바꾸려면 `API_URL=http://주소:포트 npm run dev` 로 실행합니다.

## API 목록

| 메서드 | 주소 | 본문 | 설명 |
|---|---|---|---|
| GET | `/api/todos` | - | 목록 |
| POST | `/api/todos` | `{"title":"우유 사기"}` | 추가 |
| PATCH | `/api/todos/:id` | `{"done":true}` | 완료 표시 변경 |
| DELETE | `/api/todos/:id` | - | 삭제 |

## 문제 해결

- **`환경 변수가 없습니다`**: `api/.env` 파일이 있는지, 값이 채워져 있는지 확인하세요.
- **`password authentication failed`**: `.env` 의 `PGPASSWORD` 가 1단계 비밀번호와 같은지 확인하세요.
- **`permission denied for schema public`**: DB를 만들 때 `OWNER todo_user` 를 빠뜨렸는지 확인하세요.
  `sudo -u postgres psql -c "ALTER DATABASE todo_db OWNER TO todo_user;"`
- **웹 화면에 `요청 실패 (500)` 또는 `(502)`**: API 서버(`npm run dev` in `api/`)가 켜져 있는지 확인하세요.
