// db/schema.sql 을 실행해서 테이블을 만듭니다.  (npm run db:init)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('테이블 준비 완료');
  await pool.end();
}

main().catch((err) => {
  console.error('테이블 생성 실패:', err.message);
  process.exit(1);
});
