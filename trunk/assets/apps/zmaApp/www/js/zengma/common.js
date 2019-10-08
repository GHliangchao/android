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

function gotoindex() {
	var dpage = plus.webview.getWebviewById("index.html");
	if (dpage == null) {
		mui.openWindow({
			url: "index.html"
		});
	} else {
		mui.fire(dpage, "ppreload");
	}
}

function gotocenter() {
	var dpage = plus.webview.getWebviewById("member_center.html");
	if (dpage == null) {
		mui.openWindow({
			url: "member_center.html"
		});
	} else {
		mui.fire(dpage, "ppreload");
	}
}

function gotohelp() {
	var dpage = plus.webview.getWebviewById("help.html");
	if (dpage == null) {
		mui.openWindow({
			url: "help.html"
		})
	} else {
		mui.fire(dpage, "ppreload");
	}
}

function gotolock() {
	var dpage = plus.webview.getWebviewById("lock.html");
	if (dpage == null) {
		mui.openWindow({
			url: "lock.html"
		});
	} else {
		mui.fire(dpage, "ppreload");
	}
}

function gotologin() {
	var self = plus.webview.currentWebview();
	mui.openWindow({
		url: 'login.html',
		extras: {
			redirect: self.id,
			isfresh: true
		}
	});
}

function gotoSecurity() {
	var dpage = plus.webview.getWebviewById("scan_security.html");
	if (dpage == null) {
		mui.openWindow({
			url: "scan_security.html"
		});
	} else {
		mui.fire(dpage, "ppreload");
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
