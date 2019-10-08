var conf = zengma_conf, upre = conf.getUrlPrefix();

function plusReady() {
	var webv = plus.webview.currentWebview();
	
	window.addEventListener("ppreload", initInfo, false);
	
	initInfo();
	
	function initInfo(){
		webv.show("slide-in-right");
	}
}

mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});