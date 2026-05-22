import { glob } from 'glob'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'
import webWorkerLoader from 'rollup-plugin-web-worker-loader'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from "@rollup/plugin-node-resolve";
import copy from 'rollup-plugin-copy'
const plugins = [
  // webWorkerLoader({
  //   targetPlatform: 'browser',
  //   // 配置选项
  //   pattern: /\.worker\.(js|ts)$/, // 匹配 worker 文件
  //   extensions: ['.js', '.ts', '.worker.js', '.worker.ts'], // 支持的文件扩展名
  //   sourcemap: true, // 生成 sourcemap
  //   inline: true, // 是否内联，false 会生成独立文件
  //   forceInline: false, // 强制内联
  //   allowImportingTsExtensions: false
  // }),
  // resolve(), commonjs(),
  nodeResolve({
    preferBuiltins: false,     // 浏览器环境建议加上
    browser: true,             // 使用 browser 字段解析
  }),
  typescript({ declaration: false, declarationDir: null, allowImportingTsExtensions: false }),
  terser({ format: { comments: false } }),
]

export default [
  // ES module
  {
    input: 'src/wavesurfer.ts',
    output: {
      file: 'dist/wavesurfer.esm.js',
      format: 'esm',
    },
    plugins,
  },
  {
    // input: "src/worker/drawChannel.worker.ts",   // ← Worker 也作为入口
    input: "src/worker/drawChannelWASM.worker.ts",   // ← Worker 也作为入口
    output: { file: "dist/draw.worker.js", format: "es" },
    plugins: [resolve(), commonjs(), typescript(),
    copy({
      targets: [{ src: 'surfer-calc-module/pkg/*.wasm', dest: 'dist/' },
      { src: 'src/comlink/comlink.js', dest: 'dist/comlink/' },],
    }),]
  },
  // CommonJS module (Node.js)
  {
    input: 'src/wavesurfer.ts',
    output: {
      file: 'dist/wavesurfer.cjs',
      format: 'cjs',
      exports: 'default',
    },
    plugins,
  },
  {
    input: 'src/wavesurfer.ts',
    output: {
      name: 'WaveSurfer',
      file: 'dist/wavesurfer.min.js',
      format: 'umd',
      exports: 'default',
    },
    plugins,
  },
  // Compiled type definitions
  {
    input: './dist/wavesurfer.d.ts',
    output: [{ file: 'dist/types.d.ts', format: 'es' }],
    plugins: [dts()],
  },

  // Wavesurfer plugins (exclude worker files)
  ...glob
    .sync('src/plugins/*.ts')
    .filter((plugin) => !plugin.includes('worker'))
    .map((plugin) => [
      // ES module
      {
        input: plugin,
        output: {
          file: plugin.replace('src/', 'dist/').replace('.ts', '.js'),
          format: 'esm',
        },
        plugins,
      },
      // ES module again but with an .esm.js extension
      {
        input: plugin,
        output: {
          file: plugin.replace('src/', 'dist/').replace('.ts', '.esm.js'),
          format: 'esm',
        },
        plugins,
      },
      // CommonJS module (Node.js)
      {
        input: plugin,
        output: {
          name: plugin.replace('src/plugins/', '').replace('.ts', ''),
          file: plugin.replace('src/', 'dist/').replace('.ts', '.cjs'),
          format: 'cjs',
          exports: 'default',
        },
        plugins,
      },
      // UMD (browser script tag)
      {
        input: plugin,
        output: {
          name: plugin
            .replace('src/plugins/', '')
            .replace('.ts', '')
            .replace(/^./, (c) => `WaveSurfer.${c.toUpperCase()}`),
          file: plugin.replace('src/', 'dist/').replace('.ts', '.min.js'),
          format: 'umd',
          extend: true,
          globals: {
            WaveSurfer: 'WaveSurfer',
          },
          exports: 'default',
        },
        external: ['WaveSurfer'],
        plugins,
      },
    ])
    .flat(),
]
