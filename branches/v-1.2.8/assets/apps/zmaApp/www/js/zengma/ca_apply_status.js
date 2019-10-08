var conf = zengma_conf,upre = conf.getUrlPrefix(),dpage = null;

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var showWaitJs;
i18n.readyI18n(function(){
	$("#caApplyStatusText").html($.i18n.prop("caApplyStatus_titleText"));
	showWaitJs = $.i18n.prop("caApplyStatus_showWait_info");
});
//------------------ end --------------------

function plusReady(){
	var webv = plus.webview.currentWebview(),
		curl=upre + "/app/memb/membca!selcastruts.action";
	window.addEventListener('ppreload',webinit,false);
	// fixbug：session消失，返回登录页面，再从登录页面跳回该页面，该页面刷新
	// liujun 2017-12-19
	window.addEventListener('getnewlist', infoinit, false);
	webv.addEventListener('show',infoinit,false);
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "ca_apply_status.html"}
	});
 	function webinit(e){
 		var detail = e.detail;//带参数的话通过detail获取
		infoinit();
		webv.show("slide-in-right");
	}
 	infoinit();
	function infoinit(){
		plus.nativeUI.showWaiting(showWaitJs);
		mui.ajax(curl, {
			type: "get",
			dataType: "html",
			success: function(infs) {
				plus.nativeUI.closeWaiting();
				var infs=$(infs);
				$("#caStruts").empty();
				$("#caStruts").append(infs);
			},
			error:function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}

}

mui.init({
	swipeBack: false
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});
