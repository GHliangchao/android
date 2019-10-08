var conf = zengma_conf,upre = conf.getUrlPrefix();
window.retains={'cartlist.html':true};

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
i18n.readyI18n(function(){
	$("#cartlistText").html($.i18n.prop("cartlist_titleText"));
	$("#caManageText").html($.i18n.prop("cartlist_caManageText"));
	$("#caInfoText").html($.i18n.prop("cartlist_caInfoText"));
	$("#ctlManageText").html($.i18n.prop("cartlist_ctlManageText"));
	$("#ctlInfoText").html($.i18n.prop("cartlist_ctlInfoText"));
	$("#appManageText").html($.i18n.prop("cartlist_appManageText"));
	$("#appInfoText").html($.i18n.prop("cartlist_appInfoText"));
});
//------------------ end --------------------

function plusReady(){
    console.log("plusReady()");
    var webv = plus.webview.currentWebview(),
        curl = upre + "/app/memb/mpge_zcode!judgelogin.action";
    window.addEventListener('ppreload', webinit, false);
    window.addEventListener('getnewlist', webinit, false);
    window.ajaxerror = Access.newAjaxErrorHandler({
          extras: {redirect:"cartlist.html"}
    });
    
    webinit();
    function webinit(){
        //infoinit();
    	// 设置状态栏 @since liujun 2018-11-30
		conf.setDarkStatusbar();
        webv.show("slide-in-right");
    }
    function infoinit(){
        console.log("infoinit()--");
        mui.ajax(curl,{
             type:"GET",
             dataType:"json",
             success: function(e){
            	 if(conf.debug){
            		 console.log("不需要登陆");
            	 }
             },
             error:function(xhr, type, cause){
                 ajaxerror(xhr, type, cause);
             }
         })
    }
}

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