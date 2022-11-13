import {workerData, parentPort, isMainThread, Worker} from "worker_threads"

type WorkerReq = { cmd: 'init' | 'calc', data: number[][] | number, t: number }
type WorkerRes = { res: 'done', data?: number | string }

async function wait(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

class Matrix {
    constructor(public w: number[][]) {
    }
}

if (isMainThread) {
    let rout = async () => {
        let workersConfirm = async (workersPool: Worker[]) => {
            let resolveFunc: Function
            let count = workersPool.length
            workersPool.forEach(worker =>
                worker.on('message', (msg: WorkerRes) => {
                    if (msg.res === 'done' && !--count) resolveFunc()
                }))
            return new Promise<void>(resolve => resolveFunc = resolve)
        }
        let workerOnline = async (worker: Worker) => {
            let resolveFunc: Function
            worker.on('online', (msg: WorkerRes) => {
                resolveFunc()
            })
            return new Promise<void>(resolve => resolveFunc = resolve)
        }
        let threadsCount = 8
        let workerPool: Worker[] = []
        let data = []

        for (let i = 0; i < 128; i++) data.push([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
        console.time('online')
        for (let i = 0; i < threadsCount; i++) {
            let worker = new Worker(__filename, {workerData: {id:i}})
            await workerOnline(worker)
            workerPool.push(worker)
        }
        console.timeEnd('online')
        // await wait(3000)
        console.time('init')
        for (let i = 0; i < threadsCount; i++) {
            workerPool[i].postMessage({cmd: "init", data: data, t: Date.now()} as WorkerReq)
            workerPool.push(workerPool[i])
        }
        await workersConfirm(workerPool)
        console.timeEnd('init')
    }
    rout().then()
} else {
    let matrix: Matrix
    parentPort.on('message', (msg: WorkerReq) => {
        console.log('req', workerData.id ,Date.now() - msg.t)
        if (msg.cmd === "init") {
            matrix = new Matrix(msg.data as number[][])
            for (let i = 0; i < 1e4; i++)
                matrix.w.forEach((v, i) =>
                    v.forEach((v, j) => matrix.w[i][j] = Math.sin(Math.random())))
            parentPort.postMessage({res: "done"} as WorkerRes)
        }
    })
}

//
// class LayerWorker {
//     constructor(public w: number[][], public v: number[]) {
//     }
//
//     forward(i: number) {
//         let v = this.w[i]
//         let s = 0
//         for (let i = 0; i < v.length; i++) s += v[i] * this.v[i]
//         return s
//     }
// }
//
// class Layer {
//     private s: number
//     private count: number
//     private workersSet: Set<Worker> = new Set<Worker>()
//     private waitingForWorker: boolean
//     private resolveWorker: (val: Worker) => void
//     private resolveNumber: (val: number) => void
//     constructor(public w: number[][], public v: number[], public threadCount = 10) {
//     }
//
//     async setWV() {
//         let n = this.count
//         for (let i = 0; i < this.threadCount; i++) {
//             let worker = new Worker(__filename, {workerData: {i: i}})
//             this.workersSet.add(worker)
//             worker.on('message', msg => {
//                 if (msg.init) {
//                     if (!--n) this.resolveNumber!(0)
//                 } else {
//                     this.s += Number(msg.s)
//                     if (this.waitingForWorker) {
//                         this.resolveWorker(worker)
//                     } else this.workersSet.add(worker)
//                     if (!--this.count)
//                         this.resolveNumber(this.s)
//                 }
//             })
//             worker.postMessage({cmd: "init", w: this.w, v: this.v})
//         }
//         return new Promise(resolve => {
//             this.resolveNumber = (msg:number ) => resolve(msg)
//         })
//     }
//
//     async forward() {
//         let takeWorker = async () => {
//             if (this.workersSet.size) {
//                 this.waitingForWorker = false
//                 let ret = [...this.workersSet][0]
//                 this.workersSet.delete(ret)
//                 return ret
//             }
//             this.waitingForWorker = true
//             return new Promise<Worker>(resolve => {
//                 this.resolveWorker = (worker: Worker) => {
//                     this.waitingForWorker = false
//                     resolve(worker)
//                 }
//             })
//         }
//         this.s = 0
//         this.count = this.w.length
//         for (let i in this.w) {
//             let worker = await takeWorker()
//             worker.postMessage({cmd: 'forward', i: i})
//             // console.log('->', i, Date.now() - t);
//         }
//         return new Promise<number>(resolve => {
//             this.resolveNumber = (msg: number) => resolve(msg)
//         })
//     }
//
//
// }
//
//
// if (isMainThread) {
//     const t = Date.now()
//     let layer: Layer
//     let m = 32 * 4
//     let n = 32
//     let w = []
//     for (let i = 0; i < m; i++) {
//         let ww = []
//         for (let j = 0; j < n; j++) ww.push(Math.random())
//         w.push(ww)
//     }
//     let v = []
//
//     for (let j = 0; j < n; j++) v.push(Math.random())
//     layer = new Layer(w, v)
//     let rout = async () => {
//         console.time('init')
//         await layer.setWV()
//         console.timeEnd('init')
//         console.time('1')
//         for (let i = 0; i < 2000; i++) {
//             await layer.forward()
//             // console.log(i, Date.now() - t)
//         }
//         console.timeEnd('1')
//
//     }
//     rout().then()
// } else {
//     let layerWorker: LayerWorker
//     parentPort.on('message', (msg) => {
//         if (msg.cmd == "init") {
//             // console.log('init', workerData)
//             layerWorker = new LayerWorker(msg.w, msg.v)
//             parentPort.postMessage({init: workerData})
//         }
//         if (msg.cmd == 'forward') {
//             parentPort.postMessage({workerData: workerData, s: layerWorker.forward(msg.i)})
//         }
//     });
// }


