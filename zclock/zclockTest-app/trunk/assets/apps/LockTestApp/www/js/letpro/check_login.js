// 自动登录的方法
function checkLogin() {
	var name = plus.storage.getItem("sessionName");
	var pass = plus.storage.getItem("sessionPass");
	$.ajax({
		type: "get",
		url: upre + "/app/pro/checkLogin.htm",
		data: {
			username: name,
			password: pass
		},
		success: function(data) {
			console.log("判断是否在线" + data.success);
			//后台判断用户有没有在线
			if(data.success) {
				console.log("该用户已经在线");
			} else {
				// 自动登录失败的时候，就跳转到登录页面
				mui.openWindow({
					url: "login.html"
				});
			}
		},
		error: function(xmlhttprequest, textstatus, errorthrown) {
			console.log(xmlhttprequest.readyState);
			console.log(textstatus);
			console.log(errorthrown);
		}
	});
}