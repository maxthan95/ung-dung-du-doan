import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Dòng này rất quan trọng, nó chỉ định đường dẫn cơ sở cho dự án.
  // Hãy chắc chắn '/ung-dung-du-doan/' khớp với tên repository của bạn.
  base: '/ung-dung-du-doan/', 
  plugins: [react()],
})
