var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	dpage = null;

function plusReady(){
	var webv = plus.webview.currentWebview(),
		curl=upre + "/app/memb/mpge_goods_verify!selGoodsDetails.action",
		boutId = webv.boutId;
	
	window.addEventListener('scanload', webinit ,false);
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "scan_verify_code_details.html"}
	});
	
 	function webinit(e){
 		console.log("goods details webinit");
 		var detail = e.detail; // 带参数的话通过detail获取
 		if (detail.boutId != undefined) {
 			boutId = detail.boutId;
 		}
 		infoinit();
 		webv.show("slide-in-right");
	}
 	
 	infoinit();
	function infoinit(){
		webv.show("slide-in-right");
		plus.nativeUI.showWaiting("正在查询商品详情");
		try{
			mui.ajax(curl, {
				type:"GET",
				dataType:"html",
				data:{
					boutId: boutId
				},
				success:function(infs){
					var goodsInfo = $("#goodsInfo");
					goodsInfo.empty();
					goodsInfo.html(infs);
					mui.previewImage(); // 设置图片的放大与缩小
					plus.nativeUI.closeWaiting();
				},
				error: function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		}catch(e){
			plus.nativeUI.closeWaiting();
			console.log(e.message);
		}
	}
	
}

function changeGoodsDetails(){
	var display = $("#zmdetails").css("display");
	if (display == "none") {
		$("#showAndHide").html("收起全部↑");
		$("#zmdetails").show();
	} else {
		$("#showAndHide").html("显示全部↓");
		$("#zmdetails").hide();
	}
}

//整体滑动暂不支持android手机，因为两个页面的移动动画，无法保证同步性；
mui.init({
	beforeback: function(){
		var openerPage = plus.webview.currentWebview().opener();
		if ("scan_nfc_read.html" == openerPage.id) {
			mui.fire(openerPage, "ppreload");
			return true;
		}
	}
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});
