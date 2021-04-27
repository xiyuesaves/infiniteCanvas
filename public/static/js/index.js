var zoom = 1,
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
    let toTop = 0, toLeft = 0
    const canvas = document.querySelector("#canvas");
    const brushEl = document.querySelector(".brush");
    const ctx = canvas.getContext('2d');

    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        fullCanvas()
    }

    // 刷新画布
    refreshCanvas();

    canvas.addEventListener('mousemove', (e) => { // 展示当前画笔位置
        brushEl.style.transform = "translate3d(" + (e.offsetX - (brushEl.offsetWidth / 2)) + "px, " + (e.offsetY - (brushEl.offsetHeight / 2)) + "px, 0";
        if (e.buttons === 1) {
            draw(e)
            pathArr.push([e.offsetX - toLeft, e.offsetY - toTop, dZoom])
        };
        if (e.buttons === 2) {
            document.body.className = "move";
            // ctxOrigin[0] = ctxOrigin[0] - e.offsetX
            // ctxOrigin[1] = ctxOrigin[1] - e.offsetY
            // toLeft = toLeft + ctxOrigin[0]
            // toTop = toTop + ctxOrigin[1]
            // fullCanvas()
            moveCanvas()
            // ctxOrigin[toLeft, toTop]
        } else {
            document.body.className = "";
        };
    });
    canvas.addEventListener('mousedown', (e) => {
        // 移动笔刷到鼠标下方
        brushEl.style.transform = "translate3d(" + (e.offsetX - (brushEl.offsetWidth / 2)) + "px, " + (e.offsetY - (brushEl.offsetHeight / 2)) + "px, 0";
        console.log(e.buttons);
        if (e.buttons === 1) {
            draw(e);
            pathArr.push([e.offsetX, e.offsetY, dZoom]);
        }
        if (e.buttons === 2) {
            document.body.className = "move";
            ctxOrigin = [e.offsetX, e.offsetY];
        } else {
            document.body.className = "";
        };
    });

    function draw(e) {
        ctx.fillStyle = brushColor; // 绘制颜色
        ctx.beginPath(); // 开始绘制路径
        ctx.arc(e.offsetX , e.offsetY , (brushEl.offsetWidth / 2), 0, 2 * Math.PI); // 绘制圆
        ctx.fill(); // 填充路径
    };

    // 重绘画布[高资源占用]
    function fullCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pathArr.length; i++) {
            const brushWidth = brushEl.offsetWidth / 2;
            ctx.fillStyle = brushColor; // 绘制颜色
            ctx.beginPath(); // 开始绘制路径
            ctx.arc((pathArr[i][0]-toLeft) / pathArr[i][2] * dZoom, (pathArr[i][1]-toTop) / pathArr[i][2] * dZoom, (brushWidth / pathArr[i][2] * dZoom), 0, 2 * Math.PI); // 绘制圆
            ctx.fill(); // 填充路径
        };
    };

    // 移动画布[低资源占用]
    function moveCanvas() {
        
    };

    // 根据屏幕刷新率来刷新canvas
    function refreshCanvas() {
        requestAnimationFrame(
            function() {
                // 如果改变缩放值则刷新画布
                if (zoom !== dZoom) {
                    dZoom = zoom;
                    fullCanvas();
                }
                refreshCanvas();
            }
        );
    };
};