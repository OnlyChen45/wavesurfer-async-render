import { glob } from 'glob'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'
import webWorkerLoader from 'rollup-plugin-web-worker-loader'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from "@rollup/plugin-node-resolve";
import copy from 'rollup-plugin-copy'
import plugin from 'rollup-plugin-dts'
export default [
  {
    // input: "src/worker/drawChannel.worker.ts",   // ← Worker 也作为入口
    input: "src/worker/drawChannelWASM.worker.ts",   // ← Worker 也作为入口
    output: { file: "dist/draw.worker.js", format: "es" },
    plugins: [resolve(), commonjs(), typescript(),
    copy({
      targets: [{ src: 'surfer-calc-module/pkg/*.wasm', dest: 'dist/' },
      { src: 'src/comlink/comlink.js', dest: 'dist/comlink/' },
      { src: 'examples/useWavesurfer/index.js', dest: 'dist/useWavesurfer/' }],
    }),],
  }
]
