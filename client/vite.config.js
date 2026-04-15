import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000", // <-- Change this for local dev
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cached separately, changes rarely
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Heavy 3D library — only loads on pages that use it
          'vendor-three': ['@react-three/fiber', '@react-three/drei'],
          // Animation library
          'vendor-motion': ['framer-motion'],
          // Audio waveform library
          'vendor-audio': ['wavesurfer.js'],
          // UI utilities
          'vendor-ui': ['lucide-react', 'react-icons', 'react-hot-toast'],
          // Data / networking
          'vendor-data': ['axios', '@tanstack/react-query', 'socket.io-client'],
        },
      },
    },
  },
})