window.onload = function() {
    console.log(screen.availWidth, screen.availHeight);
    var canvas = document.querySelector("#canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.onresize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    // 刷新画布
    refreshCanvas();
    // 获取笔刷位置
    getBrushPosition();
    // 设置菜单
    brushSettingMenu();
};

// 获取笔刷位置
function getBrushPosition() {
    canvas.addEventListener('mousemove', (e) => { // 展示当前画笔位置
        const brushEl = document.querySelector(".brush");
        brushEl.style.transform = "translate3d(" + (e.offsetX - (brushEl.offsetWidth / 2)) + "px, " + (e.offsetY - (brushEl.offsetHeight / 2)) + "px, 0";
        if (e.buttons === 1) { // 如果按着左键
            draw(e);
        };
    });
    canvas.addEventListener('mousedown', (e) => { // 展示当前画笔位置
        if (e.buttons === 1) { // 如果按着左键
            draw(e);
        };
    });

    function draw(e) {
        const brushEl = document.querySelector(".brush")
        if (e.buttons === 1) { // 如果按着左键
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgb(0,0,0)'; // 绘制颜色
            ctx.beginPath(); // 开始绘制路径
            ctx.arc(e.offsetX, e.offsetY, (brushEl.offsetWidth / 2), 0, 2 * Math.PI); // 绘制圆
            ctx.fill(); // 填充路径
        }
    }
};

// 设置菜单
function brushSettingMenu() {

}

// 根据屏幕刷新率来刷新canvas
function refreshCanvas() {
    requestAnimationFrame(
        function() {
            const canvas = document.querySelector("#canvas");
            const ctx = canvas.getContext('2d');

            refreshCanvas();
        }
    );
}