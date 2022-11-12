
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


