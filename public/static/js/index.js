"use strict"

// 取消浏览器默认右键菜单
window.oncontextmenu = function(e) {
    e.preventDefault();
}

window.onload = function() {
    // 初始化色块
    initColorBlock();
    // 初始化画布
    initCanvas();
};

// 初始化画布
function initCanvas() {
    const socket = io();
    // 主要操作元素
    const canvas = document.querySelector("#canvas");
    const bursh = document.querySelector("#brush");
    const ctx = canvas.getContext("2d");
    const menuLayer = document.querySelector(".menus");
    const zoomIndicator = document.querySelector(".indicator-tag.your-self");
    const fullImfo = document.querySelector(".wating-service");
    const userName = document.querySelector(".input-user-name");
    const userPsw = document.querySelector(".input-user-psw");
    const loginView = document.querySelector(".login");
    const titalNum = document.querySelector(".total-num");
    const onlineList = document.querySelector(".online-list");
    const msgList = document.querySelector(".top-msg-list");
    const otherPlayerList = document.querySelector(".other-user-mouse");
    const zoomList = document.querySelector(".right-zoom-indicator");
    const msgBox = document.querySelector(".omMsg");
    const onlineEl = document.querySelector(".online");
    const rightZoomIndicator = document.querySelector(".right-zoom-indicator");
    const leftMenu = document.querySelector(".left-menu");
    // const testEl = document.querySelector(".full-z");
    // 配置项
    let runTime = new Date().getTime(); // 运行时钟
    let loadOk = 0; // 历史数据加载状态
    let pathArrList = {}; // 路径数组列表
    let tempPathArr = {}; // 临时绘制路径
    let withdrawArr = []; // 撤回记录
    let disabledPath = []; // 停止绘制id列表
    let userId = null; // 本地玩家id
    let localUserId = null; // 服务器上用户的id
    let loaclUserName = null; // 本地玩家名称
    let lockUserList = []; // 本地用户统计
    let canvasBGC = "#d9d9d9";
    let lastX = 0, // 当前位置
        lastY = 0;
    let moveX = 0,
        moveY = 0;
    let tempX = 0, // 临时坐标
        tempY = 0;
    let burshX = 0, // 笔刷原始坐标
        burshY = 0;
    let zoom = 1.1, // 缩放步幅
        dZoom = 1, // 初始缩放值
        maxZoom = 150,
        minZoom = -150;
    let mouseX = 0, // 鼠标位置
        mouseY = 0;
    let transX = 0, // 计算补间用
        transY = 0;
    let hipX = 0, // 高性能移动坐标
        hipY = 0;
    let drowLine = true; // 更改绘制模式为贝塞尔曲线,可大幅度提高性能,但小几率出现线条扭曲
    let imageData; // 图片数据
    let minimumThreshold = 0.1; // 画布最低绘制宽度
    let brushColor = "#000000"; // 笔刷颜色
    let dragStart = false;
    let moveStart = false;
    let enableTween = true; // 是否启用补间[已优化,目前此选项几乎不会造成卡顿]
    let autoInterval = true; // 根据当前笔刷大小自动计算补间间隔,开启时"tweenInterval","tweenStride"将无效
    let tweenInterval = 6; // 启用补间的间隔
    let tweenStride = 5; // 补间步幅
    let highPerformanceDrag = false; // 是否启用高性能拖动[已优化,不建议启用]
    let loginStatus = false; // 登录状态
    let brushMinSize = 5; // 笔刷最小直径
    let brushMaxSize = 120;
    let brushDefaultSize = 20; // 初始笔刷直径
    let zoomVal = 0; // 记录用缩放值
    let f1Num = 0; // 切换ui展示状态保存值
    // 宽度变化监听
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.scale(dZoom, dZoom);
        drenArr(pathArrList);
    }
    // 初始化大小
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 监听快捷键
    document.addEventListener("keydown", function(e) {
        switch (e.keyCode) {
            case 118:
                event.preventDefault();
                f1Num++;
                switch (f1Num) {
                    case 1:
                        msgBox.style.display = "none";
                        break;
                    case 2:
                        onlineEl.style.display = "none";
                        break;
                    case 3:
                        rightZoomIndicator.style.display = "none";
                        break;
                    case 4:
                        leftMenu.style.display = "none";
                        break;
                    case 5:
                        msgBox.style.display = "";
                        onlineEl.style.display = "";
                        rightZoomIndicator.style.display = "";
                        leftMenu.style.display = "";
                        f1Num = 0;
                        break;
                };
                break;
            case 119:
                downloadImage();
                break;
        };
        if (e.ctrlKey == true && e.keyCode == 90) { //Ctrl+Z
            e.preventDefault();
            withdraw();
            console.log("撤回指令");
        };
        if (e.ctrlKey == true && e.keyCode == 89) { //Ctrl+Z
            e.preventDefault();
            redo();
            console.log("重做指令");
        };
        if (e.ctrlKey == true && e.keyCode == 83) { //Ctrl+Z
            e.preventDefault();
            downloadImage();
            console.log("保存指令");
        };
    });

    // 保存画布
    function downloadImage() {
        event.preventDefault();
        let dataUrl = canvas.toDataURL("image/png")
        let tempA = document.createElement("a");
        tempA.setAttribute("href", dataUrl);
        tempA.setAttribute("download", "downImg");
        tempA.click();
    }

    // 撤回操作
    function withdraw() {
        if (pathArrList[userId].length) {
            let withdrawPath = pathArrList[userId].pop()
            console.log("撤回", withdrawPath[0].time)
            withdrawArr.push(withdrawPath);
            socket.emit("withdraw", { cookie: Cookies.get("cookieId"), time: withdrawPath[0].time });
            drenArr(pathArrList);
        } else {
            console.log("没有能撤回的步数了");
        };
    };

    // 重做上一步
    function redo() {
        if (withdrawArr.length) {
            let redoPath = withdrawArr.pop()
            pathArrList[userId].push(redoPath);
            socket.emit("redo", { cookie: Cookies.get("cookieId"), time: redoPath[0].time });
            drenArr(pathArrList);
        } else {
            console.log("没有能重做的步数了");
        };
    };

    // 监听笔刷位置
    canvas.addEventListener("mousedown", function(e) {
        if (!tempPathArr[userId]) {
            tempPathArr[userId] = new Array();
        };
        // 清除重做步数
        if (withdrawArr.length) {
            withdrawArr = new Array();
        }
        if (e.buttons === 1) {
            transX = e.offsetX;
            transY = e.offsetY;
            dragStart = true;
            dren(e);
        } else if (e.buttons === 2) {
            if (highPerformanceDrag) {
                hipX = 0;
                hipY = 0;
            };
            drenArr(pathArrList);
            tempX = e.offsetX;
            tempY = e.offsetY;
            moveStart = true;
            canvas.className = "move";
            brush.className = "move";
        } else {
            dragStart = false;
        };
        emitData();
    });
    canvas.addEventListener("mouseup", function(e) {
        dragStart = false;
        moveStart = false;
        canvas.className = "";
        brush.className = "";
        if (highPerformanceDrag) {
            drenArr(pathArrList);
        };
        if (userId) {
            if (tempPathArr[userId].length) {
                pathArrList[userId].push(tempPathArr[userId]);
                tempPathArr[userId] = [];
            }
        } else {
            alert("出现错误\nNot Found userId");
        };
        emitData();
    });
    canvas.addEventListener("mousemove", function(e) {
        runTime = new Date().getTime();
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        burshX = mouseX - bursh.offsetWidth / 2;
        burshY = mouseY - bursh.offsetHeight / 2;
        bursh.style.transform = "translate3d(" + burshX + "px, " + burshY + "px, 0px)";
        let frameX = transX - mouseX,
            frameY = transY - mouseY;
        if (dragStart) {
            menuLayer.className = "menus poe";
            // 补间,填充两个坐标之间的空隙
            if (enableTween) {
                if (autoInterval) {
                    tweenInterval = Math.pow(bursh.offsetWidth, 0.6);
                    tweenStride = 1;
                };
                if (Math.abs(frameX) > tweenInterval || Math.abs(frameY) > tweenInterval || (Math.abs(frameX) > tweenInterval / 2 && Math.abs(frameY) > tweenInterval / 2)) {
                    let tween = Math.abs(frameX) > Math.abs(frameY) ? Math.abs(frameX) / tweenStride : Math.abs(frameY) / tweenStride;
                    let tweenX = frameX / tween,
                        tweenY = frameY / tween;
                    let stepX = tweenX,
                        stepY = tweenY;
                    for (let i = tween - 1; i >= 0; i--) {
                        let point = {
                            offsetX: mouseX + stepX,
                            offsetY: mouseY + stepY,
                            tween: true
                        };
                        stepX += tweenX;
                        stepY += tweenY;
                        dren(point);
                    };
                };
            };
            transX = mouseX;
            transY = mouseY;
            dren(e);
        } else {
            menuLayer.className = "menus";
        };
        if (moveStart) {
            menuLayer.className = "menus poe";
            moveCanvas(e);
        };
        emitData();
    });

    // 绘制方法
    function dren(e) {
        if (!tempPathArr[userId].length) {
            tempPathArr[userId].push({
                x: (e.offsetX / dZoom - lastX),
                y: (e.offsetY / dZoom - lastY),
                color: brushColor,
                brushSize: bursh.offsetWidth / dZoom,
                tween: e.tween ? true : false,
                time: runTime
            })
        } else if (!drowLine) { // 如果是点绘制模式则需要这些数据
            tempPathArr[userId].push({
                x: (e.offsetX / dZoom - lastX),
                y: (e.offsetY / dZoom - lastY),
                color: brushColor,
                brushSize: bursh.offsetWidth / dZoom,
                tween: e.tween ? true : false
            })
        } else {
            tempPathArr[userId].push({
                x: (e.offsetX / dZoom - lastX),
                y: (e.offsetY / dZoom - lastY),
                tween: e.tween ? true : false
            })
        }
        ctx.fillStyle = brushColor;
        ctx.beginPath();
        ctx.arc(e.offsetX / dZoom, e.offsetY / dZoom, (bursh.offsetWidth / 2) / dZoom, 0, 2 * Math.PI);
        ctx.fill();
    }

    // 绘制数组路径
    function drenArr(arr) {
        // console.log(arr)
        ctx.clearRect(0, 0, canvas.width / dZoom, canvas.height / dZoom);
        ctx.fillStyle = canvasBGC;
        ctx.fillRect(0, 0, canvas.width / dZoom, canvas.height / dZoom)
        ctx.fill();
        let pathArr = []
        // 循环用户数组
        for (let userId in arr) {
            // 检测是否屏蔽该用户
            if (disabledPath.indexOf(userId) === -1) {
                // 循环该用户的所有路径
                for (let path = 0; path < arr[userId].length; path++) {
                    if (arr[userId][path]) {
                        // 获取所有的路径
                        pathArr.push(arr[userId][path])
                    }
                };
            };
        };
        // 根据路径创建时间排序
        pathArr.sort(function(a, b) {
            return a[0].time - b[0].time
        })
        // 绘制所有路径
        for (let path = 0; path < pathArr.length; path++) {
            // 开始绘制路径
            // 如果路径点少于阈值,使用点绘制,否则根据配置选择点绘制还是线绘制
            if (pathArr[path].length > 2) {
                // 判断绘制方法
                if (drowLine) {
                    ctx.beginPath();
                    ctx.lineCap = "round";
                    ctx.lineWidth = pathArr[path][0].brushSize;
                    ctx.strokeStyle = pathArr[path][0].color;
                    // 移除补间帧
                    let points = removeTween(pathArr[path]);
                    // 新的贝塞尔曲线绘制方法
                    let besselPoints = getBessel(points);
                    let int = 0;
                    try {
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
                    } catch (error) {
                        console.error(besselPoints);
                    }
                    ctx.stroke();
                } else {
                    // 点绘制方法,非常消耗性能,不建议使用
                    for (let point = 0; point < pathArr[path].length; point++) {
                        // 如果缩放后笔刷粗细小于阈值则不绘制以提升性能
                        if (pathArr[path][point].brushSize * dZoom > minimumThreshold) {
                            ctx.beginPath();
                            ctx.fillStyle = pathArr[path][point].color;
                            ctx.arc((pathArr[path][point].x + lastX), (pathArr[path][point].y + lastY), pathArr[path][point].brushSize / 2, 0, 2 * Math.PI);
                            ctx.fill();
                        };
                    };
                };
            } else {
                for (let point = 0; point < pathArr[path].length; point++) {
                    // 如果缩放后笔刷粗细小于阈值则不绘制以提升性能
                    if (pathArr[path][point].brushSize * dZoom > minimumThreshold) {
                        ctx.beginPath();
                        ctx.fillStyle = pathArr[path][point].color;
                        ctx.arc((pathArr[path][point].x + lastX), (pathArr[path][point].y + lastY), pathArr[path][point].brushSize / 2, 0, 2 * Math.PI);
                        ctx.fill();
                    };
                };
            };
        }

        // 高性能拖动残留代码
        if (highPerformanceDrag) {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        };
    };

    // 计算位移
    function moveCanvas(e) {
        let eX = e.offsetX;
        let eY = e.offsetY;
        moveX = -tempX + eX;
        moveY = -tempY + eY;
        tempX = eX;
        tempY = eY;
        lastX = lastX + moveX / dZoom;
        lastY = lastY + moveY / dZoom;
        if (highPerformanceDrag) {
            hipX = hipX + moveX;
            hipY = hipY + moveY;
            moveImage();
        } else {
            drenArr(pathArrList);
            refreshPlayer();
        };
    };

    // 移除补间坐标
    function removeTween(arr) {
        let newArr = [];
        for (let i = 0; i < arr.length; i++) {
            if (!arr[i].tween) {
                newArr.push(arr[i]);
            };
        };
        return newArr;
    };

    // 转换坐标点为贝塞尔控制点 (借鉴代码,有bug,可能返回NaN)
    let Vector2 = function(x, y) {
        this.x = x;
        this.y = y;
    };
    Vector2.prototype = {
        "length": function() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        "normalize": function() {
            let inv = 1 / this.length();
            return new Vector2(this.x * inv, this.y * inv);
        },
        "add": function(v) {
            return new Vector2(this.x + v.x, this.y + v.y);
        },
        "multiply": function(f) {
            return new Vector2(this.x * f, this.y * f);
        },
        "dot": function(v) {
            return this.x * v.x + this.y * v.y;
        },
        "angle": function(v) {
            return Math.acos(this.dot(v) / (this.length() * v.length())) * 180 / Math.PI;
        }
    };

    // 贝塞尔控制点计算函数,似乎有bug,坐标会随机返回NaN
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

    // 向服务器发送信息
    function emitData() {
        const mouseData = {
            x: (burshX / dZoom - lastX),
            y: (burshY / dZoom - lastY),
            brushSize: bursh.offsetWidth / dZoom,
            drag: dragStart,
            color: brushColor,
            zoomSize: zoomVal
        }
        socket.emit("pointMove", { point: mouseData, cookie: Cookies.get("cookieId"), time: runTime });
    }

    // 高性能移动
    function moveImage() {
        ctx.clearRect(0, 0, canvas.width / dZoom, canvas.height / dZoom);
        ctx.putImageData(imageData, hipX, hipY)
    }
    // 鼠标滚轮监听
    canvas.addEventListener('mousewheel', function(e) {
        if (!dragStart) {
            let delta = e.deltaY / 90
            if (e.deltaY > 0) {
                zoomVal++
            } else {
                zoomVal--
            }
            zoomFun(-delta);
            let proportion = zoomVal / maxZoom * 100
            zoomIndicator.style.top = `${50 - (proportion / 2)}%`;
        }
    }, false);

    // 缩放方法
    function zoomFun(delta) {
        // console.log(dZoom)
        if (zoomVal <= maxZoom || delta > 0) {
            if (zoomVal >= minZoom || delta < 0) {
                let zooms = 0
                if (delta > 0) {
                    zooms = Math.pow(zoom, 1.1);
                } else {
                    zooms = Math.pow(zoom, -1.1);
                }
                ctx.scale(zooms, zooms);
                let afterW = canvas.width * dZoom,
                    afterH = canvas.height * dZoom;
                dZoom = dZoom * zooms;
                let beforeW = canvas.width * dZoom,
                    beforeH = canvas.height * dZoom;
                lastX = lastX + ((mouseX / afterW) * (afterW - beforeW)) / dZoom;
                lastY = lastY + ((mouseY / afterH) * (afterH - beforeH)) / dZoom;
                drenArr(pathArrList);
                emitData();
                refreshPlayer();
            } else {
                console.log("最小值")
                console.log(zoomVal, dZoom)
                zoomVal = minZoom
            }
        } else {
            console.log("最大值")
            console.log(zoomVal, dZoom)
            zoomVal = maxZoom
        }
    }

    // 刷新其他用户数据
    function refreshPlayer() {
        const players = document.querySelectorAll(".player-mouse");
        for (let i = 0; i < players.length; i++) {
            let elPintX = players[i].getAttribute("data-brush-x");
            let elPintY = players[i].getAttribute("data-brush-y");
            let elBrushSize = players[i].getAttribute("data-brush-size");
            players[i].style.transform = "translate3d(" + ((1 * elPintX + lastX) * dZoom) + "px, " + ((1 * elPintY + lastY) * dZoom) + "px, 0px)";
            players[i].style.width = elBrushSize * dZoom + "px";
            players[i].style.height = elBrushSize * dZoom + "px";
        }
    }

    // 笔刷菜单功能
    function brushMenu() {
        const brushSize = document.querySelector(".brush-size-range");
        const colorBox = document.querySelectorAll(".color-box");
        const colorInput = document.querySelector(".input-color");
        const selectColor = document.querySelector(".color-view");
        let clickSlider = false;

        // 初始化笔刷直径
        bursh.style.width = brushDefaultSize + "px";
        bursh.style.height = brushDefaultSize + "px";
        // 初始化笔刷控制器默认值
        brushSize.setAttribute("min", brushMinSize);
        brushSize.setAttribute("max", brushMaxSize);
        brushSize.value = brushDefaultSize;
        brushSize.setAttribute("title", "当前笔刷大小" + brushDefaultSize + "px");

        function onRangeChange(r, f) {
            let n, c, m;
            r.addEventListener("input", function(e) {
                n = 1;
                c = e.target.value;
                if (c != m) f(e);
                m = c;
            });
            r.addEventListener("change", function(e) { if (!n) f(e); });
        }
        // 监听笔刷大小
        onRangeChange(brushSize, function() {
            bursh.style.width = brushSize.value + "px";
            bursh.style.height = brushSize.value + "px";
            brushSize.setAttribute("title", "当前笔刷大小" + brushSize.value + "px");
            emitData();
        })
        // 监听调色盘
        onRangeChange(selectColor, function(e) {
            document.querySelector(".color-box.select").style.backgroundColor = selectColor.value;
            brushColor = selectColor.value;
            selectColor.style.backgroundColor = selectColor.value;
            colorInput.setAttribute("placeholder", selectColor.value);
            bursh.style.backgroundColor = brushColor + "6B";
            zoomIndicator.style.backgroundColor = brushColor + "6B";
        })
        selectColor.addEventListener("change", function() {
            overlayColor(selectColor.value);
        })
        // 绑定色块点击事件
        colorBox.forEach((el, index) => {
            el.addEventListener("click", function() {
                if (this.className.indexOf("select") === -1) {
                    cleanSelect();
                    this.className = "color-box select";
                    brushColor = this.getAttribute("title");
                    colorInput.setAttribute("placeholder", brushColor);
                    colorInput.value = "";
                    selectColor.style.backgroundColor = brushColor;
                    selectColor.value = brushColor;
                    bursh.style.backgroundColor = brushColor + "6B";
                    zoomIndicator.style.backgroundColor = brushColor + "6B";
                    emitData();
                };
            });
        });

        function getBrushColor() {
            const el = document.querySelector(".color-box.select");
            brushColor = el.getAttribute("title");
            colorInput.setAttribute("placeholder", brushColor);
            colorInput.value = "";
            selectColor.style.backgroundColor = brushColor;
            selectColor.value = brushColor;
            bursh.style.backgroundColor = brushColor + "6B";
            zoomIndicator.style.backgroundColor = brushColor + "6B";
        };
        // 获取笔刷颜色
        getBrushColor();

        // 监听输入框输入值
        colorInput.addEventListener("input", function(e) {
            checkColor(this.value);
        });
        colorInput.addEventListener("propertychange", function(e) {
            checkColor(this.value);
        });

        // 判断输入值是不是hex色值
        function checkColor(hex) {
            const hexReg = new RegExp(/(^#[0-9A-F]{6}$)/i);
            // 如果是正确hex值则重写当前选中颜色
            if (hexReg.test(hex)) {
                overlayColor(hex);
            };
        };

        // 覆盖当前选中颜色
        function overlayColor(hex) {
            colorBox.forEach((el, index) => {
                if (el.className.indexOf("select") !== -1) {
                    el.setAttribute("title", hex);
                    el.style.backgroundColor = hex;
                    brushColor = el.getAttribute("title");
                    colorInput.setAttribute("placeholder", brushColor);
                    selectColor.style.backgroundColor = brushColor;
                    selectColor.value = brushColor;
                    emitData();
                };
            });
        };
        // 清除选中颜色
        function cleanSelect() {
            colorBox.forEach((el, index) => {
                el.setAttribute("class", "color-box");
            });
        };
    };
    brushMenu();

    // 开始初始化与服务器的连接
    function initSockit() {
        const infoText = document.querySelector(".login-info");
        const loginBtn = document.querySelector(".login-btn");
        const invitationCode = document.querySelector(".input-invitation-code");
        const sendBtn = document.querySelector(".send-msg");
        const inputMsg = document.querySelector(".input-msg");
        let logOrReg = null;

        // 判断是否有记录登录状态
        if (Cookies.get("cookieId")) {
            if (Cookies.get("cookieId").length) {
                cookieLogin(Cookies.get("cookieId"));
                disableLogin("啊,我好像记得你...");
            };
        };

        // 监听输入
        userName.addEventListener("input", function(e) {
            checkName(this.value);
            onlineName(this.value)
        });
        userName.addEventListener("propertychange", function(e) {
            checkName(this.value);
            onlineName(this.value)
        });

        // 与服务器建立连接
        socket.on("connect", () => {
            console.log("服务器已连接");
            fullImfo.className = "wating-service disable";
            if (loginStatus) {
                console.log("重新登录");
                cookieLogin(Cookies.get("cookieId"));
            };
        });

        // 断开与服务器的连接
        socket.on("disconnect", () => {
            console.log("服务器断开连接");
            fullImfo.className = "wating-service";
            fullImfo.innerText = "与服务器断开通信,正在重新连接...";
        });

        // 返回登录结果
        socket.on("loginReturn", function(data) {
            console.log("登录成功", data);
            if (data.status) {
                Cookies.set("cookieId", data.cookieId, { expires: 365 });
                infoText.innerText = "登录成功啦~";
                userId = "id" + data.id;
                localUserId = data.id;
                loaclUserName = data.name;
                loginSuccess();
            } else {
                switch (data.code) {
                    case 0:
                        initLoginView("这个用户名已被使用,或密码错误");
                        Cookies.remove("cookieId");
                        break;
                    case 1:
                        initLoginView("你已经在其他地方登录啦");
                        Cookies.remove("cookieId");
                        break;
                    default:
                        initLoginView("未知错误诶,刷新试试?");
                        Cookies.remove("cookieId");
                        break;
                }
            };
        });

        // 返回注册结果
        socket.on("registeredReturn", function(data) {
            console.log(data);
            if (data.status) {
                Cookies.set("cookieId", data.cookieId, { expires: 365 });
                infoText.innerText = "注册成功啦~";
                userId = "id" + data.id;
                localUserId = data.id;
                loaclUserName = data.name;
                loginSuccess();
            } else {
                if (data.err === 1) {
                    initLoginView("注册失败了诶,换个名字试试?");
                    Cookies.remove("cookieId");
                } else if (data.err === 2) {
                    initLoginView("邀请码填错啦");
                    Cookies.remove("cookieId");
                } else {
                    initLoginView("未知错误诶,刷新试试?");
                    Cookies.remove("cookieId");
                };
            };
        });

        // 返回自动登录结果
        socket.on("autoLoginReturn", function(data) {
            if (!data.status) {
                loginStatus = false;
                switch (data.code) {
                    case 0:
                        initLoginView("记住登录过期啦");
                        Cookies.remove("cookieId");
                        break;
                    case 1:
                        initLoginView("服务器出错了QAQ");
                        Cookies.remove("cookieId");
                        break;
                    case 2:
                        initLoginView("你已经在其他地方登录啦");
                        break;
                    default:
                        initLoginView("未知错误诶,刷新试试?");
                        Cookies.remove("cookieId");
                        break;
                }

            };
        });

        // 在服务器检测用户名结果
        socket.on("checkNameReturn", function(data) {
            console.log("在服务器中检查用户名", data);
            if (data.status) { // 存在
                loginBtn.innerText = "登录";
                logOrReg = "login";
                invitationCode.className = "input-invitation-code disable";
            } else { // 不存在
                loginBtn.innerText = "注册";
                logOrReg = "registered";
                invitationCode.className = "input-invitation-code";
            };
        });

        // 新用户上线监听
        socket.on("userAdd", function(data) {
            console.log("新用户上线", data);
            if (loginStatus) {
                newUserAdd(data);
                createBursh(data);
                createZoomBar(data);
                lockUserList.push(data);
            }
        });

        // 用户下线监听
        socket.on("userDisconnect", function(data) {
            if (loginStatus) {
                console.log("用户下线", data);
                remveUserBrush(data);
                removeUser(data);
                removeZoomBar(data);
            }
        });

        // 接收用户列表
        socket.on("returnUserList", function(data) {
            console.log("接收到用户列表", data);
            loadOk++;
            initUserList()
            for (let i = 0; i < data.length; i++) {
                newUserAdd(data[i]);
                createBursh(data[i]);
                createZoomBar(data[i]);
                lockUserList.push(data[i]);
            }
            isloadOk();
        });

        // 返回历史消息
        socket.on("returnHistoricalMessage", function(data) {
            console.log("接收到历史消息列表", data);
            for (let i = 0; i < data.length; i++) {
                if (data[i].type === 1) { // 1为系统消息
                    putSystemMsg(data[i].content);
                } else if (data[i].type === 0) { // 0为用户消息
                    if (data[i].userId === localUserId) {
                        putUsMsg(data[i].userName, data[i].content);
                    } else {
                        putUserMsg(data[i].userName, data[i].content);
                    };
                };
            };
            putSystemMsg(`----------------以上是历史消息----------------`);
            putSystemMsg(`操作介绍`);
            putSystemMsg(`左键绘制,右键拖动,滚轮缩放`);
            putSystemMsg(`鼠标放置在"在线人数"上可显示用户id和在线列表`);
            putSystemMsg(`输入#disable 他人id 可以屏蔽此id绘制的内容`);
            putSystemMsg(`输入#enable 他人id 可以解禁此id绘制的内容`);
            putSystemMsg(`例如,禁用id1的用户 #disable id1`);
            putSystemMsg(`快捷键,f7切换ui展示,f8保存当前视图`);
        });

        // 返回历史路径信息
        socket.on("returnHistoricalPath", function(data) {
            console.log("接收到历史路径信息", data);
            for (let i = 0; i < data.length; i++) {
                let playerId = data[i].userId;
                if (pathArrList["id" + playerId] === undefined) {
                    pathArrList["id" + playerId] = new Array();
                }
                pathArrList["id" + playerId].push(data[i].path)
            }
            drenArr(pathArrList)
        })

        // 新消息接收
        socket.on("newMessage", function(data) {
            if (loginStatus) {
                if (data.type === 1) { // 1为系统消息
                    putSystemMsg(data.content);
                } else if (data.type === 0) { // 0为用户消息
                    if (data.userId === localUserId) {
                        putUsMsg(data.userName, data.content);
                    } else {
                        putUserMsg(data.userName, data.content);
                    };
                };
            }
        });

        // 接收服务器错误信息
        socket.on("errorCode", function(data) {
            switch (data.code) {
                case 0:
                    // 强制刷新页面
                case 1:
                    // 清除cookie记录值
            }
        })

        // 接收服务器端保存的重做列表
        socket.on("returnRedoPath", function(data) {
            console.log("获取到在线重做列表", data)
            data.sort(function(a, b) {
                return b[0].time - a[0].time
            })
            withdrawArr = data
        })

        // 其他用户的撤回操作
        socket.on("userWithdraw", function(data) {
            console.log("其他用户的撤回操作", data)
            pathArrList["id" + data.userId].pop();
            drenArr(pathArrList);
        })

        // 其他用户的重做操作
        socket.on("userRedo", function(data) {
            console.log("其他用户的重做操作", data)
            pathArrList["id" + data.userId].push(data.path);
            drenArr(pathArrList);
        })

        // 接收其他用户的坐标信息
        let somX, somY, playrDrag = false;
        socket.on("otherPlayer", function(data) {
            const playerBursh = document.querySelector(`#id${data.userId}`);
            const zoomEl = document.querySelector(`#bar-id${data.userId}`);
            let zoomPercentage = data.point.zoomSize / maxZoom * 100;
            if (playerBursh) {
                zoomEl.style.top = `${50 - (zoomPercentage / 2)}%`;
                if (!tempPathArr["id" + data.userId]) {
                    tempPathArr["id" + data.userId] = new Array();
                }
                if (!pathArrList["id" + data.userId]) {
                    pathArrList["id" + data.userId] = new Array();
                }
                if (data.point.drag) {
                    if (!tempPathArr["id" + data.userId].length) {
                        tempPathArr["id" + data.userId].push({
                            x: data.point.x + (data.point.brushSize / 2),
                            y: data.point.y + (data.point.brushSize / 2),
                            color: data.point.color,
                            brushSize: data.point.brushSize,
                            time: data.time,
                            tween: false
                        })
                    } else {
                        tempPathArr["id" + data.userId].push({
                            x: data.point.x + (data.point.brushSize / 2),
                            y: data.point.y + (data.point.brushSize / 2),
                            tween: false
                        })
                    }
                } else if (tempPathArr["id" + data.userId].length) {
                    pathArrList["id" + data.userId].push(tempPathArr["id" + data.userId]);
                    tempPathArr["id" + data.userId] = new Array();
                    drenArr(pathArrList);
                }
                playerBursh.setAttribute("data-brush-size", data.point.brushSize);
                playerBursh.setAttribute("data-brush-x", data.point.x);
                playerBursh.setAttribute("data-brush-y", data.point.y);
                data.point.x = data.point.x + lastX;
                data.point.y = data.point.y + lastY;
                playerBursh.style.transform = "translate3d(" + (data.point.x * dZoom) + "px, " + (data.point.y * dZoom) + "px, 0px)";
                playerBursh.style.width = data.point.brushSize * dZoom + "px";
                playerBursh.style.height = data.point.brushSize * dZoom + "px";
                playerBursh.style.backgroundColor = data.point.color + "6B";
                zoomEl.style.backgroundColor = data.point.color + "6B";
                if (!data.point.drag && playrDrag) {
                    playrDrag = false;
                };
                if (data.point.drag) {
                    if (!playrDrag) {
                        playrDrag = true;
                        somX = data.point.x;
                        somY = data.point.y;
                    };
                    if (autoInterval) {
                        console.log(data.point.brushSize)
                        tweenInterval = data.point.brushSize / 3;
                        tweenStride = tweenInterval;
                    };
                    ctx.fillStyle = data.point.color;
                    ctx.beginPath();
                    ctx.arc(data.point.x + (data.point.brushSize / 2), data.point.y + (data.point.brushSize / 2), data.point.brushSize / 2, 0, 2 * Math.PI);
                    ctx.fill();
                    // 临时写入绘制数组内,在更新时替换数组内容

                    // 对其他用户的补间
                    let tempX = somX - data.point.x;
                    let tempY = somY - data.point.y;
                    if (Math.abs(tempX) > tweenInterval || Math.abs(tempY) > tweenInterval || (Math.abs(tempX) > tweenInterval / 2 && Math.abs(tempY) > tweenInterval / 2)) {
                        let tween = Math.abs(tempX) > Math.abs(tempY) ? Math.abs(tempX) / tweenStride : Math.abs(tempY) / tweenStride;
                        let tweenX = tempX / tween,
                            tweenY = tempY / tween;
                        let stepX = tweenX,
                            stepY = tweenY;
                        for (let i = tween - 1; i >= 0; i--) {
                            let point = {
                                offsetX: data.point.x + stepX,
                                offsetY: data.point.y + stepY
                            };
                            stepX += tweenX;
                            stepY += tweenY;
                            ctx.fillStyle = data.point.color;
                            ctx.beginPath();
                            ctx.arc(point.offsetX + (data.point.brushSize / 2), point.offsetY + (data.point.brushSize / 2), data.point.brushSize / 2, 0, 2 * Math.PI);
                            ctx.fill();
                        };
                    };
                    somX = data.point.x;
                    somY = data.point.y;
                };
            };
        });

        // 创建其他用户缩放展示条
        function createZoomBar(data) {
            console.log("其他用户缩放条", data);
            if (data.userId !== localUserId && !document.querySelector("#bar-id" + data.userId)) {
                const zoomEl = document.createElement("div");
                zoomEl.className = "indicator-tag";
                zoomEl.id = `bar-id${data.userId}`;
                const zoomName = document.createElement("p");
                zoomName.className = "tg-name";
                zoomName.innerText = data.name;
                zoomEl.appendChild(zoomName);
                zoomList.appendChild(zoomEl);
            };
        }

        // 删除下线用户缩放条
        function removeZoomBar(data) {
            console.log("删除下线用户缩放条", data);
            const removeEl = document.querySelector(`#bar-id${data.userId}`)
            zoomList.removeChild(removeEl);
        }

        // 创建其他用户笔刷
        function createBursh(data) {
            console.log("其他用户笔刷", data)
            if (data.userId !== localUserId && !document.querySelector("#id" + data.userId)) {
                const playerEl = document.createElement("div");
                playerEl.className = "player-mouse";
                playerEl.id = `id${data.userId}`;
                playerEl.setAttribute("data-brush-x", "0");
                playerEl.setAttribute("data-brush-y", "0");
                playerEl.setAttribute("data-brush-size", "20");
                const userNameEl = document.createElement("p");
                userNameEl.className = "user-name";
                userNameEl.innerText = data.name;
                playerEl.appendChild(userNameEl);
                otherPlayerList.appendChild(playerEl);
            };
        };

        // 删除下线用户笔刷
        function remveUserBrush(data) {
            const removeEl = document.querySelector("#id" + data.userId);
            otherPlayerList.removeChild(removeEl);
        };

        // 删除下线用户
        function removeUser(data) {
            for (let i = 0; i < lockUserList.length; i++) {
                if (lockUserList[i].userId === data.userId) {
                    lockUserList.splice(i, 1);
                };
            };
            initUserList();
            for (let i = 0; i < lockUserList.length; i++) {
                newUserAdd(lockUserList[i]);
            };
        };

        // 初始化用户列表
        function initUserList() {
            let removeEl = document.querySelectorAll(".list-user-name")
            for (let i = 0; i < removeEl.length; i++) {
                onlineList.removeChild(removeEl[i]);
            };
        };

        // 新用户加入
        function newUserAdd(userData) {
            if (!document.querySelector("#listId" + userData.userId)) {
                const userEl = document.createElement("div");
                userEl.className = "user-name list-user-name";
                userEl.id = "listId" + userData.userId;
                userEl.innerText = "id" + userData.userId + " " + userData.name;
                onlineList.appendChild(userEl);
                titalNum.innerText = "当前在线:" + document.querySelectorAll(".list-user-name").length + "人";
            };
        };

        // 登录成功方法
        function loginSuccess() {
            if (!loginStatus) {
                // 初始化本地路径
                if (pathArrList[userId] === undefined) {
                    pathArrList[userId] = new Array();
                }
                loginStatus = true;
                console.log("开始请求登录数据");
                infoText.innerText = "正在加载历史数据,用户列表...";
                // 获取在线用户列表
                socket.emit("getUserList", { cookie: Cookies.get("cookieId") });
                // 获取历史绘制数据
                socket.emit("getHistoricalPath", { cookie: Cookies.get("cookieId") });
                // 获取历史消息
                socket.emit("getHistoricalMessage", { cookie: Cookies.get("cookieId") });
                // 获取重做列表
                socket.emit("getRedoPath", { cookie: Cookies.get("cookieId") });
            };
            loginView.className = "login disable";
        };

        // 判断是否加载完成
        function isloadOk() {
            if (loadOk > 1) {
                infoText.innerText = "数据加载完成.";
                loginView.className = "login disable";
            };
        };

        // cookie登录
        function cookieLogin(cookieId) {
            socket.emit("cookieLogin", {
                cookie: cookieId
            });
        };

        // 检测名称
        function checkName(name) {
            const reg = new RegExp("^([\u4E00-\uFA29]|[\uE7C7-\uE7F3]|[a-zA-Z0-9_]){1,20}$");
            if (checkProhibitedWords(name)) {
                infoText.innerText = "加入绘画";
                if (name.length >= 2) {
                    if (name.length <= 8) {
                        if (reg.test(name)) {
                            return true;
                        } else {
                            infoText.innerText = "含有不允许的字符";
                            return false;
                        };
                    } else {
                        infoText.innerText = "用户名过长";
                        return false;
                    };
                } else if (name.length > 0) {
                    infoText.innerText = "用户名过短";
                    return false;
                } else {
                    infoText.innerText = "加入绘画";
                    return false;
                };
            } else {
                infoText.innerText = "含有屏蔽词";
                return false;
            };
        };

        // 在线检查是否已有此用户名
        function onlineName(name) {
            if (checkName(name)) {
                socket.emit('checkName', {
                    name: name
                });
            };
        };

        // 初始化登录页面
        function initLoginView(viewText) {
            if (viewText) {
                infoText.innerText = viewText;
            };
            userPsw.removeAttribute("disabled");
            userName.removeAttribute("disabled");
            loginBtn.removeAttribute("disabled");
        };

        // 禁用登录页面
        function disableLogin(viewText) {
            if (viewText) {
                infoText.innerText = viewText;
            };
            userPsw.setAttribute("disabled", "disabled");
            userName.setAttribute("disabled", "disabled");
            loginBtn.setAttribute("disabled", "disabled");
        };

        // 系统消息
        function putSystemMsg(msg) {
            const msgEl = document.createElement("span");
            msgEl.className = "system-info";
            msgEl.innerText = msg;
            msgList.appendChild(msgEl);
            msgList.scrollTop = msgList.scrollHeight;
        };

        // 我的消息
        function putUserMsg(userName, msg) {
            const msgEl = document.createElement("span");
            msgEl.className = "msg-text";
            const userNameEl = document.createElement("p");
            userNameEl.className = "user-name";
            userNameEl.innerText = userName;
            const content = document.createElement("p");
            content.className = "content";
            content.innerText = msg;
            msgEl.appendChild(userNameEl);
            msgEl.appendChild(content);
            msgList.appendChild(msgEl);
            msgList.scrollTop = msgList.scrollHeight;
        };

        // 其他用户消息
        function putUsMsg(userName, msg) {
            const msgEl = document.createElement("span");
            msgEl.className = "msg-text your-self";
            const userNameEl = document.createElement("p");
            userNameEl.className = "user-name";
            userNameEl.innerText = userName;
            const content = document.createElement("p");
            content.className = "content";
            content.innerText = msg;
            msgEl.appendChild(userNameEl);
            msgEl.appendChild(content);
            msgList.appendChild(msgEl);
            msgList.scrollTop = msgList.scrollHeight;
        };

        // 登录按钮监听
        loginBtn.addEventListener("click", function() {
            if (checkName(userName.value)) {
                if (userPsw.value.length >= 6) {
                    if (userPsw.value.length <= 16) {
                        if (logOrReg) {
                            if (logOrReg === "login") {
                                disableLogin("正在登录...");
                                socket.emit(logOrReg, {
                                    name: userName.value,
                                    psw: userPsw.value
                                });
                            } else {
                                if (invitationCode.value.length) {
                                    disableLogin("正在注册...");
                                    socket.emit(logOrReg, {
                                        name: userName.value,
                                        psw: userPsw.value,
                                        invitationCode: invitationCode.value
                                    });
                                } else {
                                    initLoginView("请填写邀请码");
                                };
                            };
                        } else {
                            infoText.innerText = "服务器未响应,请尝试刷新页面";
                        };
                    } else {
                        infoText.innerText = "密码过长";
                    };
                } else {
                    infoText.innerText = "密码过短";
                };
            };
        });

        // 监听发送消息按钮
        sendBtn.addEventListener("click", function() {
            let tempInputVal = inputMsg.value;
            if (tempInputVal.length) {
                if (tempInputVal.includes("#disable")) {
                    let disableId = tempInputVal.replace("#disable ", "");
                    disabledPath.push(disableId);
                    putSystemMsg(`已屏蔽${disableId}用户绘制的图案`);
                    drenArr(pathArrList);
                } else if (tempInputVal.includes("#enable")) {
                    let enableId = tempInputVal.replace("#enable ", "");
                    if (disabledPath.indexOf(enableId) !== -1) {
                        disabledPath.splice(disabledPath.indexOf(enableId), 1);
                        drenArr(pathArrList);
                        putSystemMsg(`已解除屏蔽${enableId}用户绘制的图案`);
                    } else {
                        putSystemMsg(`没有在屏蔽列表找到${enableId}`);
                    }
                } else {
                    socket.emit("sendMsg", { cookie: Cookies.get("cookieId"), content: tempInputVal });
                }
                inputMsg.value = "";
            }
        })
    }
    initSockit()
};