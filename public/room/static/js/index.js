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