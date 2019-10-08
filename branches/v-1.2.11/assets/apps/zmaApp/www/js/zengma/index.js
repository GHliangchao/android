var main = null,conf = zengma_conf,upre = conf.getUrlPrefix();
var scanNFCEr, tan_ok;
//国际化
i18n.readyI18n(function(){
	tan_ok = $.i18n.prop("tan_ok");
	scanNFCEr = $.i18n.prop("goods_code_scanNFC_error");
});

function plusReady() {
	var webv = plus.webview.currentWebview();
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "index.html"}
	});
	conf.onNetChange();
	initInfo();
	window.addEventListener("getnewlist", getindex, false);
	window.addEventListener('ppreload',function(event){
		getindex(event);
	});

	function setBarStyle() {
		console.log("设置状态栏");
		// 将状态栏设置为 黑底白字
		plus.navigator.setStatusBarBackground("#050505");
		plus.navigator.setStatusBarStyle('light');
	}
	
	function startReadNFC(res){
		var code = res.code;
		var codeSn = res.codeSn;
		var version = res.version;
		var sign	= res.sign;
		var ts = res.ts;
		var digest = res.digest;
		
		if(typeof(code) == "undefined" || typeof(codeSn) == "undefined" 
			|| typeof(ts) =="undefined"|| typeof(digest) == "undefined"
			|| typeof(version) == "undefined" || typeof(sign) == "undefined") {
			showMsg(scanNFCEr);
			return;
		}
		
		// 跳转到商品详情页面 @since liujun 2018-11-16
		var page = plus.webview.getWebviewById("goods_details.html");
		if (page == null) {
			mui.openWindow({url: "goods_details.html", extras:{
				code:code,
				codeSn:codeSn,
				version:version,
				sign: sign,
				ts: ts,
				digest: digest
			},show:{autoShow:false}});
		} else {
			mui.fire(page, "ppreload", {
				code:code, 
				codeSn:codeSn, 
				version:version, 
				sign: sign,
				ts:ts,
				digest: digest
			});
		}
	}
	
	function initInfo(){
		var params = plus.runtime.arguments;
		console.log("index page params:"+params);
		
		if(params != ""){
			try{
				var args = JSON.parse(params);
				if(args.type == "NFC.auth"){
					startReadNFC(args);
				}
			}catch(e){
				showMsg(scanNFCEr);
			}
		}
		getindex();
	}
	
	function getindex(e){
		webv.show("slide-in-right");
		setBarStyle();
		
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
	
	function judgeLogin(openWindow){
		console.log("judge login");
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
}

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: tan_ok
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
