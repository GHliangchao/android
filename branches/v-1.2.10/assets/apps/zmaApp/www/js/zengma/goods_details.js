var conf = zengma_conf, upre = conf.getUrlPrefix();
var sUrl = upre + "/app/memb/trace_code!tcodeCheck.action";

// extras parameter
var goodsCode;

var tan_ok, tan_cancel;
// 国际化
i18n.readyI18n(function(){
	tan_ok = $.i18n.prop("tan_ok");
	tan_cancel = $.i18n.prop("tan_cancel");
	$("#goodsDetailText").html($.i18n.prop("goods_code_detail_titleText"));
});

function plusReady() {
	console.log("plusReady()");
	
	var webv = plus.webview.currentWebview();
	goodsCode = webv.goodsCode;
	
	window.addEventListener('ppreload', webinit, false);
	$("#back")[0].addEventListener("tap", function(){mui.back();}, false);
	
	initInfo();
	
	function webinit(e) {
		if(e){
			var detail = e.detail;
			if (detail.goodsCode != undefined) {
				goodsCode = detail.goodsCode;
			}
		}
		initInfo();
	}
	
	function initInfo() {
		webv.show("slide-in-right");
		console.log("init info, goods code is " + goodsCode);
		$.ajax({
			url: sUrl,
			type: "GET",
			dataType:"HTML",
			data:{
				code: goodsCode
			},
			success:function(res) {
				console.log("init info message is " + res);
				$("#content").empty().append(res);
			},
			error: function(xhr, type, cause) {
				console.log("出错了");
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
		console.log("back fore :" + wb.id);
		if (wb.id == "goods_code_scan.html") {
			mui.fire(wb,'ppreload');
			return true;
		}
	}
});
mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});