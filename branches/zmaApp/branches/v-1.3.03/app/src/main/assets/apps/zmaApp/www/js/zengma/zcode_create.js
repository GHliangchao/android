var conf = zengma_conf, upre = conf.getUrlPrefix();
// extras params
var baseZcode, appid, appType, rootId, createBaseCode, zmid;
// generate zcode params
var title, content, remark, longitude, latitude, address;
var prepareXml, resZcode, caTerminal, ukeySignResult;
var pburl = upre + "/app/memb/mpge_zcode!prepareBaseZcode.action";
var purl  = upre + "/app/memb/mpge_zcode!prepareZcode.action";
var vburl = upre + "/app/memb/mpge_zcode!verifyZcode.action";

//i18n国际化资源 @since liujun 2018-09-12
//------------------start--------------------
var okJs, connectUkeyJs, verifysignJs, locationError,
	titleError, contentError, addressError;

i18n.readyI18n(function() {
	$("#titleText").html($.i18n.prop("zcode_create_js_titleText"));
	$("#inputTitleText").html($.i18n.prop("zcode_create_js_inputTitleText"));
	$("#contentText").html($.i18n.prop("zcode_create_js_contentText"));
	$("#addressText").html($.i18n.prop("zcode_create_js_addressText"));
	$("#remarkText").html($.i18n.prop("zcode_create_js_remarkText"));
	$("#errorText").html($.i18n.prop("zcode_create_js_errorText"));
	$("#sureText").html($.i18n.prop("zcode_create_js_sureText"));
	
	okJs = $.i18n.prop("tan_ok");
	connectUkeyJs = $.i18n.prop("zmdetail_showWait_connectUkey");
	verifysignJs = $.i18n.prop("zmdetail_showWait_verifysign");
	// 定位出现异常
	locationError = $.i18n.prop("zcode_create_js_locationError");
	// 业务标题不能为空
	titleError = $.i18n.prop("zcode_create_js_title_error");
	// 业务概要不能为空
	contentError = $.i18n.prop("zcode_create_js_content_error");
	// 当前地址不能为空
	addressError = $.i18n.prop("zcode_create_js_address_error");
});

