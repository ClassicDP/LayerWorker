import {workerData, parentPort, isMainThread, Worker} from "worker_threads"

class LayerWorker {
    constructor(public w: number[][], public v: number[]) {
    }

    forward(i: number) {
        let v = this.w[i]
        let s = 0
        for (let i = 0; i < v.length; i++) s += v[i] * this.v[i]
        return s
    }
}

class Layer {
    private s: number
    private count: number
    private workersSet: Set<Worker> = new Set<Worker>()
    private queue: { (value: unknown): void }[] = []
    private resolve: (value: (PromiseLike<number> | number)) => void;

    constructor(public w: number[][], public v: number[], public threadCount = 10) {
    }

    async setWV() {
        let n = this.count
        for (let i = 0; i < this.threadCount; i++) {
            let worker = new Worker(__filename, {workerData: {i: i}})
            this.workersSet.add(worker)
            worker.on('message', msg => {
                if (msg.init) {
                    if (!--n) this.resolve(0)
                } else {
                    this.s += Number(msg.s)
                    if (this.queue.length) {
                        this.queue.shift()(worker)
                    } else this.workersSet.add(worker)
                    if (!--this.count) this.resolve(this.s)
                }
            })
            worker.postMessage({cmd: "init", w: this.w, v: this.v})
        }
        return new Promise (resolve=> this.resolve=resolve)
    }

    async forward() {
        let takeWorker = async () => {
            if (this.workersSet.size) {
                let ret = [...this.workersSet][0]
                this.workersSet.delete(ret)
                return ret
            }
            return new Promise<Worker>(resolve => this.queue.push(resolve))
        }
        this.s = 0
        this.count = this.w.length
        for (let i in this.w) {
            let worker = await takeWorker()
            worker.postMessage({cmd: 'forward', i: i})
            // console.log('->', i, Date.now() - t);
        }
        return new Promise<number>(resolve => this.resolve = resolve)
    }


}

const t = Date.now()
export let layer: Layer
if (isMainThread) {
    let m = 32 * 4
    let n = 32
    let w = []
    for (let i = 0; i < m; i++) {
        let ww = []
        for (let j = 0; j < n; j++) ww.push(Math.random())
        w.push(ww)
    }
    let v = []

    for (let j = 0; j < n; j++) v.push(Math.random())
    layer = new Layer(w, v)
    let rout = async () => {
        console.time('init')
        await layer.setWV()
        console.timeEnd('init')
        console.time('1')
        for (let i = 0; i < 2000; i++) {
            await layer.forward()
            // console.log(i, Date.now() - t)
        }
        console.timeEnd('1')

    }
    rout().then()
} else {
    let layerWorker
    parentPort.on('message', (msg) => {
        if (msg.cmd == "init") {
            // console.log('init', workerData)
            layerWorker = new LayerWorker(msg.w, msg.v)
            parentPort.postMessage({init: workerData})
        }
        if (msg.cmd == 'forward') {
            parentPort.postMessage({workerData: workerData, s: layerWorker.forward(msg.i)})
        }
    });
}


