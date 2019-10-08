var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	opType, address;
	
function plusReady(){
	var currentWebview = plus.webview.currentWebview(),
		read = $("#read"),
		writeBtn = $("#writeBtn"),
		write = $("#write");
		opType  = currentWebview.opType;
		address = currentWebview.address;
	window.addEventListener("ppreload", webinit, false);
	window.addEventListener("getnewlist", getnewlist, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "zcNFC.html"}
	});
	
	function webinit(e){
		var detail = e.detail;
		opType = detail.opType;
		initInfo();
	}
	
	function getnewlist(){
		initInfo();
	}
	
	initInfo();
	
	function initInfo(){
	    currentWebview.show("slide-in-right");
		// 绑定写入NFC的点击事件 @since liujun 2018-04-08
		writeBtn[0].addEventListener("tap", writeNFC, false);
		if (opType === 'w') {
			write.show();
		} else {
			read.show();
		}
	}
	
	// 写入NFC操作 @since liujun 2018-04-08
	function writeNFC(){
		var data = $("#content").val();
		console.log("写入甄码的数据："+data);
		var options = {cardId: address, format: "txt"};
		options.data = data;
		
		plus.blelock.nfcWrite({
			success: success,
			error: error,
			options: options
		});
		
		function success(result){
			console.log("写入甄码成功："+JSON.stringify(result));
			currentWebview.close();
		}
		
		function error(result){
			console.log("写入甄码失败："+JSON.stringify(result));
			$.dialog({
				content: result.message,
				ok:"确定"
			});
		}
	}
}

mui.init();
mui.plusReady(function(){
	conf.uiInit();
	plusReady();
});
