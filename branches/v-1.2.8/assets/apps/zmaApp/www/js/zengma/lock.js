var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	devices = {};
function plusReady() {
	var webv = plus.webview.currentWebview(),
		searchBtn = $("#search"),
		searchAgain = $("#searchAgain"),
		load = $("#load");
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "lock.html"}
	});
//	window.addEventListener("getnewlist", getindex, false);
	// @since liujun 2018-04-16
	// 关闭这个页面的时候，如果还在扫描甄码锁，就停止扫描甄码锁
	mui.currentWebview.addEventListener("close", closeHandler, false);
	function closeHandler(){
		var scanState = $(".bottom").text().trim();
		if(scanState == "停止扫描"){
			load.hide();
			plus.blelock.stopScan();
		}
	}
	window.addEventListener('ppreload',function(event){
		scanLock();
		webv.show("slide-in-right");
	});
	searchBtn.click(scanLock);
	searchAgain.click(scanLock);

	function scanLock(){
		var scanState = $(".bottom").text().trim();
		if (scanState == "搜索甄码锁") {
			$("#lockList").empty();
			devices = {};
			$("#search").html("停止扫描");
			load.show();
			$("#none").hide();
			
			plus.blelock.scan({
				success:select,
				error:function(e){
					$("#search").html("搜索甄码锁");
					load.hide();
					for (a in devices) {
						$(".lock_list_in").click(gotoDetail);
						return;
					}
					$("#none").show();
				}
			});
			return;
		}
		if (scanState == "停止扫描") {
			$("#search").html("搜索甄码锁");
//			plus.nativeUI.closeWaiting();
			load.hide();
			plus.blelock.stopScan();
			for (a in devices) {
				$(".lock_list_in").click(gotoDetail);
				return;
			}
			$("#none").show();
			return;
		}
	};
	
	function select(discover){
		// 当扫描到甄码锁的时候，就将没有甄码锁的提示隐藏掉
		// @since liujun 2018-04-16
		$("#none").hide();
		var lockList = $("#lockList"),
			device = discover.device;
		if(devices[device.address]){
			return;
		}
		devices[device.address] = device;
		//display
		var content = '<div class="lock_list_in" name="'
			+ device.name + '" address="'
			+ device.address + '" code="'
			+ device.code +'" >'
			+ '<b>' + device.name +'</b><br />'
			+ '状态：<span>' + statusText(device) + '</span>'
			+ '</div>';
		lockList.append(content);
	}
	
	function statusText(device){
		var text = "";
		if (device.status != -1) {
			text = device.status.toString(16);
			if (text.length === 1) {
				text = "0" + text;
			}
			// 解析扫描返回的状态码  @since liujun 2018-04-02
			if(text == 01){
				text = "可重用";
			}else if(text == 02){
				text = "授权";
			}else if(text == 04){
				text = "故障";
			}else if(text == 08){
				text = "版本不兼容";
			}else if(text == 11){
				text = "可重用，开锁";
			}else if(text == 12){
				text = "授权，开锁";
			}else if(text == 14){
				text = "故障，开锁";
			}else if(text == 18){
				text = "版本不兼容，开锁";
			}else if(text == 21){
				text = "可重用，关锁";
			}else if(text == 22){
				text = "授权，关锁";
			}else if(text == 24){
				text = "故障，关锁";
			}else if(text == 28){
				text = "版本不兼容，关锁";
			}
		}
		return text;
	}
	
	function gotoDetail(){
		var name = $(this).attr("name"),
			address = $(this).attr("address"),
			code = $(this).attr("code");
		if(name == undefined){
			return;
		}
		var page = plus.webview.getWebviewById("lock_detail.html");
		if (page == null) {
			mui.openWindow({
				url:"lock_detail.html",
				extras:{
					"name" : name,
					"address": address,
					"code": code
				}
			});
		} else {
			mui.fire(page, "ppreload", {"name" : name, "address": address, "code": code});	
		}	
	}	
}

mui.plusReady(function(){
	conf.uiInit();
	plusReady();
})
