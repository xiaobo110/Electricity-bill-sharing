import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  // ✅ 更安全的 base 路径（适配 GitHub Pages 子路径）
  base: process.env.NODE_ENV === 'production'
    ? '/'  // 替换为你的仓库名
    : '/',                          // 开发环境用根路径

  server: {
    port: 3000,
    open: true,
    strictPort: true // 端口被占用时报错，而不是自动换端口
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  // ✅ 显式指定构建输出目录（便于 CI/CD 或手动部署）
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境可设为 true 用于调试，但会增大体积
    reportCompressedSize: false // 关闭 gzip 大小报告（加快构建）
  }
})
