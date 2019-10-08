var conf = zengma_conf, upre = conf.getUrlPrefix();

function plusReady() {
	var webv = plus.webview.currentWebview();
	
	window.addEventListener("ppreload", initInfo, false);
	
	initInfo();
	
	function initInfo(){
		// 设置状态栏 @since liujun 2018-11-30
		conf.setDarkStatusbar();
		webv.show("slide-in-right");
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

mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});