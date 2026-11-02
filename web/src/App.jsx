import { useEffect, useState } from 'react';

// API 요청을 보내고 응답(JSON)을 돌려주는 도우미 함수
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `요청 실패 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  // 처음 화면이 뜰 때 목록을 불러옵니다.
  useEffect(() => {
    api('/todos').then(setTodos).catch((err) => setError(err.message));
  }, []);

  async function addTodo(e) {
    e.preventDefault(); // 폼 제출 시 페이지가 새로고침되는 것을 막습니다.
    if (!title.trim()) return;
    try {
      const todo = await api('/todos', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      setTodos([...todos, todo]);
      setTitle('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTodo(todo) {
    try {
      const updated = await api(`/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ done: !todo.done }),
      });
      setTodos(todos.map((t) => (t.id === updated.id ? updated : t)));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTodo(todo) {
    try {
      await api(`/todos/${todo.id}`, { method: 'DELETE' });
      setTodos(todos.filter((t) => t.id !== todo.id));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <h1>할 일 목록</h1>

      <form onSubmit={addTodo} className="add-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일을 입력하세요"
        />
        <button type="submit">추가</button>
      </form>

      {error && <p className="error">{error}</p>}

      {todos.length === 0 ? (
        <p className="empty">할 일이 없습니다.</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.done ? 'done' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo)}
                />
                <span>{todo.title}</span>
              </label>
              <button onClick={() => deleteTodo(todo)} aria-label="삭제">
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
