var conf = zengma_conf,upre = conf.getUrlPrefix();
window.retains={'beidou_mul.html':true};
function plusReady(){
    console.log("plusReady()");
    var webv = plus.webview.currentWebview(),
        curl = upre + "/app/memb/mpge_zcode!judgelogin.action";
    window.addEventListener('ppreload', webinit, false);
    window.addEventListener('getnewlist', webinit, false);
    window.ajaxerror = Access.newAjaxErrorHandler({
          extras: {redirect:"beidou_mul.html"}
    });
    
    webinit();
    function webinit(){
        infoinit();
        webv.show("slide-in-right");
    }
    function infoinit(){
        console.log("infoinit()--");
        mui.ajax(curl,{
             type:"GET",
             dataType:"json",
             success: function(e){
                 console.log("不需要登陆");
             },
             error:function(xhr, type, cause){
                 ajaxerror(xhr, type, cause);
             }
         })
    }
}

mui.init({
      swipeBack: false
});
mui.plusReady(function(){
      plusReady();
      conf.uiInit();
});
