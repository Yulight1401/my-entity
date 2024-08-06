import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // 入口文件
      name: 'MyEntity', // 库的全局变量名
      fileName: (format) => `my-lib.${format}.js` // 输出文件名
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['react'], // 例如，如果你的库依赖于 react
      output: {
        globals: {
          react: 'React'
        }
      }
    }
  }
});