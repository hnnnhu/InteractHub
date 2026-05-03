import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'  // ← THÊM DÒNG NÀY

export default defineConfig({
    plugins: [react(), tailwindcss()],  // ← THÊM tailwindcss() VÀO ĐÂY
})