(function(win, doc, $){
	//i18n国际化资源 @since liujun 2018-02-27
	//------------------start--------------------
	var parameterErJs, okJs, openBluetoothJs, openBluErJs;
	i18n.readyI18n(function(){
		parameterErJs  = $.i18n.prop("common_js_parameterEr");
		okJs	       = $.i18n.prop("tan_ok");
		openBluetoothJs= $.i18n.prop("common_js_openBluetooth");
		openBluErJs	   = $.i18n.prop("common_js_openBleError");
	});
	//------------------ end --------------------
//	console.log(jQuery("#gotoindex")[0]+"----"+$);
	// 绑定事件
	var gotoIndex = jQuery("#gotoindex");
	if(gotoIndex.size() > 0){
		gotoIndex[0].addEventListener("tap", gotoindex, false);
	}
	jQuery("#gotolock")[0].addEventListener("tap", gotolock, false);
//	jQuery("#gotoSecurity")[0].addEventListener("tap", gotoSecurity, false);
	jQuery("#gotohelp")[0].addEventListener("tap", gotohelp, false);
	jQuery("#gotocenter")[0].addEventListener("tap", gotocenter, false);
	
	function gotoindex() {
		console.log("upre is "+ upre);
		var url = "index.html";
		openWebviewUrl(url);
	}

	function gotocenter() {
		var url = "member_center.html";
		openWebviewUrl(url);
	}

	function gotohelp() {
		var url = "help.html";
		openWebviewUrl(url);
	}

	function gotolock() {
		var url = "/lock.html";
		openWebviewUrl(url);
	}

	function gotologin() {
		var self = plus.webview.currentWebview();
		var data = {
				redirect: self.id,
				isfresh: true
		};
		var url = "login.html";
		openWebviewUrl(url, data);
	}

	function gotoSecurity() {
		var url = "scan_security.html";
		openWebviewUrl(url);
	}
	
	function loginjudge(openWindow){
		console.log("judge login function()");
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
	
	function openWebviewUrl(webviewUrl, data) {
		if (win.lockService != undefined){
			var service = win.lockService;
			service.close();
			win.lockService = null;
		}
		loginjudge(operate);
		
		function operate() {
			var dpage = plus.webview.getWebviewById(webviewUrl);
			console.log("open webview url is" + webviewUrl+", and data is " + JSON.stringify(data));
			if (data){
				if (dpage == null) {
					mui.preload({url: webviewUrl, extras: data});
				} else {
					mui.fire(dpage, "ppreload", data);
				}
			} else {
				if (dpage == null) {
					mui.preload({url: webviewUrl});
				} else {
					mui.fire(dpage, "ppreload");
				}
			}
		}
		
	}

	function openBluetooth(successCB, errorCB){
		if(!$.isFunction(successCB)){
			$.dialog({
				content:parameterErJs,
				ok:okJs
			});
			return;
		}
		if(mui.os.android){
			var main, BluetoothAdapter, BAdapter;
			main = plus.android.runtimeMainActivity();
			BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
			BAdapter = BluetoothAdapter.getDefaultAdapter();
			if(!BAdapter.isEnabled()){
				open();
				function open(){
					BAdapter.enable();
					plus.nativeUI.showWaiting(openBluetoothJs);
					setTimeout(function(){
						if(!BAdapter.isEnabled()){
							plus.nativeUI.closeWaiting();
							mui.toast(openBluErJs);
							if($.isFunction(errorCB)){
								errorCB();
							}
						} else {
							plus.nativeUI.closeWaiting();
							successCB();
						}
					},3000);
				}
			} else {
				successCB();
			}
		} else {
			successCB();
		}
	}
	
	win.gotoindex = gotoindex;
	win.gotocenter = gotocenter;
	win.gotohelp = gotohelp;
	win.gotolock = gotolock;
	win.gotologin = gotologin;
//	win.gotoSecurity = gotoSecurity;
	win.openWebviewUrl = openWebviewUrl;
	win.openBluetooth = openBluetooth;
})(window, document, jQuery)

