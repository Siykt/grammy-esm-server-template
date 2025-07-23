import { defineConfig } from 'tsup'

export default defineConfig({
  entryPoints: ['src/'],
  outDir: 'dist',
  dts: false,
  sourcemap: false,
  clean: true,
  format: 'esm',
})
