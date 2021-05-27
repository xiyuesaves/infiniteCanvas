// 公开方法
let iconList = []
function getNextEl(el) {
    let listNode = el.parentNode.childNodes
    let newList = []
    for (var i = 0; i < listNode.length; i++) {
        if (listNode[i].nodeName !== "#text") {
            newList.push(listNode[i]);
        }
    }
    for (var i = 0; i < newList.length; i++) {
        if (newList[i] === el) {
            return newList[i + 1]
        }
    }
    return null
}

function getPrevEl(el) {
    let listNode = el.parentNode.childNodes
    let newList = []
    for (var i = 0; i < listNode.length; i++) {
        if (listNode[i].nodeName !== "#text") {
            newList.push(listNode[i]);
        }
    }
    for (var i = 0; i < newList.length; i++) {
        if (newList[i] === el) {
            return newList[i - 1]
        }
    }
    return null
}

function getInstance(uuid) {
    for (let i = 0; i < iconList.length; i++) {
        if (iconList[i].uuid === uuid) {
            return iconList[i]
        }
    }
    return null
}