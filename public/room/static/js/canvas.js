function initCanvas() {
    // 状态系统
    var stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    console.log("初始化画布");
    // 底层画布
    let fullCanvas = document.querySelector("#full-canvas");
    fullCanvas.width = 10000;
    fullCanvas.height = 10000;
    fCtx = fullCanvas.getContext("2d");
    fCtx.fillRect(0, 0, 200, 200);

    // 用户可见画布
    let screenCanvas = document.querySelector("#main-canvas");
    screenCanvas.width = window.innerWidth;
    screenCanvas.height = window.innerHeight;
    sCtx = screenCanvas.getContext("2d");

    // 窗口大小变更时刷新
    window.onresize = function() {
        screenCanvas.width = window.innerWidth;
        screenCanvas.height = window.innerHeight;
    };

    // 循环渲染
    window.requestAnimationFrame(refreshCanvas);
    function refreshCanvas() {
        stats.begin();
        sCtx.drawImage(fullCanvas, 0, 0, window.innerWidth, window.innerHeight, 0, 0, window.innerWidth, window.innerHeight);
        stats.end();
        setTimeout(function() {
            window.requestAnimationFrame(refreshCanvas);
        }, 100);
    };
};