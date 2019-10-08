// conf.js
// export config module.
// 
// @since 2019-02-25
//
(function(win, doc){
	var config = {
		uiInit: uiInit,
		statusBarStyle: "UIStatusBarStyleBlackTranslucent"
	};
	
	uiInit();
	win.config = config;
	
	function uiInit(){
		initFont();
		mui.init();
		mui.plusReady(plusReady);
	  
		function initFont(){
			var w = win.screen.width;
			var html = doc.getElementsByTagName("html");
			
			config.fontsize = w / 37.5;
			html[0].style.fontSize =  config.fontsize+"px";
		}
		
		function plusReady(){
			var webviewStyle = {
				// 弹出软键盘时自动改变webview的高度
				softinputMode: "adjustResize"
			};
			plus.navigator.setStatusBarStyle(config.statusBarStyle);
			plus.webview.currentWebview().setStyle(webviewStyle);
		}
	}
  
})(window, document);
