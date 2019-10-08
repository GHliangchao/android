var conf = zengma_conf, upre = conf.getUrlPrefix();

window.retains = {
	"bind_addbout.html": true
};

// extras parameter
var appid;

// input parameter
var boutName, boutCode, remark;

function plusReady(){
	var webv = plus.webview.currentWebview();
	
	appid = webv.appid;
	
	window.ajaxerror = Access.newAjaxErrorHandler({extras: {redirect: "bind_list.html"}});
	window.addEventListener('ppreload', webinit, false);
	$("#back")[0].addEventListener('tap', function(){mui.back();}, false);
	$("#nextStep")[0].addEventListener('tap', nextStep, false);
	
	initList();
	
	function webinit(e) {
		if (e) {
			var detail = e.detail;
			if (detail.appid != undefined) {
				appid = detail.appid;
			}
		}
		initList();
	}
	
	function initList() {
		$("#boutName").val("");
		$("#boutCode").val("");
		$("#remark").val("");
		webv.show("slide-in-right");
	}
	
	function nextStep() {
		console.log('bind add bout next step');
		
		// check parameter
		if (!checkParam()) {
			return;
		}
		
		var surl = "choose_zcode.html";
		var page = plus.webview.getWebviewById(surl);
		if (page == null) {
			mui.openWindow({url: surl, extras: {
				appid: appid,
				boutName: boutName,
				boutCode: boutCode,
				remark: remark
			}});
		} else {
			mui.fire(page, "ppreload", {
				appid: appid,
				boutName: boutName,
				boutCode: boutCode,
				remark: remark
			});
		}
	}
	
	function checkParam(){
		boutName = $("#boutName").val();
		boutCode = $("#boutCode").val();
		remark = $("#remark").val();
		
		if ($.trim(boutName) == ""){
			showMsg("请输入批次名称");
			return false;
		} 
		if ($.trim(boutCode) == "") {
			showMsg("请输入批次编号");
			return false;
		}
		return true;
	}
}

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: "确定"
	})
}

mui.plusReady(function(){
	plusReady();
	conf.uiInit();
})