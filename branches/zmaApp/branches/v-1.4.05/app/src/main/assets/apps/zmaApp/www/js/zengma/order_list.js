var vm = new Vue({
	el: "#content",
	data: {
		orderList: []
	},
	methods:{
		viewExpress: function(oid){
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/order!findShipByOrderId.action",
				type:"GET",
				dataType:"json",
				data:{
					oid: oid
				},
				success: function(res){
					plus.nativeUI.closeWaiting();
					if(res.ret == 0) {
						vm.gotoExpressDetail(res.shipId);
						return;
					}
					showMsg(res.msg);
				},
				error: function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		},
		gotoExpressDetail: function(id){
			var url = "/express_detail.html";
			var page= plus.webview.getWebviewById(url);
			if (page == null) {
				mui.preload({url: url, extras:{
					eid: id
				}});
			} else {
				mui.fire(page, "preloading", {
					eid: id
				});
			}
		},
		gotoOrderPay: function(oid){
			var url  = "/order_pay.html";
			var page = plus.webview.getWebviewById(url);
			
			if(page == null){
				mui.preload({url:url, extras:{oid: oid}});
			} else {
				mui.fire(page, "preloading", {oid: oid});
			}
		},
		signExpress: function(oid){
			$.dialog({
				content:"你确定要签收吗",
				ok: "确定",
				cancel:"取消",
				okCallback: function(){
					plus.nativeUI.showWaiting("");
					$.ajax({
						url: upre + "/app/memb/order!signExpress.action",
						type:"GET",
						dataType:"json",
						data:{
							oid: oid
						},
						success: function(res){
							plus.nativeUI.closeWaiting();
							if(res.ret == 0) {
								vm.initInfo();
								return;
							}
							showMsg(res.msg);
						},
						error: function(xhr, type, cause){
							plus.nativeUI.closeWaiting();
							ajaxerror(xhr, type, cause);
						}
					});
				}
			});
		},
		initInfo: function(){
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/order!list.action",
				type: "GET",
				dataType:"json",
				success: function(res) {
					plus.nativeUI.closeWaiting();
					vm.orderList = res.orders;
				},
				error: function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		},
		cancelOrder: function(oid){
			$.dialog({
				content: "你确定要取消该订单吗？",
				ok: "确定",
				cancel:"取消",
				okCallback: function(){
					plus.nativeUI.showWaiting("");
					$.ajax({
						url: upre + "/app/memb/order!cancelOrder.action",
						type: "GET",
						dataType:"json",
						data:{
							oid: oid
						},
						success: function(res) {
							plus.nativeUI.closeWaiting();
							if(conf.debug){console.log(JSON.stringify(res));}
							if(res.ret == 0) {
								mui.toast("取消成功");
								vm.initInfo();
								return;
							}
							mui.toast(res.msg);
						},
						error: function(xhr, type, cause) {
							plus.nativeUI.closeWaiting();
							ajaxerror(xhr, type, cause);
						}
					});
				}
			})
			
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/order_list.html"}
	});
	
	window.addEventListener("preloading", initPage, false);
	initPage();
	
	function initPage(){
		vm.orderList = [];
		dropPage();
		curr.show("slide-in-right");
		vm.initInfo();
		closePage();
	}
	
	function closePage(){
		var orderPay = plus.webview.getWebviewById("/order_pay.html");
		if(orderPay != null){
			orderPay.close("none");
		}
		var goodsBuy = plus.webview.getWebviewById("/goods_buy.html");
		if(goodsBuy != null){
			goodsBuy.close("none");
		}
	}
}

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: "确定"
	});
}

mui.init();
mui.plusReady(function(){
	plusReady();
});