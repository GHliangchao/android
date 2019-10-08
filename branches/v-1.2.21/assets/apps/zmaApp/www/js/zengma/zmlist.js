var conf = zengma_conf,upre = conf.getUrlPrefix(), write='N',address="",lockName;
window.retains={'zmdetail.html':true};

// 国际化资源 @since liujun 2018-02-26
// ---------------------start-----------------------------
var showWaitJs;
i18n.readyI18n(function(){
	$("#zmlistText").html($.i18n.prop("zmlist_titleText"));
	showWaitJs = $.i18n.prop("zmlist_showWaitInfo");
})
// --------------------- end -----------------------------
function plusReady(){
	var webv = plus.webview.currentWebview(),
		curl=upre + "/app/memb/membca!applist.action",listLast= 0;
	write   = webv.write || "N";
	address = webv.address;
	lockName= webv.lockName;
	window.addEventListener('ppreload',webinit,false);
	window.addEventListener('getnewlist',webinit,false);
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "zmlist.html"}
	});
	
 	function webinit(e){
 		var detail = e.detail;//带参数的话通过detail获取
 		if(detail){
 			write = detail.write;
 			address = detail.address;
 			lockName= detail.lockName;
 		}
		infoinit();
		webv.show("slide-in-right");
	}
 	
 	infoinit();
	function infoinit(){
		// 设置状态栏 @since liujun 2018-11-30
		conf.setDarkStatusbar();
		var ts = new Date().getTime();
		if (listLast !== 0 && (ts - listLast) < 1000) {
			return;
		}
		listLast = ts;
		$("#zmlist").empty();
		plus.nativeUI.showWaiting(showWaitJs);
		try {
			mui.ajax(curl, {
				type: "get",
				dataType: "html",
				success: function(infs) {
					plus.nativeUI.closeWaiting();
					var infs=$(infs);
					$("#zmlist").append(infs);
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

//整体滑动暂不支持android手机，因为两个页面的移动动画，无法保证同步性；
mui.init({
	swipeBack: false,
	beforeback:function(){
		// @since liujun 2018-11-30 返回index.html，重新设置状态栏颜色
		var webv = plus.webview.currentWebview();
		var openerPage = webv.opener();
		console.log("opener html is " + openerPage.id);
		if (openerPage.id == "zmaApp" || openerPage.id == "index.html") {
			mui.fire(openerPage, "ppreload");
			webv.close();
			return false;
		}
		return true;
	}
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});

// item -> content
function appdetail(id, appType){
	console.log("app detail appType is: " + appType);
	var self = plus.webview.currentWebview(),
		openerId = self.id;
	var dpage = plus.webview.getWebviewById("zmdetail.html");
	// re-preload: can't preload in autoShow: false page
	if(dpage == null){
        dpage = mui.openWindow({url: "zmdetail.html",
            extras:{
               aid:id,openerId:openerId,write:write,address:address,lockName:lockName, appType:appType
            }});
        return;
    }else{
        console.log(dpage.id);
        mui.fire(dpage,'ppreload',{
            aid:id,openerId:openerId,write:write,address:address,lockName:lockName, appType:appType
        });
    }
}