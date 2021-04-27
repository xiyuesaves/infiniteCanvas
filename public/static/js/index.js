// 取消浏览器默认右键菜单
window.oncontextmenu = function(e) {
    e.preventDefault();
}

window.onload = function() {
    // 计算画布大小
    initCanvas();
};

// 初始化画布
function initCanvas() {
    // 主要操作元素
    const canvas = document.querySelector("#canvas");
    const bursh = document.querySelector("#brush");
    const ctx = canvas.getContext("2d");

    // 变量声明
    let pathArr = [];
    let lastX = 0,
        lastY = 0;
    let moveX = 0,
        moveY = 0;
    let tempX = 0,
        tempY = 0;
    let zoom = 1.1,
        dZoom = 1;
    let imageData;
    let brushColor = "#ff0000";
    let dragStart = false;
    let moveStart = false;
    // 宽度变化监听
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drenArr(pathArr)
    }
    // 初始化大小
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 监听笔刷位置
    canvas.addEventListener("mousedown", function(e) {
        if (e.buttons === 1) {
            dragStart = true;
            dren(e);
        } else if (e.buttons === 2) {
            drenArr(pathArr)
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
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
    });
    canvas.addEventListener("mousemove", function(e) {
        let lefPotin = e.offsetX - bursh.offsetWidth / 2,
            rightPoint = e.offsetY - bursh.offsetHeight / 2;
        bursh.style.transform = "translate3d(" + lefPotin + "px, " + rightPoint + "px, 0px)";
        if (dragStart) {
            dren(e);
        };
        if (moveStart) {
            moveCanvas(e)
        }
    });

    // 绘制方法
    function dren(e) {
        pathArr.push({
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
        for (let i = arr.length - 1; i >= 0; i--) {
            ctx.fillStyle = arr[i].color;
            ctx.beginPath();
            ctx.arc((arr[i].x + lastX), (arr[i].y + lastY), arr[i].brushSize, 0, 2 * Math.PI);
            ctx.fill();
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
        drenArr(pathArr);
    }
    canvas.addEventListener('mousewheel', function(e) {
        let delta = e.deltaY / 90
        zoomFun(-delta)
    }, false);

    function zoomFun(delta) {
        let zooms = Math.pow(zoom, delta);
        ctx.scale(zooms, zooms);
        dZoom = dZoom * zooms
        console.log(dZoom)
        drenArr(pathArr);
    }
}