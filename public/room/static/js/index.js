"use strict"

// 取消浏览器默认右键菜单
window.oncontextmenu = function(e) {
    e.preventDefault();
};

window.onload = function() {
    // 初始化色块
    initColorBlock();
    // 初始化画布
    initCanvas();
};

// 初始化画布
function initCanvas() {
    // 通信库
    const socket = io();
    // 主要操作元素
    const canvas = document.querySelector("#canvas"); // 画布
    const ctx = canvas.getContext("2d"); // canvas2d对象
    const menuLayer = document.querySelector(".menus"); // 菜单
    const fullImfo = document.querySelector(".wating-service"); // 等待服务器响应界面
    const userName = document.querySelector(".input-user-name"); // 输入用户名
    const userPsw = document.querySelector(".input-user-psw"); // 输入密码
    const loginView = document.querySelector(".login"); // 登录界面
    const titalNum = document.querySelector(".total-num"); // 总人数
    const onlineList = document.querySelector(".online-list"); // 在线列表
    const msgList = document.querySelector(".top-msg-list"); // 消息列表
    const zoomList = document.querySelector(".right-zoom-indicator"); // 右侧缩放条
    const msgBox = document.querySelector(".omMsg"); // 消息模块
    const onlineEl = document.querySelector(".online"); // 总人数展示
    const leftMenu = document.querySelector(".left-menu"); // 左侧笔刷菜单
    // 配置项
    let runTime = new Date().getTime(); // 运行时钟
    let loadOk = 0; // 历史数据加载状态

    let pathArrList = {}; // 路径数组列表
    let tempPathArr = {}; // 临时绘制路径
    let withdrawArr = []; // 本地撤回记录
    let disabledPath = []; // 本地禁用id列表

    let localUser; // 本地玩家对象

    let loaclUserName = null; // 本地玩家名称
    let playerList = []; // 其他用户列表

    let moveMouse = false; // 增加节流算法,同步用户间的差异
    let moveObj = {
        x: 0,
        y: 0
    }; // 用户鼠标坐标对象

    let canvasBGC = "#d9d9d9"; // 画布背景色

    let lastX = 0, // 当前位置
        lastY = 0;

    let beforeX = 0,
        beforeY = 0; // 上一步位置

    let moveX = 0,
        moveY = 0;
    let tempX = 0, // 临时坐标
        tempY = 0;
    let brushX = 0, // 笔刷原始坐标
        brushY = 0;

    let zoom = 1.1, // 缩放步幅
        dZoom = 1, // 初始缩放值
        maxZoom = 150, // 缩放限制
        minZoom = -150;

    let mouseX = 0, // 鼠标位置
        mouseY = 0;

    let imageData; // 图片数据
    let brushColor = "#000000"; // 笔刷颜色
    let dragStart = false;
    let moveStart = false;
    let loginStatus = false; // 登录状态
    let brushMinSize = 5; // 笔刷最小直径
    let brushMaxSize = 120; // 笔刷最大直径
    let brushDefaultSize = 20; // 初始笔刷直径
    let zoomVal = 0; // 记录缩放倍率
    let f1Num = 0; // 切换ui展示状态保存值
    // 宽度变化监听
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.scale(dZoom, dZoom);
        drenArr(pathArrList);
    };
    // 初始化大小
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 用户构造函数
    const Player = class {
        // 用户对象,目标元素
        constructor(data, target) {
            this.name = data.name;
            this.id = data.id;
            this.isOnline = data.isOnline || false;
            this.pontX = 0;
            this.pontY = 0;
            this.zoom = 1;
            this.brush = {
                size: 20,
                color: "#ffffff"
            };
            this.element = {};
        }
        create() {
            this.element.userItem = document.createElement("div");
            this.element.userItem.className = "user-name list-user-name";
            this.element.userItem.id = "listId" + this.id;
            this.element.userItem.innerText = this.id + " " + this.name;
            document.querySelector(".online-list").appendChild(this.element.userItem);
            if (this.isOnline) {
                this.online();
            };
        }
        online() {
            this.element.userNameEl = document.createElement("p");
            this.element.userNameEl.className = "user-name";
            this.element.userNameEl.innerText = this.name;
            this.element.userBrush = document.createElement("div");
            this.element.userBrush.className = "player-mouse";
            this.element.userBrush.appendChild(this.element.userNameEl);
            this.element.zoomName = document.createElement("p");
            this.element.zoomName.innerText = this.name;
            this.element.zoomName.className = "tg-name";
            this.element.zoomEl = document.createElement("div");
            this.element.zoomEl.className = "indicator-tag";
            this.element.zoomEl.appendChild(this.element.zoomName);
            document.querySelector(".right-zoom-indicator").appendChild(this.element.zoomEl)
            document.querySelector(".user-mouse").appendChild(this.element.userBrush);
            this.brushSize(this.brush.size);
            this.isOnline = true;
            this.element.userItem.className = "user-name list-user-name isonline";
        }
        offline() {
            document.querySelector(".right-zoom-indicator").removeChild(this.element.zoomEl)
            document.querySelector(".user-mouse").removeChild(this.element.userBrush);
            this.isOnline = false;
            this.element.userItem.className = "user-name list-user-name";
        }
        move(x, y) {
            this.element.userBrush.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
        }
        brushSize(size) {
            this.element.userBrush.style.width = `${size}px`;
            this.element.userBrush.style.height = `${size}px`;
        }
        brushColor(color) {
            this.brush.color = color;
            this.element.userBrush.style.backgroundColor = `${color}6b`;
            this.element.zoomEl.style.backgroundColor = `${color}6b`;
        }
        zoomValue(zoomVal) {
            this.element.zoomEl.style.top = `calc(${zoomVal}% - ${this.element.zoomEl.offsetHeight * (zoomVal/100)}px)`;
        }
        update(data) {
            this.brush.size = data.brushSize;
            this.brush.color = data.color;
            this.zoom = data.zoom;
            this.pontX = data.x;
            this.pontY = data.y;
        }
    }

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
                        zoomList.style.display = "none";
                        break;
                    case 4:
                        leftMenu.style.display = "none";
                        break;
                    case 5:
                        msgBox.style.display = "";
                        onlineEl.style.display = "";
                        zoomList.style.display = "";
                        leftMenu.style.display = "";
                        f1Num = 0;
                        break;
                };
                break;
            case 119:
                downloadImage();
                break;
            case 13:
                document.querySelector(".send-msg").click();
                break;
        };
        if (e.ctrlKey == true && e.keyCode == 90) {
            e.preventDefault();
            withdraw();
            console.log("撤回指令");
        };
        if (e.ctrlKey == true && e.keyCode == 89) {
            e.preventDefault();
            redo();
            console.log("重做指令");
        };
        if (e.ctrlKey == true && e.keyCode == 83) {
            e.preventDefault();
            downloadImage();
            console.log("保存指令");
        };
    });

    // 保存画布
    function downloadImage() {
        event.preventDefault();
        let dataUrl = canvas.toDataURL("image/png");
        let tempA = document.createElement("a");
        tempA.setAttribute("href", dataUrl);
        tempA.setAttribute("download", "downImg");
        tempA.click();
    };

    // 撤回操作
    function withdraw() {
        if (pathArrList[localUser.id].length) {
            let withdrawPath = pathArrList[localUser.id].pop();
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
            let redoPath = withdrawArr.pop();
            pathArrList[localUser.id].push(redoPath);
            socket.emit("redo", { cookie: Cookies.get("cookieId"), time: redoPath[0].time });
            drenArr(pathArrList);
        } else {
            console.log("没有能重做的步数了");
        };
    };

    // 监听笔刷位置
    canvas.addEventListener("mousedown", function(e) {
        if (!tempPathArr[localUser.id]) {
            tempPathArr[localUser.id] = new Array();
        };
        // 清除重做步数
        if (withdrawArr.length) {
            withdrawArr = new Array();
        };
        if (e.buttons === 1) {
            dragStart = true;
            beforeX = e.offsetX;
            beforeY = e.offsetY;
            dren(e);
        } else if (e.buttons === 2) {
            drenArr(pathArrList);
            tempX = e.offsetX;
            tempY = e.offsetY;
            moveStart = true;
            canvas.className = "move";
            localUser.element.userBrush.className = "player-mouse move";
        } else {
            dragStart = false;
        };
        emitData();
    });
    canvas.addEventListener("mouseup", function(e) {
        dragStart = false;
        moveStart = false;
        canvas.className = "";
        localUser.element.userBrush.className = "player-mouse";
        if (localUser.id) {
            if (tempPathArr[localUser.id].length) {
                pathArrList[localUser.id].push(tempPathArr[localUser.id]);
                tempPathArr[localUser.id] = [];
            }
        } else {
            console.error("未登录,或登录过期");
        };
        drenArr(pathArrList);
        emitData();
    });
    canvas.addEventListener("mousemove", function(e) {
        moveMouse = true;
        moveObj = e;

        // 笔刷位置
        brushX = e.offsetX - localUser.brush.size / 2;
        brushY = e.offsetY - localUser.brush.size / 2;
        localUser.move(brushX, brushY)
    });

    // 增加节流算法,同步用户间的差异
    function throttling() {
        // 页面统一时钟
        runTime = new Date().getTime();
        if (moveMouse) {
            moveMouse = false;
            mouseX = moveObj.offsetX;
            mouseY = moveObj.offsetY;
            if (dragStart) {
                menuLayer.className = "menus poe";
                // 画直线用
                dren(moveObj);
            } else {
                menuLayer.className = "menus";
            };
            if (moveStart) {
                menuLayer.className = "menus poe";
                moveCanvas(moveObj);
            };
            emitData();
        };

        beforeX = moveObj.offsetX;
        beforeY = moveObj.offsetY;
        // 稳定鼠标捕获率在60帧
        setTimeout(function() {
            throttling();
        }, 16.7);
    };
    throttling();

    // 临时线条-绘制方法
    function dren(e) {
        if (!tempPathArr[localUser.id].length) {
            tempPathArr[localUser.id].push({
                x: (e.offsetX / dZoom - lastX),
                y: (e.offsetY / dZoom - lastY),
                color: brushColor,
                brushSize: localUser.brush.size / dZoom,
                time: runTime
            })
        } else {
            tempPathArr[localUser.id].push({
                x: (e.offsetX / dZoom - lastX),
                y: (e.offsetY / dZoom - lastY),
            })
        }
        // 绘制线条
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = localUser.brush.size / dZoom;
        ctx.strokeStyle = brushColor;
        ctx.moveTo(beforeX / dZoom, beforeY / dZoom);
        ctx.lineTo(e.offsetX / dZoom, e.offsetY / dZoom);
        ctx.stroke();
        ctx.closePath();
    }

    // 绘制数组路径
    function drenArr(arr) {
        ctx.clearRect(0, 0, canvas.width / dZoom, canvas.height / dZoom);
        ctx.fillStyle = canvasBGC;
        ctx.fillRect(0, 0, canvas.width / dZoom, canvas.height / dZoom)
        ctx.fill();
        let pathArr = [];
        // 循环用户数组
        for (let userId in arr) {
            // 检测是否屏蔽该用户
            if (disabledPath.indexOf(userId) === -1) {
                // 循环该用户的所有路径
                for (let path = 0; path < arr[userId].length; path++) {
                    if (arr[userId][path]) {
                        // 获取所有的路径
                        pathArr.push(arr[userId][path]);
                    };
                };
            };
        };
        // 根据路径创建时间排序
        pathArr.sort(function(a, b) {
            return a[0].time - b[0].time;
        });
        // 绘制所有路径
        for (let path = 0; path < pathArr.length; path++) {
            // 开始绘制路径
            // 判断是否已缓存路径
            if (pathArr[path][0].imageData) {

            } else {
                // 如果路径点少于阈值,使用点绘制,否则根据配置选择点绘制还是线绘制
                if (pathArr[path].length > 2) {
                    // 判断绘制方法
                    ctx.beginPath();
                    ctx.lineCap = "round";
                    ctx.lineWidth = pathArr[path][0].brushSize;
                    ctx.strokeStyle = pathArr[path][0].color;
                    let points = pathArr[path];
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
                        ctx.arc((pathArr[path][point].x + lastX), (pathArr[path][point].y + lastY), pathArr[path][0].brushSize / 2, 0, 2 * Math.PI);
                        ctx.fill();
                    };
                };
            }
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
        drenArr(pathArrList);
        refreshPlayer();
    };

    // 转换坐标点为贝塞尔控制点 (借鉴代码,有bug,可能返回NaN)
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

    // 向服务器发送信息
    function emitData() {
        const mouseData = {
            x: (brushX / dZoom - lastX),
            y: (brushY / dZoom - lastY),
            brushSize: localUser.brush.size / dZoom,
            drag: dragStart,
            color: brushColor,
            zoomSize: zoomVal
        }
        socket.emit("pointMove", { point: mouseData, cookie: Cookies.get("cookieId"), time: runTime });
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
            localUser.zoomValue(50 - (proportion / 2));
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

    // 刷新其他用户数据[待重写]
    function refreshPlayer() {
        for (let i = 0; i < playerList.length; i++) {
            let newSize = playerList[i].brush.size * dZoom;
            playerList[i].brushSize(newSize)
            let newX = (playerList[i].pontX + lastX) * dZoom;
            let newY = (playerList[i].pontY + lastY) * dZoom;
            playerList[i].move(newX, newY);
        }
    }

    // 笔刷菜单功能
    function brushMenu() {
        const brushSize = document.querySelector(".brush-size-range");
        const colorBox = document.querySelectorAll(".color-box");
        const colorInput = document.querySelector(".input-color");
        const selectColor = document.querySelector(".color-view");
        let clickSlider = false;

        // 初始化笔刷控制器
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
            localUser.brushSize(brushSize.value);
            localUser.brush.size = brushSize.value
            brushSize.setAttribute("title", "当前笔刷大小" + brushSize.value + "px");
            emitData();
        })
        // 监听调色盘
        onRangeChange(selectColor, function(e) {
            document.querySelector(".color-box.select").style.backgroundColor = selectColor.value;
            brushColor = selectColor.value;
            selectColor.style.backgroundColor = selectColor.value;
            colorInput.setAttribute("placeholder", selectColor.value);
            localUser.brushColor(brushColor)
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
                    localUser.brushColor(brushColor)
                    emitData();
                };
            });
        });

        // 初始化笔刷颜色
        function initBrushColor() {
            const el = document.querySelector(".color-box.select");
            brushColor = el.getAttribute("title");
            colorInput.setAttribute("placeholder", brushColor);
            colorInput.value = "";
            selectColor.style.backgroundColor = brushColor;
            selectColor.value = brushColor;
            localUser.brushColor(brushColor);
        };
        initBrushColor()

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
                loaclUserName = data.name;
                loginSuccess(data);
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
                loaclUserName = data.name;
                loginSuccess(data);
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
            console.log("用户进入画布", data);
            if (loginStatus) {
                let isExisted = checkUser(data);
                if (isExisted !== false) {
                    console.log("重新上线")
                    // 重新上线的用户肯定是已经初始化了数组的
                    playerList[isExisted].online();
                } else {
                    console.log("新加入画布", data)
                    let userNum = playerList.length
                    playerList[userNum] = new Player(data);
                    playerList[userNum].create();
                    console.log(playerList)
                    // 初始化用户临时路径数组
                    tempPathArr[data.id] = new Array();
                    // 初始化用户路径数组
                    pathArrList[data.id] = new Array();
                }
            }
        });

        // 用户下线监听
        socket.on("userDisconnect", function(data) {
            if (loginStatus) {
                console.log("用户下线", data);
                for (let i = 0; i < playerList.length; i++) {
                    if (playerList[i].id === data.id) {
                        playerList[i].offline();
                    }
                }
            }
        });

        // 接收用户列表
        socket.on("returnUserList", function(data) {
            console.log("接收到用户列表", data);
            for (let i = 0; i < data.length; i++) {
                // 剔除本地用户
                if (data[i].id !== localUser.id) {
                    let userNum = playerList.length
                    playerList[userNum] = new Player(data[i]);
                    playerList[userNum].create();
                    // 初始化用户临时路径数组
                    tempPathArr[data[i].id] = new Array();
                    // 初始化用户路径数组
                    pathArrList[data[i].id] = new Array();
                }
            }
        });

        // 返回历史消息
        socket.on("returnHistoricalMessage", function(data) {
            console.log("接收到历史消息列表", data);
            for (let i = 0; i < data.length; i++) {
                if (data[i].type === 1) { // 1为系统消息
                    putSystemMsg(data[i].content);
                } else if (data[i].type === 0) { // 0为用户消息
                    if (data[i].userId === localUser.id) {
                        putUsMsg(data[i].userName, data[i].content);
                    } else {
                        putUserMsg(data[i].userName, data[i].content);
                    };
                };
            };
            putSystemMsg(`----------------/help 查看帮助----------------`);
        });

        // 返回历史路径信息
        socket.on("returnHistoricalPath", function(data) {
            console.log("接收到历史路径信息", data);
            for (let i = 0; i < data.length; i++) {
                let playerId = data[i].id;
                if (pathArrList[playerId] === undefined) {
                    pathArrList[playerId] = new Array();
                }
                pathArrList[playerId].push(data[i].path)
            }
            drenArr(pathArrList)
        })

        // 新消息接收
        socket.on("newMessage", function(data) {
            if (loginStatus) {
                if (data.type === 1) { // 1为系统消息
                    putSystemMsg(data.content);
                } else if (data.type === 0) { // 0为用户消息
                    if (data.userId === localUser.id) {
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
            pathArrList[data.userId].pop();
            drenArr(pathArrList);
        })

        // 其他用户的重做操作
        socket.on("userRedo", function(data) {
            console.log("其他用户的重做操作", data)
            pathArrList[data.userId].push(data.path);
            drenArr(pathArrList);
        })

        // 接收其他用户的坐标信息
        let somX, somY, playrDrag = false;
        socket.on("otherPlayer", function(data) {
            const playerbrush = document.querySelector(`#id${data.userId}`);
            const zoomEl = document.querySelector(`#bar-id${data.userId}`);
            let zoomPercentage = data.point.zoomSize / maxZoom * 100;
            let zoomVal = 50 - (zoomPercentage / 2)
            let userIndex = checkUser(data)
            // 检测当前列表是否有此用户
            if (userIndex !== false) {
                // 判断是否在线
                if (playerList[userIndex].isOnline) {
                    // 将接收到的数据反馈到用户实例上
                    if (playerList[userIndex].zoom !== zoomVal) {
                        playerList[userIndex].zoomValue(zoomVal);
                    };
                    let brushSize = data.point.brushSize * dZoom;
                    if (playerList[userIndex].brush.size !== brushSize) {
                        playerList[userIndex].brushSize(brushSize)
                    };
                    if (playerList[userIndex].brush.color !== data.point.color) {
                        playerList[userIndex].brushColor(data.point.color)
                    }
                    let moveX = (data.point.x + lastX) * dZoom;
                    let moveY = (data.point.y + lastY) * dZoom;
                    playerList[userIndex].move(moveX, moveY);
                    let updateData = data.point;
                    updateData.zoom = zoomVal;
                    playerList[userIndex].update(updateData);

                    // 缓存路径信息
                    if (data.point.drag) {
                        if (!tempPathArr[data.id].length) {
                            tempPathArr[data.id].push({
                                x: data.point.x + (data.point.brushSize / 2),
                                y: data.point.y + (data.point.brushSize / 2),
                                color: data.point.color,
                                brushSize: data.point.brushSize,
                                time: data.time
                            })
                        } else {
                            tempPathArr[data.id].push({
                                x: data.point.x + (data.point.brushSize / 2),
                                y: data.point.y + (data.point.brushSize / 2)
                            })
                        }
                    } else if (tempPathArr[data.id].length) {
                        pathArrList[data.id].push(tempPathArr[data.id]);
                        tempPathArr[data.id] = new Array();
                        drenArr(pathArrList);
                    }

                    // 绘制临时路径
                    if (!data.point.drag && playrDrag) {
                        playrDrag = false;
                    };
                    if (data.point.drag) {
                        if (!playrDrag) {
                            playrDrag = true;
                            somX = data.point.x;
                            somY = data.point.y;
                        };
                        ctx.beginPath();
                        ctx.lineCap = "round";
                        ctx.lineWidth = data.point.brushSize;
                        ctx.strokeStyle = data.point.color;
                        ctx.moveTo(lastX + somX + (data.point.brushSize / 2), lastY + somY + (data.point.brushSize / 2));
                        ctx.lineTo(lastX + data.point.x + (data.point.brushSize / 2), lastY + data.point.y + (data.point.brushSize / 2));
                        ctx.stroke();
                        ctx.closePath();
                        somX = data.point.x;
                        somY = data.point.y;
                    };
                }
            }
        });

        // 判断用户实例是否创建
        function checkUser(data) {
            for (let i = 0; i < playerList.length; i++) {
                if (playerList[i].id === data.id) {
                    return i;
                };
            };
            return false;
        };

        // 登录成功方法
        function loginSuccess(data) {
            if (!loginStatus) {
                localUser = new Player(data);
                localUser.create();
                // 初始化本地路径
                if (pathArrList[localUser.id] === undefined) {
                    pathArrList[localUser.id] = new Array();
                    console.log(pathArrList)
                }
                // 初始化笔刷菜单
                brushMenu();
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

        let timeOut
        // 在线检查是否已有此用户名
        function onlineName(name) {
            if (checkName(name)) {
                clearTimeout(timeOut);
                timeOut = setTimeout(function() {
                    socket.emit('checkName', {
                        name: name
                    });
                }, 300);
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
            const userNameEl = document.createElement("p");
            const content = document.createElement("p");
            msgEl.className = "msg-text";
            userNameEl.className = "user-name";
            userNameEl.innerText = userName;
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
            const userNameEl = document.createElement("p");
            const content = document.createElement("p");
            userNameEl.className = "user-name";
            userNameEl.innerText = userName;
            content.className = "content";
            content.innerText = msg;
            msgEl.className = "msg-text your-self";
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
            let reg = new RegExp('^/')
            if (tempInputVal.length) {
                // 判断是不是命令
                if (reg.test(tempInputVal)) {
                    if (/^\/disable/.test(tempInputVal)) {
                        let str2arr = tempInputVal.split(" ");
                        if (str2arr.length === 2) {
                            disabledPath.push(str2arr[1]);
                            putSystemMsg(`已屏蔽 id${str2arr[1]} 绘制的内容`);
                            drenArr(pathArrList);
                        } else {
                            putSystemMsg(`命令或参数错误`);
                        }
                    } else if (/^\/enable/.test(tempInputVal)) {
                        let str2arr = tempInputVal.split(" ");
                        if (str2arr.length === 2) {
                            if (disabledPath.indexOf(str2arr[1]) !== -1) {
                                disabledPath.splice(disabledPath.indexOf(str2arr[1]), 1);
                                drenArr(pathArrList);
                                putSystemMsg(`已解除屏蔽 id${str2arr[1]} 绘制的内容`);
                            } else {
                                putSystemMsg(`没有在屏蔽列表找到 id${str2arr[1]}`);
                            }
                        } else {
                            putSystemMsg(`命令或参数错误`);
                        }
                    } else if (/^\/help/.test(tempInputVal)) {
                        putSystemMsg(`操作介绍`);
                        putSystemMsg(`左键绘制,右键拖动,滚轮缩放`);
                        putSystemMsg(`鼠标放置在"在线人数"上可显示用户id和在线列表`);
                        putSystemMsg(`输入/disable 他人id 可以屏蔽此id绘制的内容`);
                        putSystemMsg(`输入/enable 他人id 可以解禁此id绘制的内容`);
                        putSystemMsg(`例如,禁用id1的用户 /disable 1`);
                        putSystemMsg(`快捷键,f7切换ui展示,ctrl + s/f8保存当前视图`);
                    } else {
                        putSystemMsg(`命令错误`);
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

let prohibitedWords = ["测试"]; // 违禁词列表
// 检查违禁词
function checkProhibitedWords(name) {
    for (let i = 0; i < prohibitedWords.length; i++) {
        if (name.includes(prohibitedWords[i])) {
            return false;
        };
    };
    return true;
}

// 初始化色块
function initColorBlock() {
    const colorArr = [
        "#ec6841",
        "#f19149",
        "#f7b551",
        "#fff45c",
        "#b3d465",
        "#7fc269",
        "#31b16c",
        "#12b4b1",
        "#448ac9",
        "#556fb5",
        "#5f52a0",
        "#8957a1",
        "#ad5da1",
        "#ea68a2",
        "#000000",
        "#d9d9d9"
    ];
    const blockNum = colorArr.length >= 32 ? colorArr.length : 32;
    const selectColorBox = document.querySelector(".top-select-color");
    for (let i = 0; i < blockNum; i++) {
        const colorValue = colorArr[i] || "#ffffff";
        const colorEl = document.createElement("div");
        colorEl.setAttribute("title", colorValue);
        colorEl.setAttribute("style", "background-color: " + colorValue + ";");
        colorEl.className = "color-box";
        if (i === 0) {
            colorEl.className = "color-box select";
        };
        selectColorBox.appendChild(colorEl);
    };
};