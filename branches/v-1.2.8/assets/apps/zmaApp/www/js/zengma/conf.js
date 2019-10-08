/*统一一下重新打开某个页面使用自定义事件ppreload，如果是在该页面重新加载的，使用自定义事件getnewlist
 	window.addEventListener('ppreload',webinit,false);
 	function webinit(e){
 		var detail = e.detail;带参数的话通过detail获取
		orderList();该方法加载页面内容
		webv.show("slide-in-right");
	}
 	window.addEventListener("getnewlist", orderList, false);
	var dpage= null;
	dpage = plus.webview.getWebviewById("_www/forum_category.html");
	if(dpage==null){
		mui.openWindow({url: "_www/forum_category.html"});
	}else{
		mui.fire(dpage, "ppreload");
	}
*/
(function(wnd, doc){
var 
dwid     = doc.documentElement.clientWidth,
html     = doc.getElementsByTagName('html')[0], 
zengma_conf = 
{
	appName:"甄码",
	"debug":false, 
	rem:    dwid / 25,
	schema: "http",
	shost:  "www.tuidianmg.com",//改为自己本地地址
	sport:  "80",//改为自己本地端口 这个文件如果就改host和端口的话就不用提交了
//	shost:  "192.168.3.89",//改为自己本地地址
//	sport:  "8080",//改为自己本地端口 这个文件如果就改host和端口的话就不用提交了
	ctxPath: "",
	getUrlPrefix: urlp,
	pageSize:  50, 
	pageDelay: 3000,
	curpos:    "curpos_key",
	coordType: "gcj02",
	"package": "com.tuidian.tech.zma",
	onNetChange:onNetChange,
	wrapURL: wrapURL,
	uiInit: uiInit,
	statusBarBackground: "#FFF",
	statusBarStyle: "dark",
	mapkey: "",
	premenu: true /*preload menu page? true if preload*/,
	menuId: "side",
	menuMainId: "menu.main.id",
	alert: alert,
	imgType: 'image/jpeg',
	initMenus: initMenus,
	noop: noop,
	iOSAppCid: 1 /*iOS App conf id*/
};
perf = null;
function noop(){}

//i18n国际化资源 @since liujun 2018-02-27
//------------------start--------------------
var okJs, cancelJs,networkErJs,needUpdateJs,
	startDownloadJs, downloadErJs,downloadedJs,
	installJs, installSuccJs, installErJs;
i18n.readyI18n(function(){
	okJs		   = $.i18n.prop("tan_ok");
	cancelJs	   = $.i18n.prop("tan_cancel");
	networkErJs    = $.i18n.prop("conf_js_networkEr");
	needUpdateJs   = $.i18n.prop("conf_js_needUpdate");
	startDownloadJs= $.i18n.prop("conf_js_startDownload");
	downloadErJs   = $.i18n.prop("conf_js_downloadError");
	downloadedJs   = $.i18n.prop("conf_js_downloaded");
	installJs      = $.i18n.prop("conf_js_install");
	installSuccJs  = $.i18n.prop("conf_js_installSucc");
	installErJs    = $.i18n.prop("conf_js_installEr");
});
//------------------ end --------------------

function urlp(){
	var s = this; 
	return (s.schema+"://"+s.shost+":"+s.sport+s.ctxPath);
}
function initMenus(){
	var menu;
	if(window.forum && (menu=window.forum.menu)){
		menu.init();
		return;
	}
	if(window.emall && (menu=window.emall.menu)){
		menu.init();
		return;
	}
}

function onNetChange(){
	var nt = plus.networkinfo.getCurrentType();
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
			plus.nativeUI.toast(networkErJs, {duration: "long"});
			if(typeof wnd.netDisconnected === "function"){
				wnd.netDisconnected(nt);
			}
			break;
	}
}
var realpath="";
function uiInit(){
	var nav, conf = this,
	cwv, opener;
	var upre = conf.getUrlPrefix();

	if(plus){
		// - net
		doc.addEventListener("netchange", onNetChange, false);
		// - statusbar
		nav = plus.navigator;
		nav.setStatusBarBackground(conf.statusBarBackground);
		nav.setStatusBarStyle(conf.statusBarStyle);
		setFontSize();
		//setIsRead();
		// - hide-opener
		cwv = plus.webview.currentWebview();
		if(cwv.hideOpener && (opener = cwv.opener())){
			cwv.addEventListener("show", function(){
				opener.hide();			
			}, false);
		}
		plus.runtime.getProperty(plus.runtime.appid,function(inf){
		     wgtVer=inf.version;
	    });
	  	mui.ajax(upre + "/app/index!checkUpdate.action", {
				type: "GET",
				dataType: "json",
				cache: false,
				success: function(infs) {
					plus.nativeUI.closeWaiting();
					if(conf.debug) {
						console.log(JSON.stringify(infs));
					}
					if(infs.ret == 0) {
						if(infs.msg!=undefined){
							var curversion=0,onlineversion=0;
							curversion=+getNumVersion(wgtVer);
							onlineversion=+getNumVersion(infs.msg);
							if(onlineversion>curversion){
								realpath=infs.realpath;
								if(realpath!= undefined&&realpath!=""){
									$.dialog({content:needUpdateJs, ok: okJs,cancel:cancelJs,modal:true,okCallback: callback});
									function callback(){
										downWgt(true);
									}
								}
							}else{
								console.log("已是最新版本了");
							}
						}
					}
				},error: function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
				}
			});
		function getNumVersion(version){
			var nversion=0;
			var arry=version.split(".");
			for(var i=0;i<arry.length;i++){
				if(i==0){
					nversion+=arry[i]*10000;
				}else if(i==1){
					nversion+=arry[i]*100;
				}else if(i==2){
					nversion+=arry[i]*1;
				}
			}
			return nversion;
		}
		
		function downWgt(key) {
            var w;
            if (key) {w = plus.nativeUI.showWaiting(startDownloadJs); }
            var options = {
                filename: "_doc/update/"
            };
            console.log("开始下载:"+upre+realpath);
            var dtask = plus.downloader.createDownload(upre+realpath, options, function(d, status) {
                if (status == 200) {
                    console.log("下载更新包成功：" + d.filename);
                    setTimeout(installWgt(d.filename, key), 2000); // 安装wgt包
                } else {
                    console.log("下载wgt失败！");
                    if (key) {
                        plus.nativeUI.alert(downloadErJs);
                    }
                }
            });
            if (key) {
                dtask.addEventListener("statechanged", function(task, status) {
                    switch (task.state) {
                        case 1: // 开始
                            w.setTitle("　　 "+startDownloadJs+"　　 ");
                            break;
                        case 2: // 已连接到服务器
                            w.setTitle("　　 "+startDownloadJs+"　　 ");
                            break;
                        case 3:
                            var a = task.downloadedSize / task.totalSize * 100;
                            console.log(a)
                            w.setTitle("　　 "+ downloadedJs + parseInt(a) + "%　　 ");
                            break;
                        case 4: // 下载完成
                            w.close();
                            break;
                    }
                });
            }
            dtask.start();

        }
        // 更新应用资源
    	function installWgt(path, key) {
        if (key) { plus.nativeUI.showWaiting(installJs);}
        plus.runtime.install(path, {}, function() {
            if (key) {
                  plus.nativeUI.closeWaiting();
                  //自动在线升级不重启
                   plus.nativeUI.alert(installSuccJs, function(){plus.runtime.restart();});
       	 	}
       		 console.log("安装apk文件成功！");
        }, function(e) {
			console.log("安装apk文件失败[" + e.code + "]：" + e.message);
               if (key) {
                   plus.nativeUI.closeWaiting();
                   plus.nativeUI.alert(installErJs);
               }
           });
       }
	}
	function setIsRead(){
		/*var point=mui("#unreadm")[0];
		if(point!=undefined){
			setInterval(function(){
				countMessages();
			}, 5000);
		}*/
	}
	function countMessages(){
		$.ajax({
				url:upre +"/app/index!countMessage.action",
				type:'get',
				dataType:"json",
				cache:false,
				success:function(data){
					var point=mui("#unreadm")[0];
					var count=data.message;
					if(count==0){
						point.innerHTML="";					
					}else{
						point.innerHTML="●";	
					}
				}
			})
	}
	function setFontSize(){
		var android, self, res, cnf;
		var fontScale = 1.0;
		try{
			if(mui.os.android){
				android = plus.android;
				self = android.currentWebview();
				res  = android.invoke(self,"getResources");
				cnf  = android.invoke(res, "getConfiguration");
				fontScale = android.getAttribute(cnf, "fontScale");
			}
		}catch(e){}
		html.style.fontSize = dwid / 25 / fontScale + 'px';
	}
}
	function wrapURL(url, settings){
		var config = mui.extend(true, {cache:false, useBase: true}, settings);
		if(config.cache === false){
			if(url.indexOf('?') === -1){
				url += '?';
			}else{
				url += '&';
			}
			url += "_=" + new Date().getTime();
		}
		if(config.useBase){
			url  = (wnd.base || "") + url;
		}
		return url;
	}

