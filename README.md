# wavesurfer-wasm-async

基于 [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js) 的音频波形可视化库，添加了 **Web Worker 异步渲染**与 **WebAssembly (WASM) 加速**补丁。
测试脚本为 examples/async-render-react.js

本Demo主要作为 **JS Worker** 和 **WASM** 在较长的音频波形渲染场景下的技术验证与 Demo。 

主要修改了render.ts中的renderLineWaveform方法，将其调用栈均改为了async函数，同时让兼容渲染函数options.renderFunction选项可兼容异步函数。

验证结论是，jsworker的引入会显著提升较长音频加载时的用户交互体验， 

在测试中对于一段36min 码率195 kbit/s 采样率44.1 kHz的音频，jsworker渲染时间约为0.12s，不存在主进程阻塞问题。 

基于wasmpack的wasm模块，并未显著较少jswoker的运行时间，对于同一段36min音频，jsworker+wasm渲染时间约为0.1s，其中0.04s为音频数据Float32array复制时间，0.06s为wasm计算时间。 

此外，本Demo修改了rollup.config,确保了打包的wavesurfer.esm.js是全量的。

## 核心能力

- 波形渲染（Canvas 2D）
- **Web Worker 异步渲染**：将 Channel 波形路径计算 offload 到独立 Worker，避免阻塞主线程
- **WASM 加速渲染**：使用 Rust + `wasm-bindgen` 在 Worker 内完成高性能路径计算


## 渲染模式对比

| 模式 | 路径计算位置 | 特点 | 适用场景 |
|------|------------|------|---------|
| `sync` (默认) | 主线程 | 简单直接，无额外依赖 | 短音频、快速集成 |
| `worker` | Web Worker + WASM | 不阻塞 UI，Rust 高性能计算 | 长音频、高分辨率、复杂波形 |

通过 `renderMode: 'worker'` 开启异步渲染：

```js
const ws = WaveSurfer.create({
  container: '#waveform',
  url: '/audio.mp3',
  renderMode: 'worker', // 启用 Worker 异步渲染
})
```


## Worker 模块架构

在 `renderMode: 'worker'` 时，`Renderer` 会实例化一个 Web Worker，通过 [Comlink](https://github.com/GoogleChromeLabs/comlink) 进行 RPC 通信。

### 1. JS Worker（纯 JavaScript）

- **文件**：`src/worker/drawChannel.worker.ts`
- **作用**：将主线程中的 `calculateLinePaths` 逻辑搬运到 Worker 中执行
- **价值**：验证"仅迁移计算到 Worker"带来的主线程流畅度提升

### 2. WASM Worker（Rust + WASM）

- **文件**：`src/worker/drawChannelWASM.worker.ts`
- **Rust 模块**：`surfer-calc-module/src/lib.rs`
- **核心函数**：`calc_paths(channel_data, index, width, half_height, v_scale) -> PointArrays`
- **作用**：在 Worker 内部使用 Rust 编译的 WASM 模块计算波形路径点
- **价值**：验证 Rust/WASM 在密集型浮点运算中的性能优势

### 3. 数据流

```
Renderer (主线程)
    │
    ├── 同步模式 ──► utils.calculateLinePaths() ──► Canvas
    │
    └── Worker 模式 ──► Comlink.transfer(Float32Array) ──► Worker
                              │
                              ├── JS Worker  →  纯 JS 路径计算
                              └── WASM Worker →  Rust calc_paths()
                              │
                              ◄── Promise<LinePath[]> ──► Canvas 绘制
```

> Worker 模式下，音频 Channel 数据通过 `Comlink.transfer()` 以 **zero-copy** 方式传入 Worker，避免大数组的序列化开销。


## 快速开始

### 安装依赖

```bash
yarn install
```

### 构建 WASM 模块

```bash
yarn build:wasm
```

### 开发模式

```bash
yarn start
# 或分别执行
yarn build:dev
yarn serve
```

访问 `http://localhost:9090`，在左侧导航选择 **Async-render-react** 即可体验 Worker 渲染效果。

### 生产构建

```bash
yarn build
```


## 示例：React + Worker 渲染

`examples/async-render-react.js` 演示了在 React 中使用 `renderMode: 'worker'`：

```js
import { useWavesurfer } from 'wavesurfer.js/dist/useWavesurfer/index.js'
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js'

const App = () => {
  const containerRef = useRef(null)

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: '/examples/audio/long-audio/gufengdj4h.mp3',
    plugins: useMemo(() => [Timeline.create()], []),
    renderMode: 'worker', // <-- 关键：启用异步 Worker 渲染
  })

  // ...
}
```

该示例使用长音频文件，更能体现 Worker 异步渲染避免主线程卡顿的优势。

## License

BSD-3-Clause
