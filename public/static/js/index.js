var zoom = 100000,
    dZoom = 0

function z(num) {
    zoom = num
}

//取消默认的浏览器自带右键
window.oncontextmenu = function(e) {
    e.preventDefault();
}

window.onload = function() {
    // 计算画布大小
    var canvas = document.querySelector("#canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // 初始化画布
    initCanvas();
    // 设置菜单
    // brushSettingMenu();
};

// 初始化画布
function initCanvas() {
    let brushColor = "black";
    let pathArr = [];
    let ctxOrigin = [0, 0];
    let toTop = 0,
        toLeft = 0;
    let canvasData;
    const canvas = document.querySelector("#canvas");
    const brushEl = document.querySelector(".brush");
    const ctx = canvas.getContext('2d');
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        fullCanvas();
    }

    // 刷新画布
    refreshCanvas();

    // 监听鼠标移动操作
    canvas.addEventListener('mousemove', (e) => { // 展示当前画笔位置
        brushEl.style.transform = "translate3d(" + (e.offsetX - (brushEl.offsetWidth / 2)) + "px, " + (e.offsetY - (brushEl.offsetHeight / 2)) + "px, 0";
        if (e.buttons === 1) {
            draw(e)
            pathArr.push([e.offsetX - ctxOrigin[0], e.offsetY - ctxOrigin[1], dZoom])
        };
        if (e.buttons === 2) {
            document.body.className = "move";
            ctxOrigin = [ctxOrigin[0] + e.movementX, ctxOrigin[1] + e.movementY]
            moveCanvas()
            // fullCanvas()
        } else {
            document.body.className = "";
        };
    });

    // 监听鼠标按下操作
    canvas.addEventListener('mousedown', (e) => {
        // 移动笔刷到鼠标下方
        brushEl.style.transform = "translate3d(" + (e.offsetX - (brushEl.offsetWidth / 2)) + "px, " + (e.offsetY - (brushEl.offsetHeight / 2)) + "px, 0";
        console.log(e.buttons);
        // 鼠标左键按下开始绘制,并将坐标记录到数组内
        if (e.buttons === 1) {
            draw(e);
            pathArr.push([e.offsetX - ctxOrigin[0], e.offsetY - ctxOrigin[1], dZoom]);
        }
        // 右键按下则记录按下初始位置
        if (e.buttons === 2) {
            document.body.className = "move";
            // fullCanvas()
        } else {
            document.body.className = "";
        };
    });

    // 监听鼠标抬起
    canvas.addEventListener('mouseup', (e) => {
        if (e.buttons === 0) {
            document.body.className = "";
        }
    })

    // 画布缩放
    canvas.addEventListener('wheel', (e) => {
        zoom = zoom - (e.deltaY)
    })

    // 绘制方法
    function draw(e) {
        ctx.fillStyle = brushColor; // 绘制颜色
        ctx.beginPath(); // 开始绘制路径
        ctx.arc(e.offsetX, e.offsetY, (brushEl.offsetWidth / 2), 0, 2 * Math.PI); // 绘制圆
        ctx.fill(); // 填充路径
    };

    // 重绘画布[高资源占用]
    function fullCanvas() {
        console.log("重绘")
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pathArr.length; i++) {
            const brushWidth = brushEl.offsetWidth / 2;
            ctx.fillStyle = brushColor; // 绘制颜色
            ctx.beginPath(); // 开始绘制路径
            ctx.arc((pathArr[i][0] + ctxOrigin[0]) / pathArr[i][2] * dZoom, (pathArr[i][1] + ctxOrigin[1]) / pathArr[i][2] * dZoom, (brushWidth / pathArr[i][2] * dZoom), 0, 2 * Math.PI); // 绘制圆
            ctx.fill(); // 填充路径
        };
        canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    };

    // 移动画布[低资源占用]
    function moveCanvas() {
        // newCanvasData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        // if (canvasData !== newCanvasData) {
        //     canvasData = newCanvasData
        // }
        ctx.translate(ctxOrigin[0], ctxOrigin[1])
        fullCanvas()
        // ctx.putImageData(canvasData, 0,0)
    };

    // 根据屏幕刷新率来刷新canvas
    function refreshCanvas() {
        // requestAnimationFrame(
        //     function() {
        //         // 如果改变缩放值则刷新画布
        //         if (zoom !== dZoom) {
        //             dZoom = zoom;
        //             fullCanvas();
        //         }
        //         refreshCanvas();
        //     }
        // );
    };
};