// init
html.style.fontSize = zengma_conf.rem+'px';
doc.addEventListener("error", function(e){
	if(zengma_conf.debug){
		console.error(e.message);
	}
}, false);
//在android4.4中的swipe事件，需要preventDefault一下，否则触发不正常
//故，在dragleft，dragright中preventDefault
wnd.addEventListener('dragright', function(e) {
	e.detail.gesture.preventDefault();
});
wnd.addEventListener('dragleft', function(e) {
	e.detail.gesture.preventDefault();
});

// export
wnd.zengma_conf = zengma_conf;
wnd.alert = function(options){
	var webv, pop = null;
	if(plus){
		if(typeof options === "string"){
			options = {content: options};
		}
		webv = plus.webview;
		pop  = webv.create('tan.html', 'tan.html', 
			{scrollIndicator:'none', background:'transparent'}, 
			{options: options}
		);
		pop.addEventListener("close",  closeHandler, false);
		pop.addEventListener("loaded", loadedHandler, false);
		return;
	}
	zengma_conf.alert(message);
	
	function loadedHandler(){
		if(pop != null){
			pop.show("none");
		}
	}
	
	function closeHandler(){
		pop = null;
	}
	
};

if(wnd.mui){
	// init-mui
	// - ui
	zengma_conf.mui_alert = wnd.mui.alert;
	wnd.mui.alert = function(message, cback, title, btnCap){
		console.log(message.toString() + "  " + title);
		wnd.alert({
			content: message, title: title,
			cfmAction: cback, cfmCap: btnCap
		});
	};
	// - ajax
	wnd.mui.ajaxSettings.crossDomain = true;
}

})(window, document);

// module path-tracer.
// exports retains - not closed page id -> {true|false} map.
(function(w, d){
	d.addEventListener('plusready', plusReady,false);
	
	function plusReady(){
		var self = plus.webview.currentWebview();
		var index= plus.webview.getLaunchWebview();
		var retains = w.retains || {};
		
		console.log("plusReady(): " + self.id);
		trace();
		
		// funs
		function trace(){
			var all = plus.webview.all();
			var path = {}, cur, id;
			var i, size;
			// path trace
			console.log("trace: opener path");
			cur = self;
			// 进入到当前页面的路径
			for(; cur; ){
				id = cur.id;
				path[id] = id;
				console.log("  <-" + id);
				cur = cur.opener();
			}
			// 得到父类的路径
			console.log("trace: parent path");
			cur = self;
			for(; cur; ){
				id = cur.id;
				path[id] = id;
				console.log("  <-" + id);
				cur = cur.parent();
			}
			// del page not in path
			size = all.length;
			for(i = 0; i < size; ++i){
				cur = all[i];
				id  = cur.id;
				console.log("page " + id);
				if(id && !path[id] && !retains[id] && cur != index){
					console.log("close " + id);
					cur.close("none");
				}
			}
		}
	}
	
})(window, document);
