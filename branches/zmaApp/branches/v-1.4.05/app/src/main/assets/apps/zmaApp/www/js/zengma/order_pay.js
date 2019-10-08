var vm = new Vue({
	el: "#content",
	data:{
		orderId: "",
		payList: [],
		price: 0
	},
	methods:{
		confirmPay: function() {
			var payStyle = this.findSelectedPay();
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/order!paymentOrder.action",
				type: "POST",
				dataType: "json",
				data:{
					oid: vm.orderId,
					paymentId: payStyle.id
				},
				success: function(res){
					plus.nativeUI.closeWaiting();
					if(res.ret == 0){
						vm.gotoOrderList();
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
		gotoOrderList: function(){
			mui.toast("支付成功，跳往下一页");
			
			var url = "/order_list.html";
			var page= plus.webview.getWebviewById(url);
			if (page == null) {
				mui.preload({url: url});
			} else {
				mui.fire(page, "preloading");
			}
		},
		clickPayment: function(indx){
			$.each(this.payList, function(i, d){
				d.selected = false;
			});
			
			this.payList[indx].selected = true;
		},
		findSelectedPay:function(){
			var length = this.payList.length;
			var selPay = {};
			for(var i = 0; i < length; i++) {
				var obj = this.payList[i];
				if(obj.selected){
					selPay = obj;
					break;
				}
			}
			return selPay;
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.orderId = curr.oid;
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/order_pay.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail) {
			vm.orderId = detail.oid;
		}
		initPage();
	}
	
	function initPage(){
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo() {
		plus.nativeUI.showWaiting("");
		$.ajax({
			url: upre + "/app/memb/order!initPayment.action",
			type: "GET",
			dataType: "json",
			data:{
				oid: vm.orderId
			},
			success: function(res) {
				plus.nativeUI.closeWaiting();
				if(conf.debug){console.log(JSON.stringify(res));}
				if(res.ret == 0){
					vm.payList = res.pays;
					vm.price   = res.order.amount;
					vm.payList[0].selected = true; 
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
