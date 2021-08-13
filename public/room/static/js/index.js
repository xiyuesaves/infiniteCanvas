"use strict"
document.addEventListener("DOMContentLoaded", function() {
	// dom加载完成时执行
	initLogin()
})

// 登录成功后调用
function loginSuccessReturn() {
    // 获取房间信息
	getRoomInfo()
}
// 获取房间信息后调用
function getRoomInfoSuccess(room) {
    // 初始化画布
    initCanvas(room)
    // 初始化消息模块
    initMessage(room)
}

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