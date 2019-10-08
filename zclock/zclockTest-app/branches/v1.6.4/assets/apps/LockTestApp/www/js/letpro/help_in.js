var conf = letpro_conf;
var upre = conf.getUrlPrefix();

function plusReady() {
	var self = plus.webview.currentWebview();
	var helpurl = self.helpurls;
	$.ajax({
		type: "get",
		url: helpurl,
		success: function(data) {
			$("#helpIn").append(data);
		},
		error: function(xmlhttprequest, textstatus, errorthrown) {
			if(conf.debug){
				console.log(xmlhttprequest.readyState);
				console.log(textstatus);
				console.log(errorthrown);
			}
			if(xmlhttprequest.status === 401) {
				// 自动登录的方法
				checkLogin();
			}
			if(xmlhttprequest.status === 403) {
				mui.openWindow({
					url: "login.html"
				});
			}
		}
	});
}

mui.plusReady(function() {
	plusReady();
	mui.init();
});