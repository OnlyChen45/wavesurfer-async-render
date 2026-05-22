// import * as Comlink from 'comlink'
import * as Comlink from '../comlink/comlink.js'
import { DrawApi } from './worker.type.ts'
import { LinePath } from '../renderer-utils.ts'
import __wbg_init from "../../surfer-calc-module/pkg/surfer_calc_module"
import { PointArrays, calc_paths } from "../../surfer-calc-module/pkg/surfer_calc_module"
const api: DrawApi = {
  async drawChannel(
    primaryChannel: Float32Array,
    secondaryChannel: Float32Array,
    option: { width: number; height: number; vScale: number },
  ): Promise<LinePath[]> {
    const { width, height, vScale } = option
    const halfHeight = height / 2
    const channels = [primaryChannel, secondaryChannel]
    await __wbg_init();
    return channels.map((channel, index) => {
      const pointArrays: PointArrays = calc_paths(channel, index, width, halfHeight, vScale);
      const path: LinePath = []
      for (let i = 0; i < pointArrays.len; i++) {
        const x = pointArrays.xs[i]
        const y = pointArrays.ys[i]
        path.push({ x: x, y: y })
      }
      return path
    })
  },
}

Comlink.expose(api)
