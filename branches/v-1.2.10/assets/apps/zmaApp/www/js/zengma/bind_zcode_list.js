var conf = zengma_conf, upre = conf.getUrlPrefix();
window.retains = {"bind_zcode_list.html": true};

// extras parameter
var appid, boutId;

var surl = upre + "/app/memb/zcode_sync_operate!bindzcodelist.action";
var delBindUrl = upre + "/app/memb/zcode_sync_operate!delBind.action";

function plusReady(){
	var webv = plus.webview.currentWebview();
	
	appid = webv.appid;
	boutId = webv.boutId;
	
	window.ajaxerror = Access.newAjaxErrorHandler({extras:{redirect:"bind_zcode_list.html"}});
	window.addEventListener('ppreload', webinit, false);
	
	$("#back")[0].addEventListener('tap', function(){mui.back();}, false);
	$("#syncOperate")[0].addEventListener("tap", syncOperate, false);
	
	function webinit(e) {
		if (e) {
			var detail = e.detail; // 带参数的话通过detail获取
			if (detail.appid != undefined) {
				appid = detail.appid;
			}
			if (detail.boutId != undefined) {
				boutId = detail.boutId;
			}
		}
		initList();
	}
	
	initList();
	
}

function syncOperate() {
	console.log("syncOperate()");
	var page = plus.webview.getWebviewById("sync_zcode_create.html");
	if (page == null) {
		mui.openWindow({url: "sync_zcode_create.html", extras: {
			appid: appid, boutId: boutId
		}});
	} else {
		mui.fire(page, "ppreload", {
			appid: appid, boutId: boutId
		})
	}
}

function initList() {
	console.log("init list ajax"+appid+"---"+boutId);
	$.ajax({
		url: surl,
		type: "GET",
		dataType: "HTML",
		data: {
			appid: appid,
			boutId: boutId
		},
		success: function(res) {
			console.log("返回成功"+res);
			$("#zcodeInfo").empty().append(res);
		},
		error: function(xhr, type, cause) {
			ajaxerror(xhr, type, cause);
		}
	});
}

// 解除绑定
function delBind(rootId){
	$.dialog({
		content: "你确定要除绑定吗？",
		ok: "确定",
		okCallback: del,
		cancel: "取消"
	});
	
	function del(){
		plus.nativeUI.showWaiting("正在解除绑定");
		$.ajax({
			url: delBindUrl,
			data:{
				appid: appid,
				rootId: rootId,
				boutId: boutId
			},
			dataType: "JSON",
			type: "POST",
			success: function(res) {
				plus.nativeUI.closeWaiting();
				if(res.ret == 0) {
					$.dialog({
						content: res.msg,
						ok: "确定",
						okCallback: initList
					});
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
}

function addZcodelist() {
	var page = plus.webview.getWebviewById("add_zcode_list.html");
	if (null == page) {
		mui.openWindow({url: "add_zcode_list.html", extras:{
			appid: appid, boutId: boutId
		}});
	} else {
		mui.fire(page, "ppreload", {appid: appid, boutId:boutId});
	}
}

mui.plusReady(function() {
	plusReady();
	conf.uiInit();
});

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: "确定"
	});
}

