function getRoomInfo() {
	console.log("获取房间信息")
	document.querySelector(".wating-service").className += " show"
	axios.post("")
	.then(function (response) {
		if (response.data.status) {
			let roomInfo = response.data.roomInfo
			if (roomInfo.password) {
				// 提示输入密码
				console.log("提示输入密码")
			} else {
				// 直接请求数据
				console.log("直接请求数据")
			}
		}
	})
	.catch(function(error) {
		console.log(error)
	})
}