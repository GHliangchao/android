var conf = zengma_conf, upre = conf.getUrlPrefix();
//i18n 国际化资源 @since liujun 2018-02-24
//------------------start--------------------
var okJs;
i18n.readyI18n(function(){
	$("#helpText").html($.i18n.prop("help_titleText"));
	okJs = $.i18n.prop("tan_ok");
});
//------------------end--------------------
function plusReady(){
	var webv = plus.webview.currentWebview();
	window.addEventListener("ppreload", webinit, false);
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "help.html"}
	});
    webinit();
	function webinit(){
        initinfo();
		webv.show("slide-in-right");
	}
    function initinfo(){
    	// 设置状态栏 @since liujun 2018-11-30
		conf.setDarkStatusbar();
    	plus.nativeUI.showWaiting();
    	var lang = (jQuery.i18n.browserLang().substring(0, 2));
    	if(lang != "zh" && lang != "en"){
    		lang = "en";
    	}
    	var hurl = upre + "/app/public!help.action";
        mui.ajax(hurl,{
             type:"GET",
             data:{
            	 lang: lang
             },
             dataType:"json",
             success:function(e){
            	 plus.nativeUI.closeWaiting();
                  if(e.ret == 0){
                     $("#help").empty();
                     $("#help").html(e.msg);
                  }
                  if(e.ret == 1){
                      $.dialog({content: e.msg, ok: okJs, modal:true});
                  }
             },
             error:function(xhr, type, cause){
            	 plus.nativeUI.closeWaiting();
            	 ajaxerror(xhr, type, cause);
                 console.log("help - failed");
             }
        });
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
mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});
