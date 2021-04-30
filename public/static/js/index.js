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
    // 主要操作元素
    const canvas = document.querySelector("#canvas");
    const bursh = document.querySelector("#brush");
    const ctx = canvas.getContext("2d");
    const menuLayer = document.querySelector(".menus");

    // 配置项
    let pathArrList = []; // 路径数组列表
    let tempPathArr = []; // 临时绘制路径
    let disabledPath = []; // 停止绘制id列表
    let userId = 0; // 本地玩家id
    let lastX = 0, // 当前位置
        lastY = 0;
    let moveX = 0,
        moveY = 0;
    let tempX = 0, // 临时坐标
        tempY = 0;
    let zoom = 1.1, // 缩放步幅
        dZoom = 1; // 初始缩放值
    let mouseX = 0, // 鼠标位置
        mouseY = 0;
    let transX = 0, // 计算补间用
        transY = 0;
    let hipX = 0, // 高性能移动坐标
        hipY = 0;
    let drowLine = true; // 更改绘制模式为线条
    let imageData; // 图片数据
    let minimumThreshold = 0.1; // 画布最低绘制宽度
    let brushColor = "#000000"; // 笔刷颜色
    let dragStart = false;
    let moveStart = false;
    let enableTween = true; // 是否启用补间
    let autoInterval = true; // 根据当前笔刷大小自动计算补间间隔,开启时"tweenInterval","tweenStride"将无效
    let tweenInterval = 6; // 启用补间的间隔
    let tweenStride = 5; // 补间步幅
    let highPerformanceDrag = false; // 是否启用高性能拖动
    let brushMinSize = 5; // 笔刷最小直径
    let brushDefaultSize = 20; // 初始笔刷直径
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

    // 监听笔刷位置
    canvas.addEventListener("mousedown", function(e) {
        if (e.buttons === 1) {
            transX = e.offsetX;
            transY = e.offsetY;
            dragStart = true;
            dren(e);
        } else if (e.buttons === 2) {
            if (highPerformanceDrag) {
                hipX = 0;
                hipY = 0;
            }
            drenArr(pathArrList)
            tempX = e.offsetX
            tempY = e.offsetY
            moveStart = true;
        } else {
            dragStart = false;
        };
    });
    canvas.addEventListener("mouseup", function(e) {
        dragStart = false;
        moveStart = false;
        if (highPerformanceDrag) {
            drenArr(pathArrList)
        }
        if (pathArrList[userId] === undefined) {
            pathArrList[userId] = new Array();
        }
        if (tempPathArr.length) {
            console.log(!(tempPathArr.length % 3), tempPathArr.length)
            if (!(tempPathArr.length % 2)) {
                let lastPoint = tempPathArr[tempPathArr.length - 1];
                tempPathArr.push({
                    x: lastPoint.x,
                    y: lastPoint.y,
                    color: lastPoint.color,
                    brushSize: lastPoint.brushSize
                });
            }
            pathArrList[userId].push(tempPathArr);
            tempPathArr = [];
        }
        console.log(pathArrList)
    });
    canvas.addEventListener("mousemove", function(e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        let burshX = mouseX - bursh.offsetWidth / 2,
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
                }
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
                }
            };
            transX = mouseX;
            transY = mouseY;
            dren(e);
        } else {
            menuLayer.className = "menus";
        };
        if (moveStart) {
            moveCanvas(e);
        };
    });

    // 绘制方法
    function dren(e) {
        if (!e.tween) {
            tempPathArr.push({
                x: (e.offsetX / dZoom - lastX),
                y: (e.offsetY / dZoom - lastY),
                color: brushColor,
                brushSize: bursh.offsetWidth / dZoom,
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
        ctx.clearRect(0, 0, canvas.width / dZoom, canvas.height / dZoom);
        // 循环用户数组
        for (let userId = 0; userId < arr.length; userId++) {
            // 判断是否渲染该用户的数据
            if (disabledPath.indexOf(userId) === -1) {
                // 循环该用户的所有路径
                for (let path = 0; path < arr[userId].length; path++) {
                    // 开始绘制路径
                    if (arr[userId][path].length > 1) {
                        // 判断绘制方法
                        if (drowLine) {
                            ctx.beginPath();
                            ctx.lineCap = "round";
                            ctx.lineWidth = arr[userId][path][0].brushSize;
                            // ctx.lineWidth = 1;
                            ctx.strokeStyle = arr[userId][path][0].color;

                            // 新的贝塞尔曲线绘制方法
                            let besselPoints = getBessel(arr[userId][path]);
                            let points = arr[userId][path];
                            let int = 0;
                            for (let i = 0; i < points.length; i++) {
                                if (i == 0) {
                                    ctx.moveTo(points[0].x, points[0].y);
                                    ctx.quadraticCurveTo(besselPoints[0].x, besselPoints[0].y, points[1].x, points[1].y);
                                    int = int + 1;
                                } else if (i < points.length - 2) {
                                    ctx.moveTo(points[i].x, points[i].y);
                                    ctx.bezierCurveTo(besselPoints[int].x, besselPoints[int].y, besselPoints[int + 1].x, besselPoints[int + 1].y, points[i + 1].x, points[i + 1].y);
                                    int += 2;
                                } else if (i == points.length - 2) {
                                    ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
                                    ctx.quadraticCurveTo(besselPoints[besselPoints.length - 1].x, besselPoints[besselPoints.length - 1].y, points[points.length - 1].x, points[points.length - 1].y);
                                }
                            }
                            
                            ctx.stroke();

                            // 测试代码,绘制每个坐标点
                            for (let point = 0; point < arr[userId][path].length; point++) {
                                // 如果缩放后笔刷粗细小于阈值则不绘制以提升性能
                                if (arr[userId][path][point].brushSize * dZoom > minimumThreshold && !arr[userId][path][point].tween) {
                                    ctx.beginPath();
                                    ctx.fillStyle = "rgba(0,0,0,0.5)";
                                    ctx.arc((arr[userId][path][point].x + lastX), (arr[userId][path][point].y + lastY), arr[userId][path][point].brushSize / 2, 0, 2 * Math.PI);
                                    ctx.fill();
                                }
                            }

                        } else {
                            for (let point = 0; point < arr[userId][path].length; point++) {
                                // 如果缩放后笔刷粗细小于阈值则不绘制以提升性能
                                if (arr[userId][path][point].brushSize * dZoom > minimumThreshold) {
                                    ctx.beginPath();
                                    ctx.fillStyle = arr[userId][path][point].color;
                                    ctx.arc((arr[userId][path][point].x + lastX), (arr[userId][path][point].y + lastY), arr[userId][path][point].brushSize / 2, 0, 2 * Math.PI);
                                    ctx.fill();
                                }
                            }
                        }
                    } else {
                        ctx.beginPath();
                        ctx.fillStyle = arr[userId][path][0].color;
                        ctx.arc((arr[userId][path][0].x + lastX), (arr[userId][path][0].y + lastY), arr[userId][path][0].brushSize / 2, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }
        }
        if (highPerformanceDrag) {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        }
    }

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
        };
    };

    // 转换坐标点为贝塞尔控制点
    function getBessel(arr) {
        let Vector2 = function(x, y) {
            this.x = x;
            this.y = y;
        };
        Vector2.prototype = {
            "length": function() {
                return Math.sqrt(this.x * this.x + this.y * this.y);
            },
            "normalize": function() {
                var inv = 1 / this.length();
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

    // 高性能移动
    function moveImage() {
        ctx.clearRect(0, 0, canvas.width / dZoom, canvas.height / dZoom);
        ctx.putImageData(imageData, hipX, hipY)
    }

    // 鼠标滚轮监听
    canvas.addEventListener('mousewheel', function(e) {
        let delta = e.deltaY / 90
        zoomFun(-delta);
    }, false);

    // 缩放方法
    function zoomFun(delta) {
        if (dZoom <= 95800000000000 || delta < 0) {
            if (dZoom >= 1.1121848566736637e-35 || delta > 0) {
                let zooms = Math.pow(zoom, delta);
                ctx.scale(zooms, zooms);
                let afterW = canvas.width * dZoom,
                    afterH = canvas.height * dZoom;
                dZoom = dZoom * zooms;
                let beforeW = canvas.width * dZoom,
                    beforeH = canvas.height * dZoom;
                lastX = lastX + ((mouseX / afterW) * (afterW - beforeW)) / dZoom;
                lastY = lastY + ((mouseY / afterH) * (afterH - beforeH)) / dZoom;
                drenArr(pathArrList);
            } else {
                console.log("最小值")
            }
        } else {
            console.log("最大值")
        }
    }

    // 笔刷菜单功能
    function brushMenu() {
        const brushSize = document.querySelector(".brush-size");
        const burshSizeSlider = document.querySelector(".slider");
        const colorBox = document.querySelectorAll(".color-box");
        const colorInput = document.querySelector(".input-color");
        const selectColor = document.querySelector(".color-view");
        let clickSlider = false;

        // 初始化笔刷直径
        bursh.style.width = brushDefaultSize + "px";
        bursh.style.height = brushDefaultSize + "px";
        burshSizeSlider.style.transform = "translate3d(" + brushDefaultSize + "px, -50%, 0px)";
        burshSizeSlider.setAttribute("data-value", brushDefaultSize);


        brushSize.addEventListener("mousedown", function(e) {
            if (e.buttons === 1) {
                clickSlider = true;
                moveSlider(e);
            } else {
                clickSlider = false;
            };
        });
        brushSize.addEventListener("mouseup", function(e) {
            clickSlider = false;
        });
        brushSize.addEventListener("mouseout", function() {
            clickSlider = false;
        })
        brushSize.addEventListener("mousemove", function(e) {
            if (clickSlider) {
                moveSlider(e);
            };
        });

        function moveSlider(e) {
            let floatX = e.offsetX - burshSizeSlider.offsetWidth / 2;
            if (floatX > brushSize.offsetWidth - burshSizeSlider.offsetWidth) {
                floatX = brushSize.offsetWidth - burshSizeSlider.offsetWidth;
            } else if (floatX < 0) {
                floatX = 0;
            };
            const sliderW = floatX + brushMinSize;
            burshSizeSlider.style.transform = "translate3d(" + floatX + "px, -50%, 0px)";
            burshSizeSlider.setAttribute("data-value", sliderW);
            bursh.style.width = sliderW + "px";
            bursh.style.height = sliderW + "px";
        }

        // 绑定色块点击事件
        colorBox.forEach((el, index) => {
            el.addEventListener("click", function() {
                if (this.className.indexOf("select") === -1) {
                    cleanSelect();
                    this.setAttribute("class", "color-box select");
                    brushColor = this.getAttribute("title");
                    colorInput.setAttribute("placeholder", brushColor);
                    colorInput.value = "";
                    selectColor.setAttribute("style", "background-color: " + brushColor + ";");
                };
            });
        });

        function getBrushColor() {
            colorBox.forEach((el, index) => {
                if (el.className.indexOf("select") !== -1) {
                    brushColor = el.getAttribute("title");
                    colorInput.setAttribute("placeholder", brushColor);
                    colorInput.value = "";
                    selectColor.setAttribute("style", "background-color: " + brushColor + ";")
                };
            });
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
            const hexReg = new RegExp(/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i);
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
                    el.setAttribute("style", "background-color: " + hex + ";");
                    brushColor = el.getAttribute("title");
                    colorInput.setAttribute("placeholder", brushColor);
                    selectColor.setAttribute("style", "background-color: " + brushColor + ";")
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
};

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
        "#000000"
    ];
    const blockNum = colorArr.length >= 24 ? colorArr.length : 32;
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