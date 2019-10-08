var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	dpage = null,
	durl = 'zmdetail.html',
	openid = null;

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var selPlatformJs;
i18n.readyI18n(function(){
	$("#zmchainText").html($.i18n.prop("zmchain_titleText"));
	selPlatformJs = $.i18n.prop("zmchain_showWait_selPlatformInfo");
});
//------------------ end --------------------
	
function plusReady(){
	var webv = plus.webview.currentWebview(),
		curl=upre + "/app/memb/membca!zmchainlist.action",
		aid = webv.appid, rid = webv.rid;
		openid = webv.openid;
	window.addEventListener('zmchainload', webinit ,false);
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "zmchain.html"}
	});
	
 	function webinit(e){
 		console.log("zmchain webinit");
 		var detail = e.detail; // 带参数的话通过detail获取
 		if (detail.appid != undefined) {
 			aid = detail.appid;
 		}
 		if (detail.rid != undefined) {
 			rid = detail.rid;
 		}
 		if (detail.openid != undefined) {
 			openid = detail.openid;
 		}
 		infoinit();
 		webv.show("slide-in-right");
	}
 	infoinit();
	function infoinit(){
		webv.show("slide-in-right");
		plus.nativeUI.showWaiting(selPlatformJs);
		try{
			mui.ajax(curl, {
				type:"GET",
				dataType:"html",
				data:{
					applicationId: aid,
					rootId : rid
				},
				success:function(infs){
					plus.nativeUI.closeWaiting();
					if(conf.debug){
						console.log(infs);
					}
					var zcpdeInfo = $("#zcodeInfo");
					zcpdeInfo.empty();
					zcpdeInfo.html(infs);
				},
				error: function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		}catch(e){
			plus.nativeUI.closeWaiting();
			console.log(e.message);
		}
	}
	
}

//整体滑动暂不支持android手机，因为两个页面的移动动画，无法保证同步性；
mui.init({
	beforeback: function(){
		if ("scan_zcode.html" == openid) {
			mui.fire(plus.webview.currentWebview().opener(), "ppreload");
			return true;
		}
	}
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});
