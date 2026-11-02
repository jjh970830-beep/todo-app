import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // /api 로 시작하는 요청을 API 서버로 전달합니다.
    // API 주소를 바꾸려면 환경 변수 API_URL 을 지정하세요.
    proxy: {
      '/api': process.env.API_URL || 'http://localhost:3000',
    },
  },
});
