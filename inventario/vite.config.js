import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuración de Vite.
// base: './' hace que los archivos compilados usen rutas relativas.
// Así la misma app funciona en el navegador y, más adelante, dentro de
// Electron o Tauri (que abren los archivos desde el disco, no desde un servidor).
export default defineConfig({
  plugins: [react()],
  base: './',
})
