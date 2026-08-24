// workerPool.js - Multithreaded Web Worker Pool Manager

class WorkerPoolManager {
  constructor(poolSize = (navigator.hardwareConcurrency || 4)) {
    this.poolSize = Math.max(2, Math.min(poolSize, 8))
    this.workers = []
    this.idleWorkers = []
    this.taskQueue = []
    this.activeTaskMap = new Map()
    this.taskIdCounter = 1

    this.initWorkers()
  }

  initWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new Worker(
          new URL('../workers/mediaWorker.js', import.meta.url),
          { type: 'module' }
        )

        worker.onmessage = (e) => this.handleWorkerMessage(worker, e.data)
        worker.onerror = (err) => this.handleWorkerError(worker, err)

        this.workers.push(worker)
        this.idleWorkers.push(worker)
      } catch (e) {
        console.warn('Failed to initialize Web Worker in pool:', e)
      }
    }
  }

  handleWorkerMessage(worker, data) {
    const { taskId, success, result, error } = data
    const task = this.activeTaskMap.get(taskId)

    if (task) {
      this.activeTaskMap.delete(taskId)
      if (success) {
        task.resolve(result)
      } else {
        task.reject(new Error(error))
      }
    }

    // Release worker back to idle pool
    this.idleWorkers.push(worker)
    this.processNextTask()
  }

  handleWorkerError(worker, err) {
    console.error('Worker error:', err)
    this.idleWorkers.push(worker)
    this.processNextTask()
  }

  executeTask(type, file, options = {}) {
    return new Promise((resolve, reject) => {
      const taskId = this.taskIdCounter++
      const task = { taskId, type, file, options, resolve, reject }

      this.taskQueue.push(task)
      this.processNextTask()
    })
  }

  processNextTask() {
    if (this.taskQueue.length === 0 || this.idleWorkers.length === 0) return

    const worker = this.idleWorkers.pop()
    const task = this.taskQueue.shift()

    this.activeTaskMap.set(task.taskId, task)

    worker.postMessage({
      taskId: task.taskId,
      type: task.type,
      file: task.file,
      options: task.options
    })
  }
}

export const workerPool = new WorkerPoolManager()
