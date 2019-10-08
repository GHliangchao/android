var nativeWebview, imm, InputMethodManager;
var initNativeObjects = function() {
	if (mui.os.android) {
		var main = plus.android.runtimeMainActivity();
		var Context = plus.android.importClass("android.content.Context");
		InputMethodManager = plus.android.importClass("android.view.inputmethod.InputMethodManager");
		imm = main.getSystemService(Context.INPUT_METHOD_SERVICE);
		imm.toggleSoftInput(0, InputMethodManager.SHOW_FORCED);
	} else {
		nativeWebview = plus.webview.currentWebview().nativeInstanceObject();
		nativeWebview.plusCallMethod({
              "setKeyboardDisplayRequiresUserAction": false
          });
	}
};


