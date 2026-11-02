// .env 파일의 값을 process.env 로 불러옵니다. (다른 코드보다 먼저 실행되어야 합니다)
require('dotenv').config();

const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json()); // 요청 본문(JSON)을 req.body 로 읽게 해 줍니다.

// 서버 상태 확인용
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// 목록 보기
app.get('/api/todos', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// 추가하기
app.post('/api/todos', async (req, res, next) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title) {
    return res.status(400).json({ error: 'title 이 필요합니다' });
  }
  try {
    // $1 처럼 값을 따로 넘기면 SQL 인젝션을 막을 수 있습니다.
    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// 완료 표시 바꾸기
app.patch('/api/todos/:id', async (req, res, next) => {
  if (typeof req.body.done !== 'boolean') {
    return res.status(400).json({ error: 'done 은 true 또는 false 여야 합니다' });
  }
  try {
    const result = await pool.query(
      'UPDATE todos SET done = $1 WHERE id = $2 RETURNING *',
      [req.body.done, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '할 일을 찾을 수 없습니다' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// 삭제하기
app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '할 일을 찾을 수 없습니다' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// 에러 처리 (위에서 next(err) 로 넘긴 에러가 여기로 옵니다)
app.use((err, req, res, next) => {
  // id 가 숫자가 아닐 때 PostgreSQL 이 내는 에러 (invalid input syntax)
  if (err.code === '22P02') {
    return res.status(400).json({ error: '잘못된 id 입니다' });
  }
  console.error(err);
  res.status(500).json({ error: '서버 오류' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API 서버 실행 중: http://localhost:${port}`);
});
