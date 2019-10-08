var conf = zengma_conf, 
	upre = conf.getUrlPrefix();

function plusReady() {
	window.addEventListener("ppreload", webinit, false);
	var webv = plus.webview.currentWebview();
	
	webinit();
	
	function webinit() {
		webv.show("slide-in-right");
	}
	
	// 绑定事件 @since liujun 2018-09-19
	$("#back")[0].addEventListener("tap", function(){mui.back();}, false);
	$("#writeNFC")[0].addEventListener("tap", function(){operate("scan_nfc_write.html");}, false);
	$("#readNFC")[0].addEventListener("tap", function(){operate("scan_nfc_read.html");}, false);
	
	function operate(url) {
		console.log("operate url is " + url);
		var page = plus.webview.getWebviewById(url);
		if (page == null) {
			mui.openWindow({url: url});
		} else {
			mui.fire(page, "ppreload");
		}
	}
}

mui.init({
	swipeBack: false
});

mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});