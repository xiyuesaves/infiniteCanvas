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