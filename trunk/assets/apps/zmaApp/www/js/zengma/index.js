var main = null,conf = zengma_conf,upre = conf.getUrlPrefix();
function plusReady() {
	var webv = plus.webview.currentWebview();
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "index.html"}
	});
	conf.onNetChange();
	getindex();
	window.addEventListener("getnewlist", getindex, false);
	window.addEventListener('ppreload',function(event){
		getindex();
		webv.show("slide-in-right");
	});
	function getindex(){
		var opener=webv.opener();
		if(opener!=null){
			var openerid=opener.id;
			if(openerid=="forget.html"){
				opener.close();
			}
		}
	}
	
}

var listLast = 0;
function judgeLogin(openWindow){
	var ts = new Date().getTime();
	if (listLast != 0 && (ts - listLast) < 1000) {
		return;
	}
	listLast = ts;
	var curl = upre + "/app/memb/mpge_zcode!judgelogin.action";
	mui.ajax(curl,{
        type:"GET",
        dataType:"json",
        success: function(e){
        	openWindow();
        },
        error:function(xhr, type, cause){
            ajaxerror(xhr, type, cause);
        }
    });
}

mui.plusReady(function(){
	main = plus.webview.currentWebview();
	conf.uiInit();
	plusReady();
	var exit = newExitHandler();
	mui.init({
		beforeback: exit
	});
})

// 处理从后台恢复
//document.addEventListener('newintent',function(){
//},false);
