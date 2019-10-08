var conf = zengma_conf,upre = conf.getUrlPrefix(),dpage = null;

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var showWaitInfoJs;
i18n.readyI18n(function(){
	$("#calistText").html($.i18n.prop("calist_titleText"));
	$("#applyCA").html($.i18n.prop("calist_applyCA"));
	$("#applyCAStatus").html($.i18n.prop("calist_applyCAStatus"));
	showWaitInfoJs = $.i18n.prop("calist_showWait_info");
});
//------------------ end --------------------
function plusReady(){
	var webv = plus.webview.currentWebview(),
		curl=upre + "/app/memb/membca!list.action";
	window.addEventListener('ppreload',webinit,false);
	webv.addEventListener('show',infoinit,false);
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "calist.html"}
	});
 	function webinit(e){
 		var detail = e.detail;//带参数的话通过detail获取
		infoinit();
		webv.show("slide-in-right");
	}

	function infoinit(){
		plus.nativeUI.showWaiting(showWaitInfoJs);
	try {
			mui.ajax(curl, {
				type: "get",
				dataType: "html",
				success: function(infs) {
					plus.nativeUI.closeWaiting();
					var infs=$(infs);
					$("#calist").empty();
					$("#calist").append(infs);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		} catch (e) {
			plus.nativeUI.closeWaiting();
			console.error(e.message);
		}
	}

}

mui.init({
	swipeBack: false
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});