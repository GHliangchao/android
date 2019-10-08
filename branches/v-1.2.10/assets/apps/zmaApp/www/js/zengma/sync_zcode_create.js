var conf = zengma_conf, upre = conf.getUrlPrefix();

// extras parameter
var appid, boutId;

//generate zcode params
var title, content, remark, longitude, latitude, address;
var prepareXml, resZcode, caTerminal, ukeySignResult;

// request url 
var gUrl = upre + "/app/memb/sync_create_zcodes!prepareZcode.action";
var vurl = upre + "/app/memb/sync_create_zcodes!verifyZcode.action";

function plusReady() {
	var webv = plus.webview.currentWebview();
	appid = webv.appid;
	boutId = webv.boutId;
	
	window.addEventListener("ppreload", webinit, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "sync_zcode_create.html"}
	});
	$("#back")[0].addEventListener("tap", function(){mui.back();}, false);
	$("#sure")[0].addEventListener("tap", generateZcode, false);
	
	initInfo();
	
	function webinit(e) {
		var detail = e.detail;
		if (detail.appid != undefined) {
			appid = detail.appid;
		}
		if (detail.boutId != undefined) {
			boutId = detail.boutId;
		}
		initInfo();
	}
	
	function initInfo() {
		webv.show("slide-in-right");
	}
	
	function generateZcode() {
		console.log("enter generate zcodes start ----------->");
		// check parameter
		if (!checkData()) {
			console.log("input content error");
			return;
		}
		
		// get address
		plus.nativeUI.showWaiting();
		plus.geolocation.getCurrentPosition(function(p) {
			longitude = p.coords.longitude;
			latitude  = p.coords.latitude;
			console.log("Geolocation success ：longitude："+longitude+", latitude="+latitude+" <----");
			prepareZcode();
		}, function(e) {
			plus.nativeUI.closeWaiting();
			showMsg("定位出现异常");
			console.log('Geolocation error: ' + e.message +' <----------');
		});
	}
	
	function prepareZcode(){
		console.log("prepare zcode start ---->");
		$.ajax({
			url : gUrl,
			type: "POST",
			dataType: "JSON",
			data: {
				appid: appid,
				boutId: boutId,
				title: title,
				content: content,
				address:address,
				longitude: longitude,
				latitude: latitude,
				remark: remark
			},
			success: function(res) {
				if (res.ret == 0) {
					// success
					prepareXml = res.xml;
					zcodes = res.zcodes;
					caTerminal = res.caTerminal;
					console.log("prepareXml is :"+prepareXml);
					console.log("resZcode is :" + resZcode);
					console.log("caTerminal is :" + caTerminal);
					// next step
					plus.nativeUI.closeWaiting();
					console.log("prepare zcode end <----");
					connectKey();
				} else {
					// error
					console.log("prepare zcode error message:" + res.msg + "  <----");
					plus.nativeUI.closeWaiting();
					showMsg(res.msg);
				}
			},
			error: function (xhr, type, cause) {
				console.log("prepare zcode error <----");
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		})
	}
	
	function connectKey() {
		plus.nativeUI.showWaiting("正在连接Ukey");
		console.log("connect Ukey start ---->");
		plus.mgca.connect(caTerminal, function(res) {
			var message = res.message;
			if (res.result == 0) {
				// success
				console.log("connect key success");
				signUp();
			} else {
				// error
				console.log("connect key error: "+message+"<----");
				showMsg(message);
			}
		}, function(err) {
			var msg = err.message;
			console.log("connect key error: "+msg+"<----");
			plus.nativeUI.closeWaiting();
			showMsg(msg);
		});
	}
	
	function signUp() {
		// @since liujun 2018-09-12
		// 关闭雪花弹窗，此时会调用sign的提示弹窗
		console.log("Ukey sign start --->");
		plus.nativeUI.closeWaiting();
		plus.mgca.sign(prepareXml, function(nrep) {
			var mes = nrep.message;
			console.log("nrep result is "+ nrep.result);
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
			var msg = err.message;
			console.log("Ukey sign error message :"+msg+" <----");
			showMsg(msg);
		});
	}
	
	function verifysign() {
		console.log("verify sign start ---->");
		plus.nativeUI.showWaiting("正在验证签名，请稍等");
		$.ajax({
			url: vurl,
			type: "POST",
			dataType: "JSON",
			data: {
				appid: appid,
				bizdatasign: ukeySignResult,
				zcodes: zcodes,
				title:title,
				content: content
			},
			traditional: true,
			success: function(res) {
				plus.nativeUI.closeWaiting();
				var msg= res.msg;
				if (res.ret == 0) {
					// success
					console.log("verify sign success <-----");
					$.dialog({
						content: "验签名成功",
						ok: "确定",
						okCallback: callBack
					});
					return;
				}
				console.log("verify sign error , message is "+ msg + "<----");
				showMsg(msg);
			},
			error: function(xhr, type, cause) {
				console.log("verify sign error <-------");
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		})
	}
	
	function callBack() {
		console.log("call back");
		var page = plus.webview.getWebviewById("bind_zcode_list.html");
		if (page == null) {
			mui.openWindow({url: "bind_zcode_list.html", extras: {
				appid: appid, boutId: boutId
			}});
		} else {
			mui.fire(page, "ppreload", {
				appid: appid, boutId: boutId
			});
		}
		webv.close();
	}
	
	function checkData() {
		title = $("#title").val();
		content = $("#content").val();
		address = $("#address").val();
		remark = $("#remark").val(); 
		
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

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: "确定"
	});
}

mui.plusReady(function() {
	plusReady();
	conf.unInit();
});