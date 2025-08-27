import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Thêm dòng này để chỉ định đường dẫn cơ sở cho dự án
  // Thay 'ung-dung-du-doan' bằng tên repository của bạn nếu khác
  base: '/ung-dung-du-doan/', 
  plugins: [react()],
})
