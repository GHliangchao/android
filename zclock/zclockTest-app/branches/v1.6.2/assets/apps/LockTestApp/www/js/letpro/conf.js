(function(wnd, doc,mui){
	var html  = doc.getElementsByTagName('html')[0],
		width = doc.documentElement.clientWidth,
		letpro_conf =
		{
			appName:"锁测试",
			"debug":false,
			"ifaceDebug":false,
			rem:    width / 25,
			schema: "http",
			shost:  "127.0.0.1",
			sport:  "8080",
			ctxPath: "",
			getUrlPrefix: urlp,
			noop: noop,
			onNetChange:onNetChange,
			uiInit: uiInit,
			statusBarBackground: "#00A2FF",
			statusBarStyle: "UIStatusBarStyleBlackOpaque",
			bleTest: false,
			version: "1.6.2"/* @since 2018-03-18 pzp */
		};
		
	function urlp(){
		var s = this; 
		return (s.schema+"://"+s.shost+":"+s.sport+s.ctxPath);
	}
	
	function noop(){}
	
	function onNetChange(){
		var nt = plus.networkinfo.getCurrentType();
		console.log("net change");
		switch(nt){
			case plus.networkinfo.CONNECTION_ETHERNET:
			case plus.networkinfo.CONNECTION_WIFI:
			case plus.networkinfo.CONNECTION_CELL2G:
			case plus.networkinfo.CONNECTION_CELL3G:
			case plus.networkinfo.CONNECTION_CELL4G:
				if(typeof wnd.netConnected === "function"){
					wnd.netConnected(nt);
				}
				break;
			default:
				plus.nativeUI.toast("无法连接网络", {duration: "long"});
				if(typeof wnd.netDisconnected === "function"){
					wnd.netDisconnected(nt);
				}
				break;
		}
	}
	
	function uiInit(){
		var nav, conf = letpro_conf;
		if(plus){
			// - net
			doc.addEventListener("netchange", onNetChange, false);
			// - statusbar
			nav = plus.navigator;
			nav.setStatusBarBackground(conf.statusBarBackground);
			nav.setStatusBarStyle(conf.statusBarStyle);
			// - set font-size
			setFontSize();
		}

		function setFontSize(){
			var android, self, res, cnf;
			var fontScale = 1.0;
			try{
				if(android=plus.android){
					self = android.currentWebview();
					res  = android.invoke(self,"getResources");
					cnf  = android.invoke(res, "getConfiguration");
					fontScale = android.getAttribute(cnf, "fontScale");
				}
			}catch(e){}
			html.style.fontSize = width / 25 / fontScale + 'px';
		}

	}
	html.style.fontSize = width / 25  + 'px';
	mui.init();
	wnd.letpro_conf = letpro_conf;
})(window, document,mui);
