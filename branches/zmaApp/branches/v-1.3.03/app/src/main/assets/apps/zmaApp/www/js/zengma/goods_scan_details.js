var conf = zengma_conf, upre = conf.getUrlPrefix();
var sUrl = upre + "/app/memb/trace_code!tcodeCheck.action";

// extras parameter
//var code, version, codeSn, ts, sign, digest;
var goodsCode;

var tan_ok, tan_cancel,errorMsgJs;
// 国际化
i18n.readyI18n(function(){
	tan_ok = $.i18n.prop("tan_ok");
	tan_cancel = $.i18n.prop("tan_cancel");
	$("#goodsDetailText").html($.i18n.prop("goods_code_detail_titleText"));
	errorMsgJs = $.i18n.prop("access_js_error");
});

function plusReady() {
	console.log("plusReady()");
	mui.previewImage();
	
	var webv = plus.webview.currentWebview();
	goodsCode = webv.goodsCode;
	
	var errorHandler= function(){
		$.dialog({content: errorMsgJs, ok: tan_ok, okCallback:callBack,  modal:true});
		function callBack(){
			mui.back();
		}
	}
	
	window.ajaxerror = Access.newAjaxErrorHandler({extras: {redirect: "goods_details.html"}, errorHandler: errorHandler});
	window.addEventListener('ppreload', webinit, false);
	initInfo();
	
	function webinit(e) {
		if(e){
			var detail = e.detail;
			if (typeof(detail.goodsCode) != "undefined") {
				goodsCode = detail.goodsCode;
			}
		}
		initInfo();
	}
	
	
	function initInfo() {
		if(conf.debug){
			goodsCode = "1000000010000000083";
		}
		var data = {
				tcode: goodsCode
		}
		
		$.ajax({
			url: sUrl,
			type: "GET",
			dataType:"HTML",
			data: data,
			success:function(res) {
				console.log("init info message is " + res);
				$("#content").empty().append(res);
				webv.show("slide-in-right");
				var muiBack = $("#back");
				if(muiBack){
					muiBack[0].addEventListener("tap", function(){mui.back();}, false);
				}
				
			},
			error: function(xhr, type, cause) {
				console.log("出错了");
				xhr.args = data;
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

mui.init({
	beforeback:function(){
		var wb = plus.webview.currentWebview().opener();
		mui.fire(wb,'restart');
		return true;
	}
});
mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});