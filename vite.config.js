import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // 线上走 GitHub Pages 项目子路径，构建产物用相对路径即可自适配
  base: command === 'build' ? './' : '/',
  server: { port: 5180 },
}));
