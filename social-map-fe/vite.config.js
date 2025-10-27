import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window', // ✅ thêm dòng này để fix lỗi "global is not defined"
  },
})
