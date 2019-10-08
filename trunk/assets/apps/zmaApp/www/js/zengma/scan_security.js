var conf = zengma_conf, 
	upre = conf.getUrlPrefix();

function plusReady() {
	window.addEventListener("ppreload", webinit, false);
	var webv = plus.webview.currentWebview();
	
	webinit();
	
	function webinit() {
		webv.show("slide-in-right");
	}
}

mui.init({
	swipeBack: false
});

mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});