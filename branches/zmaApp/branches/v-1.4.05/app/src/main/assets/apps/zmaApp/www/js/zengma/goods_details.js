var conf = zengma_conf, upre = conf.getUrlPrefix();
var sUrl = upre + "/app/memb/trace_code!authNFC.action";

// extras parameter
var code, version, codeSn, ts, sign, digest;

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
	code = webv.code;
	version = webv.version;
	codeSn = webv.codeSn;
	ts = webv.ts;
	sign = webv.sign;
	digest = webv.digest;
	
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
			if (typeof(detail.code) != "undefined") {
				code = detail.code;
			}
			if (typeof(detail.version) != "undefined") {
				version = detail.version;
			}
			if(typeof(detail.codeSn) != "undefined"){
				codeSn = detail.codeSn;
			}
			if(typeof(detail.ts) != "undefined"){
				ts = detail.ts;
			}
			if(typeof(detail.sign) != "undefined"){
				sign = detail.sign;
			}
			if(typeof(detail.digest) != "undefined"){
				digest = detail.digest;
			}
		}
		initInfo();
	}
	
	
	function initInfo() {
		// 该页面显示的时候，就禁止读取NFC数据
		disableReadNFC();
		
		if(code == ""){
			var params = plus.storage.getItem("login.keep.params");
			if(params) {
				try{
					plus.storage.removeItem("login.keep.params");
					params = JSON.parse(params);
					code = params.code;
					version = params.version;
					codeSn = params.codeSn;
					ts = params.ts;
					sign = params.sign;
					digest = params.digest;
				} catch(e){
					console.log("parse params exception: " + e);
				}
			}
		}
		
		if(conf.debug){
			// test 1
//			code = "d62bc779b9998edb";
//			codeSn = "920000000004";
//			version = "1";
//			ts = "1552527991000";
//			sign = "cc16430977bf7441ba0f87dc95c358be";
//			digest = "85c490b369d843b99306b4110424434e";
			
			// test 2
//			code = "d443f34767331eb0";
//			codeSn = "900000030000";
//			version = "1";
//			ts = "1552527991000";
//			sign = "bd9b68c68ecb981e8d706ebf34f3bc06";
//			digest = "0af6b51e6abf20dc2973d898fe43149b";
			code = "d8b490eeea8a5835";
			codeSn = "170000000001";
			version = "1";
			ts = "1552527991000";
			sign = "98528e8c1be50bc9e08b62819055b721";
			digest = "ca71c41f5b1ccdc974bd41ac7e3edbed";
		}
		
		var data = {
				code: code,
				codeSn: codeSn,
				version:version,
				ts: ts,
				sign:sign,
				digest: digest
		};
		
		if(conf.debug)
			console.log("测试数据："+JSON.stringify(data));
		
		console.log("initInfo()");
		$.ajax({
			url: sUrl,
			type: "GET",
			dataType:"HTML",
			data: data,
			success:function(res) {
				console.log("init info message is " + res);
				$("#content").empty().append(res);
				$("#back")[0].addEventListener("tap", function(){mui.back();}, false);
				webv.show("slide-in-right");
			},
			error: function(xhr, type, cause) {
				console.log("出错了");
				xhr.args = data;
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	// 进入该页面的时候，禁止读取NFC
	function disableReadNFC() {
		console.log("禁用读取NFC功能");
		plus.readnfc.init({
			success:success,
			error:error
		});
		
		function success(res){
			console.log("disable read nfc success");
		}
		
		function error(res){
			console.log("disable read nfc error: " + JSON.stringify(res));
		}
	}
}

// 启动读取NFC
function enableReadNFC() {
	console.log("启动读取NFC");
	plus.readnfc.destroy({
		success: success,
		error: error
	});
	
	function success(res){
		console.log("enable read nfc");
	}
	
	function error(res){
		console.log("enable read nfc error: " + JSON.stringify(res));
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
		enableReadNFC();
		return true;
	}
});
mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});

function goodsExpress(gid, name, codeSn){
	if(conf.debug){
		console.log("gid is " + gid + ", name is " + name + ", codeSn is " + codeSn);
	}
	var url = "/choose_express.html";
	var page= plus.webview.getWebviewById(url);
	
	if(page == null){
		mui.preload({url: url, extras:{gid: gid, name: name, codeSn: codeSn}});
	} else {
		mui.fire(page, "preloading", {gid: gid, name: name, codeSn: codeSn});
	}
}

function goodsBuy(gid, codeSn){
	if(conf.debug){
		console.log("gid is " + gid + ", codeSn is " + codeSn);
	}
	
	var url = "/goods_list.html";
	var page= plus.webview.getWebviewById(url);
	if (page == null) {
		mui.preload({url: url, extras:{codeSn: codeSn}});
	} else {
		mui.fire(page, "preloading", {codeSn: codeSn});
	}

//	var url = "/goods_buy.html";
//	var page= plus.webview.getWebviewById(url);
//	if(page == null){
//		mui.preload({url: url, extras:{goodsId: gid}});
//	} else {
//		mui.fire(page, "preloading", {goodsId: gid});
//	}
}
