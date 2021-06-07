function initCanvas(pathArr) {
    console.log("初始化画布")
    const canvas = document.querySelector("#main-canvas"); // 画布
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext("2d"); // canvas2d对象

    let dZoom = 1
    let disabledPath = []

    let maxX = 0
    let maxY = 0
    let minX = 0
    let minY = 0

    for (var i = 0; i < pathArr.length; i++) {
        pathArr[i].path = JSON.parse(pathArr[i].path)
    }
    console.log(pathArr)
    
}

function getBessel(arr) {
    let rt = 0.3;
    let i = 0,
        count = arr.length - 2;
    let arrs = [];
    for (; i < count; i++) {
        let a = arr[i],
            b = arr[i + 1],
            c = arr[i + 2];
        let v1 = new Vector2(a.x - b.x, a.y - b.y);
        let v2 = new Vector2(c.x - b.x, c.y - b.y);
        let v1Len = v1.length(),
            v2Len = v2.length();
        let centerV = v1.normalize().add(v2.normalize()).normalize();
        let ncp1 = new Vector2(centerV.y, centerV.x * -1);
        let ncp2 = new Vector2(centerV.y * -1, centerV.x);
        if (ncp1.angle(v1) < 90) {
            let p1 = ncp1.multiply(v1Len * rt).add(b);
            let p2 = ncp2.multiply(v2Len * rt).add(b);
            arrs.push(p1, p2)
        } else {
            let p1 = ncp1.multiply(v2Len * rt).add(b);
            let p2 = ncp2.multiply(v1Len * rt).add(b);
            arrs.push(p2, p1)
        }
    }
    return arrs;
}

const Vector2 = class {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        let inv = 1 / this.length();
        return new Vector2(this.x * inv, this.y * inv);
    }
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    multiply(f) {
        return new Vector2(this.x * f, this.y * f);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    angle(v) {
        return Math.acos(this.dot(v) / (this.length() * v.length())) * 180 / Math.PI;
    }
}