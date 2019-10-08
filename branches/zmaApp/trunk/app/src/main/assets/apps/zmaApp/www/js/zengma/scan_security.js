var conf = zengma_conf, 
	upre = conf.getUrlPrefix();

function plusReady() {
	window.addEventListener("ppreload", webinit, false);
	var webv = plus.webview.currentWebview();
	
	webinit();
	
	function webinit() {
		// 设置状态栏 @since liujun 2018-11-30
		conf.setDarkStatusbar();
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
			mui.preload({url: url});
		} else {
			mui.fire(page, "ppreload");
		}
	}
}

mui.init({
	swipeBack: false,
	beforeback:function(){
		// @since liujun 2018-11-30 返回index.html，重新设置状态栏颜色
		var webv = plus.webview.currentWebview();
		var openerPage = webv.opener();
		console.log("opener html is " + openerPage.id);
		if (openerPage.id == "zmaApp" || openerPage.id == "index.html") {
			mui.fire(openerPage, "ppreload");
			webv.close();
			return false;
		}
		return true;
	}
});

mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});