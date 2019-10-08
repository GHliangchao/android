// popup module application
// @since 2016-05
(function(window, mui){
	var conf = zengma_conf;
	// init
	mui.init({
		swipeBack: false
	});
	mui.plusReady(plusReady);
	
	// funs
	function plusReady(){
		var cweb = plus.webview.currentWebview(), pop;
		conf.uiInit();
		pop = new Popup(cweb.options)
		pop.show();
	}
	
})(window, mui);
