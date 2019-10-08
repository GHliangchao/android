var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	devices = {};

//i18n国际化资源 @since liujun 2018-02-27
//------------------start--------------------
var searchText, statusTxt, reusing, stopScanText, authorizationTxt,
	faultTxt, incompatibilityTxt, reusableAnOpLockTxt, authorizationAndOpLockTxt,
	faultAndOpLockTxt, reusableAndClLockTxt, authorizationAndClLockTxt,
	faultAndClLockTxt, incompatibleAndClLockTxt;
i18n.readyI18n(function(){
	$("#titleText").html($.i18n.prop("scan_lock_titleText"));
	$("#searchTxt").html($.i18n.prop("scan_lock_searchTxt"));
	$("#noLockText").html($.i18n.prop("scan_lock_noMCLcode"));
	$("#searchAgain").html($.i18n.prop("scan_lock_rescan"));
	$("#search").html($.i18n.prop("scan_lock_searchBtn"));
	searchText = $.i18n.prop("scan_lock_searchBtn");
	statusTxt  = $.i18n.prop("scan_lock_status");
	stopScanText= $.i18n.prop("scan_lock_stopScanBtn");
	reusingText= $.i18n.prop("scan_lock_reusingText");
	authorizationTxt = $.i18n.prop("scan_lock_authorizationTxt");
	faultTxt = $.i18n.prop("scan_lock_faultTxt");
	incompatibilityTxt = $.i18n.prop("scan_lock_incompatibilityTxt");
	reusableAnOpLockTxt= $.i18n.prop("scan_lock_reusableAnOpLockTxt");
	faultAndOpLockTxt  = $.i18n.prop("scan_lock_faultAndOpLockTxt");
	reusableAndClLockTxt=$.i18n.prop("scan_lock_reusableAndClLockTxt");
	faultAndClLockTxt  = $.i18n.prop("scan_lock_faultAndClLockTxt");
	incompatibleAndOpLockTxt  = $.i18n.prop("scan_lock_incompatibleAndOpLockTxt");
	authorizationAndClLockTxt = $.i18n.prop("scan_lock_authorizationAndClLockTxt");
	authorizationAndOpLockTxt = $.i18n.prop("scan_lock_authorizationAndOpLockTxt");
	incompatibleAndClLockTxt  = $.i18n.prop("scan_lock_incompatibleAndClLockTxt");
});
//------------------ end --------------------

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
		if(scanState == stopScanText){
			load.hide();
			plus.blelock.stopScan();
		}
	}
	// 设置状态栏 @since liujun 2018-11-30
	conf.setDarkStatusbar();
	window.addEventListener('ppreload',function(event){
//		scanLock();
		webinit();
	});
	// 重置成功返回
	window.addEventListener("resetSucc", function(){
		console.log("重置成功返回");
		$("#lockList").html("");
		$("#none").show();
		dropPage();
	}, false);
	searchBtn.click(scanLock);
	searchAgain.click(scanLock);
	
	webinit();
	function webinit(){
		webv.show("slide-in-right");
	}

	function scanLock(){
		console.log("scanLock");
		var scanState = $(".bottom").text().trim();
		if (scanState == searchText) {
			$("#lockList").empty();
			devices = {};
			$("#search").html(stopScanText);
			load.show();
			$("#none").hide();
			
			plus.blelock.scan({
				success:select,
				error:function(e){
					$("#search").html(searchText);
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
		if (scanState == stopScanText) {
			$("#search").html(searchText);
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
			+ statusTxt +'：<span>' + statusText(device) + '</span>'
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
				text = reusingText;
			}else if(text == 02){
				text = authorizationTxt;
			}else if(text == 04){
				text = faultTxt;
			}else if(text == 08){
				text = incompatibilityTxt;
			}else if(text == 11){
				text = reusableAnOpLockTxt;
			}else if(text == 12){
				text = authorizationAndOpLockTxt;
			}else if(text == 14){
				text = faultAndOpLockTxt;
			}else if(text == 18){
				text = incompatibleAndOpLockTxt;
			}else if(text == 21){
				text = reusableAndClLockTxt;
			}else if(text == 22){
				text = authorizationAndClLockTxt;
			}else if(text == 24){
				text = faultAndClLockTxt;
			}else if(text == 28){
				text = incompatibleAndClLockTxt;
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
		console.log("goto detail mac address:" + address);
		var page = plus.webview.getWebviewById("/lock_detail.html");
		if (page == null) {
			mui.preload({
				url:"/lock_detail.html",
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

mui.init({
	swipeBack: false,
	beforeback:function(){
		// @since liujun 2018-11-30 返回index.html，重新设置状态栏颜色
		var webv = plus.webview.currentWebview();
		var openerPage = webv.opener();
		console.log("opener html is " + openerPage.id);
		if (openerPage.id == "zmaApp" || openerPage.id == "index.html") {
			mui.fire(openerPage, "ppreload");
			webv.close();
			return false;
		}
		return true;
	}
});

mui.plusReady(function(){
	conf.uiInit();
	plusReady();
})
