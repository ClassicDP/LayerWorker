import {workerData, parentPort, isMainThread, Worker} from "worker_threads"

type WorkerReq = { cmd: 'init' | 'calc' | 'check', data: number[][] | number, t: number }
type WorkerRes = { res: 'done' | 'start', data?: number | string }

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
            return new Promise<void>(resolve => {
                let count = workersPool.length
                workersPool.forEach(worker =>
                    worker.on('message', (msg: WorkerRes) => {
                        if (msg.res === 'done' && !--count) resolve()
                    }))
            })
        }
        let workersOnline = async (workersPool: Worker[]) => {
            return new Promise<void>(resolve => {
                let count = workersPool.length
                workersPool.forEach(worker => {
                    worker.postMessage({cmd: "check", t: Date.now()} as WorkerReq)
                    worker.on('message', (msg: WorkerRes) => {
                        if (msg.res === "start" && !--count) resolve()
                    })
                })
            })
        }
        let threadsCount = 8
        let workersPool: Worker[] = []
        let data = []
        for (let i = 0; i < 128; i++) data.push((new Array(32)).fill(0))
        console.time('online')
        for (let i = 0; i < threadsCount; i++)
            workersPool.push(new Worker(__filename, {workerData: {id: i}}))
        await workersOnline(workersPool)
        console.timeEnd('online')
        console.time('init')
        for (let i = 0; i < threadsCount; i++) {
            workersPool[i].postMessage({cmd: "init", data: data, t: Date.now()} as WorkerReq)
            workersPool.push(workersPool[i])
        }
        await workersConfirm(workersPool)
        console.timeEnd('init')
    }
    rout().then()
} else {
    let matrix: Matrix
    parentPort.on('message', (msg: WorkerReq) => {
        console.log('req worker id:', workerData.id, 'req lag:', Date.now() - msg.t)
        if (msg.cmd === "init") {
            matrix = new Matrix(msg.data as number[][])
            for (let i = 0; i < 2e4; i++)
                matrix.w.forEach((v, i) =>
                    v.forEach((v, j) => matrix.w[i][j] = Math.sin(Math.random())))
            parentPort.postMessage({res: "done"} as WorkerRes)
        }
        if (msg.cmd === "check") parentPort.postMessage({res: "start"} as WorkerRes)
    })
}

