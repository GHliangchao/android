var conf = zengma_conf, upre = conf.getUrlPrefix();

var goodsCode;

var tan_ok, tan_cancel, infoError;
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
		webv.show("slide-in-right");
	}
	
	function readGoodsNFC() {
		console.log("read goods nfc");
		var options = {cardId:"", format: "txt"};
		
		plus.blelock.scanQRcodeNfcRead({
    		success: success,
    		error: error,
    		options: options
    	});
		
		function success(res) {
			console.log("读NFC成功结果："+JSON.stringify(res));
			// 1.验证NFC内容 @sinc liujun 2018-11-16
			var message = res.message;
//			var message = "http://www.tuidianmg.com/emall/public!tcodeCheck.htm?tcode=1000000010000000001";
			
			if(res.result == 0) {
				// 如果点击的是返回按钮，就不给予提示 @since liujun 2018-11-16
				if (message == 'backclick') {
					return;
				}
				if (!checkNfCInfo(message)){
					return;
				}
				// 跳转到商品详情页面 @since liujun 2018-11-16
				var page = plus.webview.getWebviewById("goods_details.html");
				if (page == null) {
					mui.openWindow({url: "goods_details.html", extras:{
						goodsCode:goodsCode
					}});
				} else {
					mui.fire(page, "ppreload", {goodsCode: goodsCode});
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
	var page = plus.webview.getWebviewById("goods_code_scan.htm");
	if(page == null) {
		mui.openWindow({url:"goods_code_scan.html"});
	}else {
		mui.fire(page, "ppreload");
	}
}

function checkNfCInfo(mes) {
	console.log("message is :" + mes);
	// 1.判断是否是推点码的链接
	if(mes.indexOf("?tcode=") == -1) {
		showMsg(infoError);
		return false;
	}
	
	var urlLenth = mes.length;
	goodsCode = mes.substring((urlLenth - 19));
	return true;
}

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: tan_ok
	});
}

mui.init({
	swipeBack: false
});
mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});