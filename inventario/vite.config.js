import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' = rutas relativas, necesarias para empaquetar la app con Electron/Tauri
export default defineConfig({
  plugins: [react()],
  base: './',
})
