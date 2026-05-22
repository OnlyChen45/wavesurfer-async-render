import * as Comlink from '../comlink/comlink.js'
import { DrawApi } from './worker.type.ts'
import { LinePath } from '../renderer-utils.ts'

const api: DrawApi = {
  async drawChannel(
    primaryChannel: Float32Array,
    secondaryChannel: Float32Array,
    option: { width: number; height: number; vScale: number },
  ): Promise<LinePath[]> {
    const { width, height, vScale } = option
    const halfHeight = height / 2
    //   const primaryChannel = channelData[0] || []
    //   const secondaryChannel = channelData[1] || primaryChannel
    const channels = [primaryChannel, secondaryChannel]

    return channels.map((channel, index) => {
      const length = channel.length
      const hScale = length ? width / length : 0
      const baseY = halfHeight
      const direction = index === 0 ? -1 : 1

      const path: LinePath = [{ x: 0, y: baseY }]
      let prevX = 0
      let max = 0

      for (let i = 0; i <= length; i++) {
        const x = Math.round(i * hScale)

        if (x > prevX) {
          const heightDelta = Math.round(max * halfHeight * vScale) || 1
          const y = baseY + heightDelta * direction
          path.push({ x: prevX, y })
          prevX = x
          max = 0
        }

        const value = Math.abs(channel[i] || 0)
        if (value > max) max = value
      }

      path.push({ x: prevX, y: baseY })

      return path
    })
  },
}

Comlink.expose(api)
