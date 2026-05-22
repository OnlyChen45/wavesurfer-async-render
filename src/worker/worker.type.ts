import { LinePath } from '../renderer-utils.ts'

export interface DrawApi {
  drawChannel(
    primaryChannel: Float32Array,
    secondaryChannel: Float32Array,
    option: {
      width: number
      height: number
      vScale: number
    },
  ): Promise<LinePath[]>
}