function plusReady() {
	var webv = plus.webview.currentWebview();
		baseZcode = webv.zcode;
		appid = webv.appid;
		appType = webv.appType;
		rootId = webv.rootId;
		createBaseCode = webv.createBaseCode;
		zmid = webv.zmid;
		
	window.addEventListener("ppreload", webinit, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "zcode_create.html"}
	});
	initInfo(); // 初始化页面的信息
	
	function webinit(e) {
		console.log("init zcode_create.html");
		var detail = e.detail;
		if (detail) {
			baseZcode = detail.zcode;
			appid = detail.appid;
			appType = detail.appType;
			rootId = detail.rootId;
			createBaseCode = detail.createBaseCode;
			zmid = detail.zmid;
		}
		initInfo();
	}
	
	function initInfo() {
		webv.show("slide-in-right");
		console.log("init zcode_create.html: params:[baseZcode:"+baseZcode+", appid: "+appid+"]");
		$("#sure")[0].addEventListener("tap", generateZcode, false);
	}
	
	function generateZcode() {
		console.log("enter generateZcode start ---->");
		// check parameter
		if (!checkData()) {
			console.log("表单内容异常");
			return;
		}
		plus.nativeUI.showWaiting();
		plus.geolocation.getCurrentPosition(function(p) {
			longitude = p.coords.longitude;
			latitude  = p.coords.latitude;
			console.log("Geolocation success ：longitude："+longitude+", latitude="+latitude+" <----");
			// 1.提交参数预签名
			if (createBaseCode == 'Y') {
				prepareBaseZcode();
			} else {
				prepareZcode();
			}
			
		}, function(e){
			plus.nativeUI.closeWaiting();
			showMsg(locationError);
			console.log('Geolocation error: ' + e.message +' <----------');
		});
		
	}
	
	function prepareZcode() {
		console.log("prepare zcode start ---->");
		$.ajax({
			url: purl,
			type: "POST",
			dataType: "JSON",
			data: {
				appid: appid,
				title: title,
				content: content,
				address: address,
				remark: remark,
				longitude: longitude,
				latitude: latitude,
				rootId: rootId,
				zcode: baseZcode 
			},
			success: function(res) {
				if (res.ret == 0) {
					console.log("prepare zcode success <----");
					prepareXml = res.xml;
					resZcode = res.zcode;
					caTerminal = res.msg;
					console.log("prepareXml is :"+prepareXml);
					console.log("resZcode is :" + resZcode);
					console.log("caTerminal is :" + caTerminal);
					// 调用UKey签名 --> connect key;
					plus.nativeUI.closeWaiting();
					connectKey();
				} else {
					console.log("prepare zcode error message:" + res.msg + "  <----");
					plus.nativeUI.closeWaiting();
					showMsg(res.msg);
				}
			},
			error :function(xhr, type, cause) {
				console.log("prepare zcode error <----");
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		})
	}
	
	function prepareBaseZcode() {
		console.log("prepare zcode start ---->");
		$.ajax({
			url: pburl,
			type: "POST",
			dataType: "JSON",
			data: {
				appid: appid,
				title: title,
				content: content,
				address: address,
				remark: remark,
				longitude: longitude,
				latitude: latitude
			},
			success: function(res) {
				if (res.ret == 0) {
					console.log("prepare zcode success <----");
					prepareXml = res.xml;
					resZcode = res.zcode;
					caTerminal = res.msg;
					console.log("prepareXml is :"+prepareXml);
					console.log("resZcode is :" + resZcode);
					console.log("caTerminal is :" + caTerminal);
					// 调用UKey签名 --> connect key;
					plus.nativeUI.closeWaiting();
					connectKey();
				} else {
					console.log("prepare zcode error message:" + res.msg + "  <----");
					plus.nativeUI.closeWaiting();
					showMsg(res.msg);
				}
			},
			error :function(xhr, type, cause) {
				console.log("prepare zcode error <----");
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		})
	}
	
	// 连接Ukey @since liujun 2018-09-12
	function connectKey() {
		plus.nativeUI.showWaiting(connectUkeyJs);
		console.log("connect Ukey start ---->");
		plus.mgca.connect(caTerminal, function(rep) {
			var message = rep.message;
			if (rep.result == 0) {
				// connect success --> Ukey sign;
				console.log("connect Ukey success <----");
				signUp();
			} else {
				console.log("connect Ukey error:"+message+" <------");
				plus.nativeUI.closeWaiting();
				showMsg(message);
				return;
			}
		}, function(err) {
			console.log("connect Ukey error: "+err.message+" <-----");
			plus.nativeUI.closeWaiting();
			showMsg(err.message);
			return;
		});
	}
	
	function signUp() {
		// @since liujun 2018-09-12
		// 关闭雪花弹窗，此时会调用sign的提示弹窗
		console.log("Ukey sign start --->");
		plus.nativeUI.closeWaiting();
		plus.mgca.sign(prepareXml, function(nrep) {
			var mes = nrep.message;
			if (nrep.result == 0) {
				console.log("Ukey sign success <---");
				// set sign parameter
				ukeySignResult = mes;
				// sign success --> verify sign;
				verifysign();
			} else {
				showMsg(mes);
				console.log("Ukey sign error message :"+mes+" <----");
				return;
			}
		}, function(err) {
			console.log("Ukey sign error message :"+err.message+" <----");
			showMsg(err.message);
			return;
		});
	}
	
	// 验签名 resZcode --> zcode, ukeySignResult --> bizdatasign
	function verifysign() {
		console.log("verify sign start --->");
		plus.nativeUI.showWaiting(verifysignJs);
		$.ajax(vburl, {
			data: {
				title: title,
				content: content,
				zcode: resZcode,
				bizdatasign: ukeySignResult,
				appid: appid
			},
			dataType: "json",
			type: "POST",
			success: function(info) {
				plus.nativeUI.closeWaiting();
				var message = info.msg;
				if (info.ret == 0) {
					// 预签名成功
					console.log("verify sign success <---");
					showMsg(message, back);
					return;
				}
				console.log("verify sign error message :"+message+" <---");
				showMsg(message);
			},
			error: function(xhr, type, cause) {
				console.log("verify sign error <---");
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
		function back() {
			// 判断上一个页面
			var opener = plus.webview.currentWebview().opener();
			var curr = plus.webview.currentWebview();
			console.log("opener is "+ opener.id);
			if (opener.id == "zmdetail.html" || opener.id == "zmchain.html") {
				console.log("page is exist");
				mui.fire(opener, "ppreload", {
					aid: appid,
					zmid: zmid,
					appType: appType,
					rootId: rootId
				});
				plus.webview.close(curr);
				return;
			}
			console.log("page is not exist");
			mui.preload({
				url: "zmdetail.html",
				extras: {
					aid: appid,
					zmid: zmid,
					appType: appType,
					rootId: rootId
				}
			});
			plus.webview.close(curr);
		}
	}
	
	function checkData() {
		title = $("#title").val();
		content = $("#content").val();
		address = $("#address").val();
		remark = $("#remark").val(); 
		
		if ($.trim(title) == "") {
			showMsg(titleError);
			return false;
		}
		if ($.trim(content) == "") {
			showMsg(contentError);
			return false;
		}
		if ($.trim(address) == "") {
			showMsg(addressError);
			return false;
		}
		return true;
	}
	
}

function showMsg(msg, okCallback){
	if (okCallback) {
		console.log("okCallback is exist");
		$.dialog({
			content: msg,
			ok: okJs,
			okCallback: okCallback
		});
	} else {
		console.log("okCallback is not exist");
		$.dialog({
			content: msg,
			ok: okJs
		})
	}
}

mui.plusReady(function() {
	plusReady();
	conf.uiInit();
});