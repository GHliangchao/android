var conf = zengma_conf, upre = conf.getUrlPrefix();
window.retains = {'split_code_view.html':true};
var surl = upre + "/app/memb/mpge_goods_verify!splitView.action";
var purl = upre + "/app/memb/mpge_goods_verify!splitBoutPreZcode.action"
var vurl = upre + "/app/memb/mpge_goods_verify!splitBoutVerifyZcode.action"
// extras parameter
var appid, boutId, appType;

// split code parameter
var address, maxVerifyId, minVerifyId, content, title,
	longitude, latitude, goodsCount;

//sign parameter
var caTerminal, signXml, newCode, ukeySignResult;

//i18n国际化资源 @since liujun 2018-09-26
//------------------start--------------------
var okJs, connectUkeyJs, verifysignJs;

i18n.readyI18n(function() {
	okJs = $.i18n.prop("tan_ok");
	connectUkeyJs = $.i18n.prop("zmdetail_showWait_connectUkey");
	verifysignJs = $.i18n.prop("zmdetail_showWait_verifysign");
});
// -------------------  end ---------------------

function plusReady() {
	var webv = plus.webview.currentWebview();
	appid   = webv.appid;
	boutId  = webv.boutId;
	appType = webv.appType;
	window.addEventListener("ppreload", webinit, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extars: {redirect: "split_code_view.html"}
	});
	
	$("#back")[0].addEventListener("tap", function(){mui.back();}, false);
	// 拆分防伪码的提交按钮
	$("#submitSplit")[0].addEventListener('tap', generateZcode, false);
	initInfo();
	
	function webinit(e) {
		var detail = e.detail;//带参数的话通过detail获取
		if (detail) {
			appid = detail.appid;
			boutId = detail.boutId;
			appType= detail.appType;
		}
		initInfo();
	}
	
	function initInfo() {
		// 查询防伪码批次的详情 @since liujun 2018-09-25
		selBoutDetail();
		mui.previewImage(); // 放大图片
		webv.show("slide-in-right");
	}
	
	function selBoutDetail() {
		console.log("select bout detail, bout id is "+ boutId+", appid is "+appid);
		plus.nativeUI.showWaiting("正在加载数据");
		$.ajax({
			url: surl,
			dataType: "html",
			type:"GET",
			data: {
				boutId:boutId,
				appid: appid
			},
			success: function(res) {
				$("#shengcontent").empty();
				$("#shengcontent").append(res);
				plus.nativeUI.closeWaiting();
			},
			error: function (xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	function generateZcode() {
		// 1. check parameter
		if (!check()) {
			console.log("check parameter error");
			return;
		}
		plus.nativeUI.showWaiting();
		plus.geolocation.getCurrentPosition(function(p) {
			longitude = p.coords.longitude;
			latitude  = p.coords.latitude;
			console.log("Geolocation success ：longitude："+longitude+", latitude="+latitude+" <----");
			// 1.提交参数预签名
			getSignText();
		}, function(e){
			plus.nativeUI.closeWaiting();
			showMsg("定位出现异常");
			console.log('Geolocation error: ' + e.message +' <----------');
		});
	}
	
	function getSignText() {
		$.ajax({
			url: purl,
			type: "POST",
			dataType: "json",
			data: {
				maxVerifyId:maxVerifyId,
				minVerifyId:minVerifyId,
				address: address,
				goodsCount: goodsCount,
				content: content,
				title: title,
				appid: appid,
				boutId: boutId,
				longitude: longitude,
				latitude: latitude
			},
			success: function(res) {
				plus.nativeUI.closeWaiting();
				if (res.ret == 0) {
					signXml = res.xml;
					newCode = res.zcode;
					caTerminal = res.msg;
					// 调用Ukey签名  --> connect key
					connectKey();
				} else {
					showMsg(res.msg);
				}
				
			},
			error: function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	// 连接Ukey @since liujun 2018-09-26
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
		plus.mgca.sign(signXml, function(nrep) {
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
	
	function verifysign() {
		console.log("verifysign() start");
		plus.nativeUI.showWaiting();
		console.log("verifysign() end");
		$.ajax({
			url: vurl,
			dataType:"JSON",
			type:"POST",
			data: {
				appid: appid,
				bizdatasign: ukeySignResult,
				zcode:newCode,
				boutId: boutId,
				goodsCount: goodsCount,
				content: content,
				title: title
			},
			success: function(res){
				plus.nativeUI.closeWaiting();
				if (res.ret == 0) {
					// 跳转到甄码列表页面
					$.dialog({
						content: res.msg,
						ok: okJs,
						okCallback: refresh
					});
					return;
				}
				showMsg(res.msg);
			},
			error: function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	function refresh() {
		var page = plus.webview.getWebviewById("zmdetail.html");
		if (page == null) {
			mui.openWindow({
				url: "zmdetail.html",
				extras: {
					aid: appid,
					appType: appType
				}
			});
		} else {
			mui.fire(page, "ppreload", {
				aid: appid,
				appType: appType
			})
		}
		
	}
	
	function check() {
		address = $("#address").val();
		minVerifyId = $("#minVerifyId").val();
		maxVerifyId = $("#maxVerifyId").val();
		goodsCount = $("#splitCount").val();
		
		content = $("#content").val();
		title = $("#title").val();
		
		// check parameter
		if (($.trim(maxVerifyId) == "") || ($.trim(goodsCount) == "")) {
			showMsg("请输入拆分件数");
			return false;
		}
		if ($.trim(title) == "") {
			showMsg("业务标题不能为空");
			return false;
		}
		if ($.trim(content) == "") {
			showMsg("业务概要不能为空");
			return false;
		}
		if ($.trim(address) == "") {
			showMsg("当前地址不能为空");
			return false;
		}
		return true;
	}
}

mui.plusReady(function() {
	plusReady();
	conf.uiInit();
});

function changeSplitCount() {
	var count = $("#splitCount").val();
	var minVerifyId = $("#minVerifyId").val();
	$("#maxVerifyId").val("");
	if ($.trim(count) == "") {
		showMsg("拆分件数不能为空");
		$("#splitCount").val("");
		return;
	}
	if (isNaN(count)) {
		showMsg("拆分件数必须为数字");
		$("#splitCount").val("");
		return;
	}
	var numCount = Number(count);
	console.log("num count is "+numCount);
	if (numCount < 1) {
		showMsg("拆分件数必须大于0");
		$("#splitCount").val("");
		return;
	}
	console.log("num minVerifyId is "+Number(minVerifyId));
	var maxVerifyId = Number(minVerifyId) + numCount - 1;
	var max = $("#maxvalue").val();
	if (maxVerifyId > Number(max)) {
		showMsg("拆分件数已经超过最大值");
		$("#splitCount").val("");
		return;
	}
	$("#maxVerifyId").val(maxVerifyId);
}

function showMsg(msg){
	$.dialog({
		content: msg,
		ok: okJs
	})
}