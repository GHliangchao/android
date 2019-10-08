var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	goodsCode,
	scan = null,
	flash = false;

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var unknownJs,tan_ok, tan_cancel,infoError,
	openFlashJs, closeFlashJs, operatingJs, readInfoJs;
i18n.readyI18n(function(){
	$("#cancelText").html($.i18n.prop("scanzcode_cancelText"));
	$("#flash").html($.i18n.prop("scanzcode_openFlash"));
	// javaScript
	unknownJs    = $.i18n.prop("scanzocde_js_unknown");
	openFlashJs	 = $.i18n.prop("scanzcode_openFlash");
	closeFlashJs = $.i18n.prop("scanzcode_closeFlash");
	operatingJs  = $.i18n.prop("scanzcode_operating");
	readInfoJs   = $.i18n.prop("scanzcode_readyInfo");
	
	infoError = $.i18n.prop("goods_code_js_NFCInfoError");
	tan_ok = $.i18n.prop("tan_ok");
	tan_cancel = $.i18n.prop("tan_cancel");
});
//------------------ end --------------------

function plusReady(){
	if(ws||!window.plus||!domready){
		return;
	}
	
	// liujun 2017-11-13
	// Android处理返回键
	plus.key.addEventListener('backbutton', function(){
		if(scan !== null){
			scan.close();
		}
	},false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "goods_code_scan.html"}
	});
	// 获取窗口对象
	ws=plus.webview.currentWebview();
	// 开始扫描
	ws.addEventListener('show', start, false);
	window.addEventListener('ppreload', start);
   	
    function start(){
    	scan = new plus.barcode.Barcode('bcid',[plus.barcode.QR,plus.barcode.EAN8,plus.barcode.EAN13],{frameColor:'green',scanbarColor:'green'});
	    scan.onmarked=onmarked;
	    scan.start();
    }
    
    function onmarked(type, result) {
	    var text = unknownJs;
	    switch(type){
	        case plus.barcode.QR:
	        text = 'QR: ';
	        break;
	        case plus.barcode.EAN13:
	        text = 'EAN13: ';
	        break;
	        case plus.barcode.EAN8:
	        text = 'EAN8: ';
	        break;
	    }
	    scan.close();
	    result = result.replace(/\n/g, '');
	    
	    if(!checkNfCInfo(result)){
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
		setTimeout(function(){
			scan == null;
		}, 500);
		return;
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
    		ok: tan_ok,
    		okCallback: start
    	});
    }

    conf.uiInit();
}


function setFlash() {
	var buttom = $("#flash");
	if(flash){
		buttom.html(openFlashJs);
		scan.setFlash(false);
		flash = false;
	}else{
		buttom.html(closeFlashJs);
		scan.setFlash(true);
		flash = true;
	}
}

function muiback(){
	if(scan !== null){
		scan.close();
	}
	mui.back();
}

// pzp
var domready = false, ws=null;
if(window.plus){
	plusReady();
}else{
	document.addEventListener('plusready', plusReady, false);
}
//监听DOMContentLoaded事件
document.addEventListener('DOMContentLoaded', function(){
	domready=true;
	plusReady();
}, false);

mui.init();
