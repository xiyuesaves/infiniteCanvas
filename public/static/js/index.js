var zoom = 1
window.onload = function() {
    console.log(screen.availWidth, screen.availHeight);
    var canvas = document.querySelector("#canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    // 获取笔刷位置
    getBrushPosition();
    // 设置菜单
    // brushSettingMenu();
};

// 获取笔刷位置
function getBrushPosition() {
    let brushColor = "black"
    let pathArr = []
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext('2d');
    // 刷新画布
    refreshCanvas();

    canvas.addEventListener('mousemove', (e) => { // 展示当前画笔位置
        const brushEl = document.querySelector(".brush");
        brushEl.style.transform = "translate3d(" + (e.offsetX - (brushEl.offsetWidth / 2)) + "px, " + (e.offsetY - (brushEl.offsetHeight / 2)) + "px, 0";
        if (e.buttons === 1) {
            draw(e)
            pathArr.push([e.offsetX, e.offsetY])
        }
    });


    function draw(e) {
        const brushEl = document.querySelector(".brush")
        ctx.fillStyle = brushColor; // 绘制颜色
        ctx.beginPath(); // 开始绘制路径
        ctx.arc(e.offsetX, e.offsetY, (brushEl.offsetWidth / 2), 0, 2 * Math.PI); // 绘制圆
        ctx.fill(); // 填充路径
    }

    // 根据屏幕刷新率来刷新canvas
    function refreshCanvas() {
        requestAnimationFrame(
            function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < pathArr.length; i++) {
                    const brushEl = document.querySelector(".brush")
                    ctx.fillStyle = brushColor; // 绘制颜色
                    ctx.beginPath(); // 开始绘制路径
                    ctx.arc(pathArr[i][0] * zoom, pathArr[i][1] * zoom, ((brushEl.offsetWidth / 2) * zoom), 0, 2 * Math.PI); // 绘制圆
                    ctx.fill(); // 填充路径
                }
                refreshCanvas();
            }
        );
    }
};