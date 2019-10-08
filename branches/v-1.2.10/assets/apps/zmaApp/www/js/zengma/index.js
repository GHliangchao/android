var main = null,conf = zengma_conf,upre = conf.getUrlPrefix();
function plusReady() {
	var webv = plus.webview.currentWebview();
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "index.html"}
	});
	conf.onNetChange();
	getindex();
	window.addEventListener("getnewlist", getindex, false);
	window.addEventListener('ppreload',function(event){
		getindex();
		webv.show("slide-in-right");
	});
	function getindex(){
		var opener=webv.opener();
		if(opener!=null){
			var openerid=opener.id;
			if(openerid=="forget.html"){
				opener.close();
			}
		}
	}
	
	// 绑定事件 @since liujun 2018-09-14
	$("#calist")[0].addEventListener("tap", clickCaList, false);
	$("#zmlist")[0].addEventListener("tap", clickZmList, false);
	$("#beidou")[0].addEventListener("tap", clickBeidou, false);
	$("#scanauth")[0].addEventListener("tap", clickScanauth, false);
	$("#screenmore")[0].addEventListener("tap", clickScreen, false);
	$("#morecard")[0].addEventListener("tap", clickMoreCard, false);
	// 推点码 since 2018-11-15 pzp
	$("#goodsCode")[0].addEventListener("tap", clickGoodsCode, false);
	
	function clickGoodsCode(){
		var webviewUrl = "goods_code.html";
		openWebviewUrl(webviewUrl);
	}
	
	function clickCaList() {
		var webviewUrl = "calist.html";
		openWebviewUrl(webviewUrl);
	}
	
	function clickZmList() {
		var webviewUrl = "zmlist.html";
		openWebviewUrl(webviewUrl);
	}
	
	function clickBeidou() {
		var webviewUrl = "mulscr_ctl.html";
		openWebviewUrl(webviewUrl);
	}
	
	function clickScanauth() {
		var webviewUrl = "scan_auth.html";
		openWebviewUrl(webviewUrl);
	}
	
	function clickScreen() {
		var webviewUrl = "mulscr_ctl.html";
		openWebviewUrl(webviewUrl);
	}
	
	function clickMoreCard() {
		var webviewUrl = "cartlist.html";
		openWebviewUrl(webviewUrl);
	}
	
	function openWebviewUrl(webviewUrl){
		console.log("open webview url is " + webviewUrl);
		judgeLogin(operate);
		
		function operate() {
			var page = plus.webview.getWebviewById(webviewUrl);
			console.log("operate page is " + page);
			if (webviewUrl == "zmlist.html"){
				if (page) {
					console.log("ppreload()");
					mui.fire(page, "ppreload",{write: "N"});
				} else {
					console.log("no ppreload()");
					mui.openWindow({url: webviewUrl, extras:{
						write: "N"
					}});
				}
				return;
			}
			if (page) {
				console.log("ppreload()");
				mui.fire(page, "ppreload");
			} else {
				console.log("no ppreload()");
				mui.openWindow({url: webviewUrl});
			}
		}
	}
	
}

function judgeLogin(openWindow){
	var curl = upre + "/app/memb/mpge_zcode!judgelogin.action";
	mui.ajax(curl,{
        type:"GET",
        dataType:"json",
        success: function(e){
        	openWindow();
        },
        error:function(xhr, type, cause){
            ajaxerror(xhr, type, cause);
        }
    });
}

// init
mui.plusReady(function(){
	main = plus.webview.currentWebview();
	conf.uiInit();
	plusReady();
	var exit = newExitHandler();
	mui.init({
		beforeback: exit
	});
});
