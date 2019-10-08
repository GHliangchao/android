var vm = new Vue({
	el: "#content",
	data:{
		goodsId: "",
		goodsInfo: {},
		goodsCount: 1,
		goodsPrice: 0.0,
		address: {},
		haveAddress: false
	},
	methods: {
		selectAddress: function(){
			var url  = "/address_list.html";
			var page = plus.webview.getWebviewById(url);
			
			if(page == null){
				mui.preload({url:url});
			} else {
				mui.fire(page, "preloading");
			}
		},
		add:function(){
			this.goodsCount++;
			var price = this.goodsInfo.price;
			this.goodsPrice = calculate.multiply(this.goodsCount, price, 2);
		},
		subtract:function(){
			if(this.goodsCount <= 1){
				mui.toast("数量需大于1");
				return;
			}
			
			this.goodsCount--;
			var price = this.goodsInfo.price;
			this.goodsPrice = calculate.multiply(this.goodsCount, price, 2);
		},
		submitOrder: function(){
			
			var info = this.buildGoodsInfo();
			if(conf.debug){
				console.log("goods info :" + JSON.stringify(info));
			}
			
			if(!(this.address.id && this.address.id != null)){
				showMsg("请选择地址");
				return;
			}
			// 1. 创建订单
			this.createOrder();
		},
		gotoOrderPay: function(oid){
			var url  = "/order_pay.html";
			var page = plus.webview.getWebviewById(url);
			
			if(page == null){
				mui.preload({url:url, extras:{price: this.goodsPrice, oid: oid}});
			} else {
				mui.fire(page, "preloading", {price: this.goodsPrice, oid: oid});
			}
		},
		createOrder: function() {
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/selling_goods!submitOrder.action",
				data:{
					addressId : this.address.id,
					goodsId	  : this.goodsId,
					goodsCount: this.goodsCount
				},
				type: "POST",
				dataType: "json",
				success: function(res) {
					plus.nativeUI.closeWaiting();
					if(conf.debug){console.log(JSON.stringify(res));}
					if(res.ret == 0){
						vm.gotoOrderPay(res.oid);
						return;
					}
					showMsg(res.msg);
				},
				error: function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		},
		buildGoodsInfo: function() {
			var info = this.goodsInfo;
			info.count = this.goodsCount;
			info.totalPrice = this.goodsPrice;
			return info;
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.goodsId = curr.goodsId;
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/goods_buy.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	window.addEventListener("selectAddress", selectAddress, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail) {
			vm.goodsId = detail.goodsId;
		}
		initPage();
	}
	
	function selectAddress(e) {
		dropPage();
		var detail = e.detail;
		if(detail){
			vm.address = detail.address;
			vm.haveAddress = true;
		}
		curr.show("slide-in-right");
	}
	
	function initPage(){
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo(){
		$.ajax({
			url: upre + "/app/memb/selling_goods!initBuyInfo.action",
			type:"GET",
			dataType: "json",
			data:{
				goodsId: vm.goodsId
			},
			success: function(res){
				if(conf.debug){console.log(JSON.stringify(res));}
				if(res.ret == 0) {
					vm.goodsInfo = res.goodsInfo;
					vm.goodsPrice= calculate.multiply(1, res.goodsInfo.price, 2);
					vm.goodsCount= 1;
					vm.haveAddress = res.default;
					if(res.default){
						vm.address = res.defaultAddress;
					}
					return;
				}
				showMsg(res.msg);
			},
			error: function(xhr, type, cause){
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
}

mui.init();
mui.plusReady(function(){
	plusReady();
});

function showMsg(msg){
	$.dialog({
		content: msg,
		ok: "确定"
	});
}

var unSelected = "#989898";
var selected = "#505050";
$(function () {
    $("select").css("color", unSelected);
    $("option").css("color", selected);
    $("select").change(function () {
        var selItem = $(this).val();
        if (selItem == $(this).find('option:first').val()) {
            $(this).css("color", unSelected);
        } else {
            $(this).css("color", selected);
        }
    });
})