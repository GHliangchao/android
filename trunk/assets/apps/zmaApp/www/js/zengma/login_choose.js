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
	plus.nativeUI.showWaiting();
    var hurl = upre + "/app/public!loginChooseDetail.action";
    var lang = (jQuery.i18n.browserLang().substring(0, 2));
    if(lang != "zh" && lang != "en"){
		lang = "en";
	}
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


mui.init({
	swipeBack: false
});
mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});