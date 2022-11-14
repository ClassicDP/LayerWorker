
const min = (a: number, b: number) => a < b ? a : b

class Vector {
    v: number[]

    constructor(public n: number) {
        this.v = Array(n)
    }

    static mul(a: Vector, b: Vector) {
        let n = min(a.n, b.n)
        let s = 0
        for (let i = 0; i < n; i++) s += a.v[i] * b.v[i]
        return s
    }
}

class Layer {
    w: Vector[]

    constructor(public inN: number, public outN: number) {
        this.w = []
        for (let i = 0; i < inN; i++) this.w.push(new Vector(outN))
    }

    initRandom() {
        for (let i = 0; i < this.inN; i++) for (let j = 0; j < this.outN; j++) this.w[i].v[j] = (Math.random() - 0.5)/10
    }

    forward(v: Vector) {
        let res = []
        for (let i = 0; i < this.outN; i++) {
            let s = 0
            for (let j = 0; j < this.inN; j++)
                s += Vector.mul(v, this.w[i])
            res.push(Math.tanh(s))
        }
        return res
    }
}

let layer = new Layer(32 * 4, 32)
layer.initRandom()
let v = new Vector(32 * 4)
for (let i = 0; i < v.n; i++) v.v[i] = Math.random() - 0.5

console.time('forward')
let res
for (let i = 0; i < 10000; i++) res = layer.forward(v)
console.timeEnd('forward')
console.log(res)


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


