// DB 연결 설정
// 접속 정보는 코드에 쓰지 않고 환경 변수(PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)에서 읽습니다.
// pg 의 Pool 은 위 이름의 환경 변수를 자동으로 사용합니다.
const { Pool } = require('pg');

const required = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`환경 변수가 없습니다: ${missing.join(', ')}  (api/.env 파일을 확인하세요)`);
  process.exit(1);
}

const pool = new Pool();

module.exports = pool;
