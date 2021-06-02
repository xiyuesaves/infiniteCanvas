function getRoomInfo() {
	console.log("获取房间信息")
	document.querySelector(".wating-service").className += " show"
	axios.get("/roomData")
	.then(function (response) {
		console.log(response)
	})
	.catch(function(error) {
		console.log(error)
	})
}