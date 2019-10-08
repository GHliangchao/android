var conf = zengma_conf, upre = conf.getUrlPrefix();

window.retains = {
	"bind_addbout.html": true
};

// i18n 国际化资源 @since liujun 2018-11-27
var promptBoutNameText, promptBoutCodeText, tanOkText;
i18n.readyI18n(function() {
	$("#titleText").html($.i18n.prop('bind_addbout_js_titleText'));
	$("#boutNameText").html($.i18n.prop('bind_addbout_js_boutNameText'));
	$("#boutCodeText").html($.i18n.prop('bind_addbout_js_boutCodeText'));
	$("#remarkText").html($.i18n.prop('bind_addbout_js_remarkText'));
	$("#nextStep").html($.i18n.prop('bind_addbout_js_nextStep'));
	
	// 请输入批次名称
	promptBoutNameText = $.i18n.prop('bind_addbout_placeholder_boutName');
	// 请输入批次编号
	promptBoutCodeText = $.i18n.prop("bind_addbout_placeholder_boutCode");
	// 确&nbsp;&nbsp;定
	tanOkText = $.i18n.prop("tan_ok");
	// attr placeholder
	$("#boutName").attr("placeholder", promptBoutNameText);
	$("#boutCode").attr("placeholder", promptBoutCodeText);
	$("#remark").attr("placeholder", $.i18n.prop('bind_addbout_placeholder_remark'));
});


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
			showMsg(promptBoutNameText);
			return false;
		} 
		if ($.trim(boutCode) == "") {
			showMsg(promptBoutCodeText);
			return false;
		}
		return true;
	}
}

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: tanOkText
	});
}

mui.plusReady(function(){
	plusReady();
	conf.uiInit();
})