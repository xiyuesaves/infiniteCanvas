// 全局属性
let iconList = []

// 获取下一个元素 - 传入元素
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

// 获取上一个元素 - 传入元素
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

// 获取图标实例 - 传入uuid
function getInstance(uuid) {
    for (let i = 0; i < iconList.length; i++) {
        if (iconList[i].uuid === uuid) {
            return iconList[i]
        }
    }
    return null
}

// 双击判断 - 传入被点击元素
let lastClickEl,timeout
function doubleClick(selectEl) {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
        lastClickEl = null
    },500)
    if (lastClickEl === selectEl) {
        clearTimeout(timeout)
        lastClickEl = null
        return true
    } else {
        lastClickEl = selectEl
        return false
    }
}