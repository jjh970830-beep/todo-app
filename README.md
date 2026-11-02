# Todo 앱 (3티어)

```
[브라우저] → web (React + Vite, :5173) ──/api 요청 전달──→ api (Express, :3000) → PostgreSQL (:5432)
```

| 폴더 | 역할 |
|---|---|
| `web/` | React 화면. 개발 서버(Vite)가 `/api` 요청을 API 서버로 전달(proxy)합니다. |
| `api/` | Express 서버. 할 일을 DB에 읽고 씁니다. |
| `api/db/schema.sql` | 테이블 생성 SQL |
| `deploy/` | VM 배포용 설정 (systemd, Nginx) |

- **개발 실행** (Vite 개발 서버): 아래 1~3번
- **VM 배포** (Nginx + systemd): [VM에 배포하기](#vm에-배포하기-nginx--systemd)

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

---

# VM에 배포하기 (Nginx + systemd)

```
[브라우저] → Nginx (:80)
              ├─ /      → 빌드된 웹 파일 (/var/www/todo-app)
              └─ /api/  → API (:3000, systemd 서비스 todo-api) → PostgreSQL (:5432)
```

개발 실행과 달리 Vite 개발 서버를 쓰지 않고, 빌드한 정적 파일을 Nginx 가 제공합니다.
`/api` 전달도 Nginx 가 합니다.

> 80번 포트를 다른 프로그램(예: kind 클러스터)이 쓰고 있으면 Nginx 가 뜨지 않습니다.
> `sudo ss -ltnp | grep :80` 으로 확인하세요.

## 1. 패키지 설치

```bash
sudo apt update
sudo apt install -y nginx postgresql nodejs npm
sudo systemctl enable --now postgresql nginx    # 부팅 시 자동 시작
```

## 2. DB와 계정 만들기

위의 [1. DB와 전용 계정 만들기](#1-db와-전용-계정-만들기-처음-한-번) 와 같습니다.

## 3. 저장소 받기

```bash
mkdir -p ~/deploy && cd ~/deploy
git clone https://github.com/jjh970830-beep/todo-app.git
cd todo-app
```

## 4. API 준비

```bash
cd ~/deploy/todo-app/api
npm ci --omit=dev          # 실행에 필요한 패키지만 설치 (nodemon 제외)
cp .env.example .env       # PGPASSWORD 수정
npm run db:init
```

## 5. API 를 systemd 서비스로 등록

`deploy/todo-api.service` 의 `User`, `WorkingDirectory` 가 내 환경과 맞는지 확인한 뒤:

```bash
sudo cp ~/deploy/todo-app/deploy/todo-api.service /etc/systemd/system/
sudo systemctl daemon-reload                 # 새 서비스 파일 읽기
sudo systemctl enable --now todo-api         # 지금 시작 + 부팅 시 자동 시작
systemctl status todo-api                    # active (running) 이면 성공
journalctl -u todo-api -f                    # 로그 보기 (Ctrl+C 로 나가기)
```

## 6. 웹 빌드

```bash
cd ~/deploy/todo-app/web
npm ci
npm run build                                # dist/ 폴더 생성
sudo mkdir -p /var/www/todo-app
sudo cp -r dist/. /var/www/todo-app/
```

`/home/lab` 은 Nginx(www-data 사용자)가 읽을 수 없어서 `/var/www` 로 복사합니다.

## 7. Nginx 설정

```bash
sudo cp ~/deploy/todo-app/deploy/nginx-todo-app.conf /etc/nginx/sites-available/todo-app
sudo ln -sf /etc/nginx/sites-available/todo-app /etc/nginx/sites-enabled/todo-app
sudo rm -f /etc/nginx/sites-enabled/default  # 기본 페이지 끄기
sudo nginx -t                                # 설정 문법 검사
sudo systemctl reload nginx
```

## 8. 확인

```bash
curl localhost/api/todos                     # [] 또는 할 일 목록 JSON
```

브라우저: VS Code 아래 패널 **포트(PORTS)** 탭 → **포트 전달** → `80` 입력 → 지구본 아이콘으로 열기

재부팅 확인:

```bash
sudo reboot
# 다시 접속한 뒤
systemctl is-active postgresql todo-api nginx  # 세 줄 모두 active
curl localhost/api/todos
```

## 코드 업데이트 후 다시 배포

```bash
cd ~/deploy/todo-app && git pull
cd api && npm ci --omit=dev && sudo systemctl restart todo-api
cd ../web && npm ci && npm run build && sudo cp -r dist/. /var/www/todo-app/
```
