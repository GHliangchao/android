var conf = zengma_conf,upre = conf.getUrlPrefix();

//i18n 国际化资源 @since liujun 2018-02-24
//------------------start--------------------
var okJs, errorJs;
i18n.readyI18n(function(){
	$("#protocolText").html($.i18n.prop("protocol_titleText"));
	$("#btnOk").html($.i18n.prop("protocol_btnOk"));
	okJs    = $.i18n.prop("tan_ok");
	errorJs = $.i18n.prop("protocol_js_errorJs");
});
//------------------end--------------------

function plusReady() {
	var webv = plus.webview.currentWebview();
	
	window.addEventListener("ppreload", initInfo, false);
    var hurl = upre + "/app/public!loginChooseDetail.action";
    var lang = (jQuery.i18n.browserLang().substring(0, 2));
    if(lang != "zh" && lang != "en"){
		lang = "en";
	}
    initInfo();
    
    function initInfo(){
    	// 设置状态栏 @since liujun 2018-11-30
    	conf.setDarkStatusbar();
    	webv.show("slide-in-right");
    	plus.nativeUI.showWaiting();
        mui.ajax(hurl,{
            type:"GET",
            data:{
           	 	lang: lang
            },
            dataType:"json",
            success:function(e){
           	 	plus.nativeUI.closeWaiting();
           	 	console.log("success:"+e.msg);
                 if(e.ret == 0){
                    $("#content").empty();
                    $("#content").html(e.msg);
                 }
                 if(e.ret == 1){
                     $.dialog({content: e.msg, ok: okJs, modal:true});
                 }
            },
            error:function(xhr, type, cause){
           	 	plus.nativeUI.closeWaiting();
                $.dialog({content: errorJs, ok: okJs, modal:true});
                console.log("help - failed");
            }
       });
    }
    
    $("#openRegister")[0].addEventListener("tap", openRegister, false);
    $("#openLogin")[0].addEventListener("tap", openLogin, false);
    
    function openRegister(){
    	var url = "register.html";
		var dpage = plus.webview.getWebviewById(url);
		console.log("open webview page is " + dpage);
		if(dpage == null){
			mui.preload({url:url});
		} else {
			mui.fire(dpage, "ppreload");
		}
	}
    
    function openLogin(){
    	var url = "login.html";
		var dpage = plus.webview.getWebviewById(url);
		console.log("open webview page is " + dpage);
		if(dpage == null){
			mui.preload({url:url, extras:{backIndex: false}})
		} else {
			mui.fire(dpage, "ppreload", {
				backIndex: false
			});
		}
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