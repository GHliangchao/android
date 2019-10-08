var conf = zengma_conf, upre = conf.getUrlPrefix();

function plusReady() {
	var webv = plus.webview.currentWebview();
	
	window.addEventListener("ppreload", ppreload, false);
	
	initInfo();
	
	function ppreload(){
		dropPage();
		webv.show("slide-in-right");
	}
	function initInfo(){
		webv.show("slide-in-right");
	}
	
	$("#ownerProduct")[0].addEventListener("tap", clickOwner, false);
	$("#otherProduct")[0].addEventListener("tap", clickOther, false);
	
	function clickOwner(){
		if(conf.debug && conf.closeNFC){
			var pageUrl = "/query_result.html";
			var dpage = plus.webview.getWebviewById(pageUrl);
			var codeSn = "150000000005",code = "74835df622f7ebf9",version="1";
			
			if(dpage == null) {
				mui.preload({url: pageUrl, extras:{
					codeSn: codeSn,code: code,version: version
				}});
			} else {
				mui.fire(dpage, "preloading", {
					codeSn: codeSn,code: code,version: version
				});
			}
			return;
		}
		
		var options = {cardId:""};
		
        plus.blelock.scanSecretCodeNfcRead({
    		success: success,
    		error: error,
    		options: options
    	});
    	
    	function error(res) {
			console.log("读NFC失败结果："+JSON.stringify(res));
			showMsg(res.message);
		}
    	
    	function success(res){
    		if(conf.debug){console.log("success: " + JSON.stringify(res));}
    		if(res.result == 0) {
    			if(res.message == "backclick"){
    				return;
    			}
    			
    			var code = res.code;
				var codeSn = res.codeSn;
				var version = res.version;
    			var pageUrl = "/query_result.html";
    			var dpage = plus.webview.getWebviewById(pageUrl);

    			if (conf.debug) {  // 测试用例
    			    codeSn  = "150000000005";
    			    code    = "74835df622f7ebf9";
    			    version = "1";
    			}
    			
    			if(dpage == null) {
    				mui.preload({url: pageUrl, extras:{
    					codeSn: codeSn,code: code,version: version
    				}});
    			} else {
    				mui.fire(dpage, "preloading", {
    					codeSn: codeSn,code: code,version: version
    				});
    			}
    			return;
    		}
    		showMsg(res.message);
    	}
	}
	
	function clickOther(){
		var url = "/choose_express.html";
		var page= plus.webview.getWebviewById(url);
			
		if(page == null){
			mui.preload({url: url, extras:{gid: ""}});
		} else {
			mui.fire(page, "preloading", {gid: ""});
		}
	}
}

mui.init({
	swipeBack: false
});

mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});