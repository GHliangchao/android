var conf = zengma_conf, upre = conf.getUrlPrefix();

var goodsCode;

var tan_ok, tan_cancel, infoError, scanNFCEr;
// 国际化
i18n.readyI18n(function(){
	$("#goodsCodeText").html($.i18n.prop("goods_code_js_titleText"));
	$("#gcQRcodeText").html($.i18n.prop("goods_code_js_QRcodeText"));
	$("#gcQRInfoText").html($.i18n.prop("goods_code_js_QRInfoText"));
	$("#gcNFCText").html($.i18n.prop("goods_code_js_NFCText"));
	$("#gcNFCInfoText").html($.i18n.prop("goods_code_js_NFCInfoText"));
	
	tan_ok = $.i18n.prop("tan_ok");
	tan_cancel = $.i18n.prop("tan_cancel");
	infoError = $.i18n.prop("goods_code_js_NFCInfoError");
	scanNFCEr = $.i18n.prop("goods_code_scanNFC_error");
});

function plusReady() {
	var webv = plus.webview.currentWebview();
	
	window.addEventListener("ppreload", initInfo, false);
	$("#back")[0].addEventListener("tap", function(){mui.back();}, false);
	$("#goodsNFC")[0].addEventListener("tap", readGoodsNFC, false);
	$("#goodsCode")[0].addEventListener("tap", openScanGoodsCode, false);
	
	initInfo();
	
	function initInfo(){
		console.log("init info");
		// 设置状态栏
		conf.setDarkStatusbar();
		webv.show("slide-in-right");
	}
	
	function readGoodsNFC() {
		console.log("read goods nfc");
		var options = {cardId:""};
		
		plus.blelock.scanSecretCodeNfcRead({
    		success: success,
    		error: error,
    		options: options
    	});
		
		function success(res) {
			console.log("读NFC成功结果："+JSON.stringify(res));
			// 1.验证NFC内容 @sinc liujun 2018-11-16
			
			if(res.result == 0) {
				// 如果点击的是返回按钮，就不给予提示 @since liujun 2018-11-16
				if (res.message == 'backclick') {
					return;
				}
				
				var code = res.code;
				var codeSn = res.codeSn;
				var version = res.version;
				var sign	= res.sign;
				var ts = res.ts;
				var digest = res.digest;
				
				if(conf.debug){
					code = "7a2c880cd0166ff8186e8dae09267e76";
					codeSn = "920000000004";
					version = "1";
					ts = "1552527991000";
					sign = "b4b32cba48908e2f769c15a36d06a789";
					digest = "a1daa78853cf3fbda963458220d36f3b";
				}
				
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
					}});
				} else {
					mui.fire(page, "ppreload", {
						code:code, 
						codeSn:codeSn, 
						version:version, 
						sign: sign,
						ts:ts,
						digest:digest
					});
				}
				return;
			}
			showMsg(res.message);
		}
		
		function error(res) {
			console.log("读NFC失败结果："+JSON.stringify(res));
			showMsg(res.message);
		}
	}
}

function openScanGoodsCode(){
	console.log("open scan goods code");
	var page = plus.webview.getWebviewById("goods_code_scan.html");
	if(page == null) {
		mui.openWindow({url:"goods_code_scan.html"});
	}else {
		mui.fire(page, "ppreload");
	}
}

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: tan_ok
	});
}

mui.init({
	swipeBack: false,
	beforeback:function(){
		// @since liujun 2018-11-30 返回index.html，重新设置状态栏颜色
		var webv = plus.webview.currentWebview();
		var openerPage = webv.opener();
		console.log("opener html is " + openerPage.id);
		if (openerPage.id == "zmaApp" || openerPage.id == "index.html") {
			mui.fire(openerPage, "ppreload",{skipNFCAuth: true});
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