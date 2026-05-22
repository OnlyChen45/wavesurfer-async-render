// src/types/worker.d.ts 或 src/worker.d.ts
declare module '*.worker.ts' {
  class WebWorker extends Worker {
    constructor()
  }
  export default WebWorker
}

declare module '*.worker.ts?worker' {
  class WebWorker extends Worker {
    constructor()
  }
  export default WebWorker
}

declare module '*.worker.ts?inline' {
  const createWorker: () => Worker
  export default createWorker
}

// 或者更通用的声明
declare module '*.worker' {
  class WebWorker extends Worker {
    constructor()
  }
  export default WebWorker
}

declare module '*?worker' {
  class WebWorker extends Worker {
    constructor()
  }
  export default WebWorker
}
