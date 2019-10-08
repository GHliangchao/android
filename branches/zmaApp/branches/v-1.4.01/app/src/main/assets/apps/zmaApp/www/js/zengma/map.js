var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	map = null;

function plusReady() {
	var curr = plus.webview.currentWebview(),
		lng = curr.lng || "",
		lat = curr.lat || "",
		zclockId = curr.zclockId,
		confirm = $("#confirm"),
		cancel = $("#cancel"),
		locateUrl = upre + "/app/memb/zcode_lock!uploadLocation.action";
	
	window.addEventListener("ppreload", webInit, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {
			redirect: "map.html"
		}
	});
		
	function webInit(e) {
		var detail = e.detail;
		if(detail){
			lng = detail.lng || "",
			lat = detail.lat || "",
			zclockId = detail.zclockId;
		}
		initMap();
	}
	
	initMap();
	confirm.click(uploadPosition);
	cancel.click(function(){
		curr.close();
	});
	
	function initMap() {
		curr.show("slide-in-right");
		if (lng === "" || lat === "") {
			plus.nativeUI.alert("未获取位置信息，请在空旷的位置上报", okCB, "提示", "确定");
			function okCB(){
				mui.back();
			}
		}
		plus.nativeUI.showWaiting("正在加载中~~");
		if (!map) {
			map = new plus.maps.Map("map");
		}
		var ptObj = new plus.maps.Point(lng, lat);
		var markObj = new plus.maps.Marker(ptObj);
		// 使用的时高德地图
		plus.maps.Map.reverseGeocode(ptObj, {coordType: "gcj02"}, function(e){
			var address = e.address;
			var bubble = new plus.maps.Bubble(address);
			var showLng = parseFloat(ptObj.getLng()).toFixed(6);
			if (ptObj.getLng() >= 0) {
				showLng = showLng + "°E";
			} else {
				showLng = Math.abs(showLng) + "°W";
			}
			var showLat = parseFloat(ptObj.getLat()).toFixed(6);
			if (ptObj.getLat() >= 0) {
				showLat = showLat + "°N";
			} else {
				showLat = Math.abs(showLat) + "°S";
			}
			markObj.setLabel("(" + showLat + "," + showLng + ")");
			markObj.setBubble(bubble, true);
			map.centerAndZoom(ptObj, 8);
			map.addOverlay(markObj);
			plus.nativeUI.closeWaiting();
		}, function(e){
			plus.nativeUI.closeWaiting();
			console.error(JSON.stringify(e));
			plus.nativeUI.alert("出错啦！",function(){},"提示","确定");
		});
	}
	
	function uploadPosition(){
		plus.nativeUI.showWaiting("正在上传位置中~~");
		confirm.unbind();
		mui.ajax(locateUrl, {
			data: {
				"lng": lng,
				"lat": lat,
				"lockId": zclockId
			},
			dataType: "json",
			type: "POST",
			success: function(res){
				plus.nativeUI.closeWaiting();
				confirm.click(uploadPosition);
				if (res.ret === 0) {
					plus.nativeUI.alert(res.msg, okCB, "提示", "确定");
					function okCB(){
						curr.close();
					}
				} else {
					plus.nativeUI.alert(res.msg,function(){},"提示","确定");
				}
			},
			error: function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				confirm.click(uploadPosition);
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
}

mui.init();
mui.plusReady(function() {
	conf.uiInit();
//	em = document.getElementById("map");
	plusReady();
});
