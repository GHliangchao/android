var conf = zengma_conf;

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
i18n.readyI18n(function(){
	$("#resultText").html($.i18n.prop("scanresult_titleText"));
});
//------------------ end --------------------

function plusReady(){
	var wc = plus.webview.currentWebview(),
		result = mui("#result")[0],
		info = wc.info;
		wc.setStyle({popGesture:'none'});
	result.innerHTML = info;
	window.addEventListener("ppreload", function(e){
		var detail = e.detail;
		result.innerHTML = detail.info;
		webinit();
	}, false);
	
	webinit();
	function webinit(){
		wc.show("slide-in-right");
	}
}
mui.init({
	beforeback:function(){
		var wb = plus.webview.currentWebview().opener();
		mui.fire(wb,'ppreload');
		return true;
	}
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});