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

    // 变量声明
    let pathArrList = []; // 路径数组列表
    let userId = 0; // 本地玩家id
    let disabledPath = []; // 停止绘制id列表
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
    let imageData; // 图片数据
    let minimumThreshold = 0.1; // 最低绘制宽度
    let brushColor = "#ff0000"; // 笔刷颜色
    let dragStart = false;
    let moveStart = false;
    let enableTween = true; // 是否启用补间
    let tweenInterval = 6; // 启用补间的间隔
    let tweenStride = 5; // 补间步幅
    let highPerformanceDrag = false; // 是否启用高性能拖动
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
            if (enableTween && (Math.abs(frameX) > tweenInterval || Math.abs(frameY) > tweenInterval || (Math.abs(frameX) > tweenInterval / 2 && Math.abs(frameY) > tweenInterval / 2))) {
                let tween = Math.abs(frameX) > Math.abs(frameY) ? Math.abs(frameX) / tweenStride : Math.abs(frameY) / tweenStride;
                let tweenX = frameX / tween,
                    tweenY = frameY / tween;
                let stepX = tweenX,
                    stepY = tweenY;
                for (let i = tween - 1; i >= 0; i--) {
                    let point = {
                        offsetX: mouseX + stepX,
                        offsetY: mouseY + stepY
                    };
                    stepX += tweenX;
                    stepY += tweenY;
                    dren(point);
                };
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
        if (pathArrList[userId] === undefined) {
            pathArrList[userId] = []
        }
        pathArrList[userId].push({
            x: (e.offsetX / dZoom - lastX),
            y: (e.offsetY / dZoom - lastY),
            color: brushColor,
            brushSize: (bursh.offsetWidth / 2) / dZoom
        })
        ctx.fillStyle = brushColor;
        ctx.beginPath();
        ctx.arc(e.offsetX / dZoom, e.offsetY / dZoom, (bursh.offsetWidth / 2) / dZoom, 0, 2 * Math.PI);
        ctx.fill();
    }

    // 绘制数组路径
    function drenArr(arr) {
        ctx.clearRect(0, 0, canvas.width / dZoom, canvas.height / dZoom);
        // 绘制数组内数据
        for (let j = 0; j < arr.length; j++) {
            if (disabledPath.indexOf(j) === -1) { // 停止绘制选中id的用户内容
                for (let i = 0; i < arr[j].length; i++) {
                    ctx.beginPath();
                    // 如果缩放后笔刷粗细小于阈值则不绘制
                    if (arr[j][i].brushSize * dZoom > minimumThreshold) {
                        ctx.fillStyle = arr[j][i].color;
                        ctx.arc((arr[j][i].x + lastX), (arr[j][i].y + lastY), arr[j][i].brushSize, 0, 2 * Math.PI);
                    }
                    ctx.fill();
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
        }
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
            const floatX = e.offsetX - burshSizeSlider.offsetWidth / 2,
                sliderW = floatX + 28;
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

        // 初始笔刷颜色
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