function initCanvas(room) {
    console.log("初始化画布");
    // 性能检测
    let stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    room.emit("getHistoricalPath")
    room.on("historicalPath", (path) => {
        console.log(path)
        // 底层画布
        // let fullCanvas = document.querySelector("#full-canvas");
        let fullCanvas = document.createElement("canvas");
        fullCanvas.width = window.innerWidth * 3;
        fullCanvas.height = window.innerHeight * 3;
        let fCtx = fullCanvas.getContext("2d");

        // 用户可见画布
        let screenCanvas = document.querySelector("#main-canvas");
        screenCanvas.width = window.innerWidth;
        screenCanvas.height = window.innerHeight;
        let sCtx = screenCanvas.getContext("2d");

        // 去除默认右键菜单
        document.oncontextmenu = function(event) {
            event.preventDefault();
        };
        // 显示屏幕位置[每次重置]
        let screenPoint = {
            x: window.innerWidth,
            y: window.innerHeight
        }
        // 后台渲染层
        let fullPoint = {
            x: 0,
            y: 0
        }

        // 窗口大小变更时刷新
        window.onresize = function() {
            fullPoint.x -= (window.innerWidth * 3 - fullCanvas.width) / 2
            fullPoint.y -= (window.innerHeight * 3 - fullCanvas.height) / 2
            screenCanvas.width = window.innerWidth;
            screenCanvas.height = window.innerHeight;
            fullCanvas.width = window.innerWidth * 3;
            fullCanvas.height = window.innerHeight * 3;
            drenArr(pathArr, fCtx, fullCanvas, fullPoint)
        };

        let renderOk = true
        let renderS = true
        screenCanvas.addEventListener("mousemove", function(event) {
            if (event.buttons === 2) {
                renderS = true
                fullPoint.x -= event.movementX / dZoom
                fullPoint.y -= event.movementY / dZoom
                screenPoint.x -= event.movementX
                screenPoint.y -= event.movementY
            } else if (renderS) {
                renderS = false
                if (renderOk) {
                    renderOk = false
                    setTimeout(function() {
                        drenArr(pathArr, fCtx, fullCanvas, fullPoint)
                    }, 10)
                }
            }
        })
        screenCanvas.addEventListener("mouseup", function(event) {

        })
        screenCanvas.addEventListener("mouseleave", function(event) {

        })
        // 缩放监听
        let zoom = 1.1,
            dZoom = 1,
            screenZoom = 1,
            timeOut
        screenCanvas.addEventListener('mousewheel', function(event) {
            let delta = event.deltaY / 90
            let zooms = 0
            if (delta > 0) {
                zooms = Math.pow(zoom, -1.1);
            } else {
                zooms = Math.pow(zoom, 1.1);
            }

            let beforeW = screenCanvas.width * dZoom,
                beforeH = screenCanvas.height * dZoom;
            dZoom = dZoom * zooms;
            fCtx.scale(zooms, zooms);
            if (!timeOut) {
                sCtx.save()
                console.log("状态已保存")
            }
            screenZoom = screenZoom * zooms
            sCtx.scale(zooms, zooms);
            let afterW = screenCanvas.width * dZoom,
                afterH = screenCanvas.height * dZoom;
            fullPoint.x -= (((window.innerWidth + event.offsetX) / beforeW) * (beforeW - afterW)) / dZoom;
            fullPoint.y -= (((window.innerHeight + event.offsetY) / beforeH) * (beforeH - afterH)) / dZoom;
            screenPoint.x -= ((event.offsetX / beforeW) * (beforeW - afterW)) / screenZoom;
            screenPoint.y -= ((event.offsetY / beforeH) * (beforeH - afterH)) / screenZoom;
            
            clearTimeout(timeOut)
            timeOut = setTimeout(function() {
                timeOut = null
                console.log("执行")
                drenArr(pathArr, fCtx, fullCanvas, fullPoint)
                sCtx.restore()
                screenZoom = 1
            }, 200)
            console.log("忽略")
        });
        // 渲染历史数据
        let pathArr = [];
        // 循环该用户的所有路径
        for (let i = 0; i < path.length; i++) {
            pathArr.push(JSON.parse(path[i].path_data));
        };
        drenArr(pathArr, fCtx, fullCanvas, fullPoint)

        // 循环渲染模块
        window.requestAnimationFrame(refreshCanvas);

        function refreshCanvas() {
            stats.begin();
            sCtx.clearRect(0, 0, screenCanvas.width, screenCanvas.height)
            sCtx.drawImage(fullCanvas, screenPoint.x, screenPoint.y, window.innerWidth / screenZoom, window.innerHeight / screenZoom, 0, 0, window.innerWidth / screenZoom, window.innerHeight / screenZoom);
            stats.end();
            window.requestAnimationFrame(refreshCanvas);
        };
        // 渲染核心算法
        function drenArr(pathArr, ctx, canvas, xy) {
            console.log("render")
            ctx.fillStyle = "#d9d9d9";
            ctx.fillRect(0, 0, canvas.width / dZoom, canvas.height / dZoom)
            ctx.fill();
            // 绘制所有路径
            let lastX = 0,
                lastY = 0
            if (xy) {
                lastX = -xy.x
                lastY = -xy.y
            }
            for (let path = 0; path < pathArr.length; path++) {
                // 开始绘制路径
                // 判断是否已缓存路径
                // 如果路径点少于阈值,使用点绘制,否则根据配置选择点绘制还是线绘制
                if (pathArr[path].length > 2) {
                    // 判断绘制方法
                    ctx.beginPath();
                    ctx.lineCap = "round";
                    ctx.lineWidth = pathArr[path][0].brushSize;
                    ctx.strokeStyle = pathArr[path][0].color;
                    let points = pathArr[path]

                    // 贝塞尔曲线绘制方法
                    let besselPoints = getBessel(points);
                    let int = 0;
                    for (let i = 0; i < points.length; i++) {
                        ctx.lineTo(points[i].x + lastX, points[i].y + lastY);
                        if (i == 0) {
                            ctx.moveTo(points[0].x + lastX, points[0].y + lastY);
                            ctx.quadraticCurveTo(besselPoints[0].x + lastX, besselPoints[0].y + lastY, points[1].x + lastX, points[1].y + lastY);
                            int = int + 1;
                        } else if (i < points.length - 2) {
                            ctx.moveTo(points[i].x + lastX, points[i].y + lastY);
                            ctx.bezierCurveTo(besselPoints[int].x + lastX, besselPoints[int].y + lastY, besselPoints[int + 1].x + lastX, besselPoints[int + 1].y + lastY, points[i + 1].x + lastX, points[i + 1].y + lastY);
                            int += 2;
                        } else if (i == points.length - 2) {
                            ctx.moveTo(points[points.length - 2].x + lastX, points[points.length - 2].y + lastY);
                            ctx.quadraticCurveTo(besselPoints[besselPoints.length - 1].x + lastX, besselPoints[besselPoints.length - 1].y + lastY, points[points.length - 1].x + lastX, points[points.length - 1].y + lastY);
                        };
                    };
                    ctx.stroke();
                    ctx.closePath();
                } else {
                    for (let point = 0; point < pathArr[path].length; point++) {
                        ctx.beginPath();
                        ctx.fillStyle = pathArr[path][0].color;
                        ctx.arc(pathArr[path][point].x + lastX, pathArr[path][point].y + lastY, pathArr[path][0].brushSize / 2, 0, 2 * Math.PI);
                        ctx.fill();
                    };
                };
            };
            ctx.lineWidth = 1 / dZoom;
            ctx.strokeStyle = "#000000";
            ctx.strokeRect(window.innerWidth / dZoom, window.innerHeight / dZoom, window.innerWidth / dZoom, window.innerHeight / dZoom)
            console.log("canvas ok")
            screenPoint = {
                x: window.innerWidth,
                y: window.innerHeight
            }
            renderOk = true
        };
    })

    // 转换坐标点为贝塞尔控制点
    let Vector2 = function(x, y) {
        this.x = x;
        this.y = y;
    };
    Vector2.prototype = {
        length: function() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        normalize: function() {
            let inv = 1 / this.length();
            return new Vector2(this.x * inv, this.y * inv);
        },
        add: function(v) {
            return new Vector2(this.x + v.x, this.y + v.y);
        },
        multiply: function(f) {
            return new Vector2(this.x * f, this.y * f);
        },
        dot: function(v) {
            return this.x * v.x + this.y * v.y;
        },
        angle: function(v) {
            return Math.acos(this.dot(v) / (this.length() * v.length())) * 180 / Math.PI;
        }
    };

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
};