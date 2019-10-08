var conf = zengma_conf, upre = conf.getUrlPrefix();

function plusReady() {
	var webv = plus.webview.currentWebview();
	
	window.addEventListener("ppreload", initInfo, false);
	
	
	initInfo();
	
	function initInfo(){
		console.log("init info");
		// 设置状态栏 @since liujun 2018-11-30
		conf.setDarkStatusbar();
		setTapListener();
		webv.show("slide-in-right");
	}
}

function setTapListener(){
	$("#scanZcode")[0].addEventListener("tap", scanZcode, false);
	$("#lock")[0].addEventListener("tap", lock, false);
	$("#scan")[0].addEventListener("tap", scan, false);
	$("#lockNFC")[0].addEventListener("tap", lock, false);
}

function scanZcode(){
	var url = "scan_zcode.html";
	mui.openWindow({url: url});
}

function lock(){
	var url = "lock.html";
	openWebview(url);
}

function scan(){
	var url = "scan.html";
	mui.openWindow({url: url});
}

function openWebview(url){
	var dpage = plus.webview.getWebviewById(url);
	console.log("open webview page is " + dpage);
	if(dpage == null){
		mui.preload({url:url});
	} else {
		mui.fire(dpage, "ppreload");
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