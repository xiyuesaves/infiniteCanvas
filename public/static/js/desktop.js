function desktop() {
    axios.get('/static/js/desktop.json')
        .then(function(response) {
            let jsonData = response.data
            if (typeof jsonData === "object") {
                createDesktopIcon(jsonData)
            } else {
                console.log("远程桌面配置信息有误")
            }
        })
        .catch(function(error) {
            console.log(error)
        });

    function createDesktopIcon(desktopJson) {
        const desktop = document.querySelector(".desktop")
        const desktopIconEl = document.querySelector("#deaktop-icon")
        for (let i = 0; i < desktopJson.length; i++) {
            desktopIconEl.content.querySelector(".screen-icon").style.top = desktopJson[i].position.y + "px"
            desktopIconEl.content.querySelector(".screen-icon").style.left = desktopJson[i].position.x + "px"
            desktopIconEl.content.querySelector(".icon").innerText = desktopJson[i].icon
            desktopIconEl.content.querySelector(".icon-title").innerText = desktopJson[i].title
            let newIcon = document.importNode(desktopIconEl.content, true)
            desktop.appendChild(newIcon)
        }
    }
}