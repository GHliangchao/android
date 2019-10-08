var vm = new Vue({
	el: "#content",
	data:{
		price: 0,
		goodsInfo: {},
		selectWeChat: true,
		selectAlipay: false,
		selectUnionPay: false,
		selectMasterCard: false,
		selectVisa: false
	},
	methods:{
		confirmPay: function() {
			var storageInfo = plus.storage.getItem("goodsInfo");
			var infoArr = [];
			if(storageInfo != null){
				infoArr = JSON.parse(storageInfo);
			}
			infoArr.push(this.goodsInfo);
			plus.storage.setItem("goodsInfo", JSON.stringify(infoArr));
			
			mui.toast("支付成功，跳往下一页");
			var url = "/order_list.html";
			var page= plus.webview.getWebviewById(url);
			if (page == null) {
				mui.preload({url: url});
			} else {
				mui.fire(page, "preloading");
			}
		},
		clickWeChat: function() {
			this.selectWeChat   = true;
			
			this.selectVisa		= false;
			this.selectUnionPay	= false;
			this.selectAlipay   = false;
			this.selectMasterCard = false;
		},
		clickAlipay: function() {
			this.selectAlipay   = true;
			
			this.selectVisa		= false;
			this.selectWeChat   = false;
			this.selectUnionPay	= false;
			this.selectMasterCard = false;
		},
		clickUnionPay: function() {
			this.selectUnionPay	= true;
			
			this.selectVisa		= false;
			this.selectWeChat   = false;
			this.selectAlipay   = false;
			this.selectMasterCard = false;
		},
		clickMasterCard: function() {
			this.selectMasterCard = true;
			
			this.selectVisa		= false;
			this.selectUnionPay	= false;
			this.selectWeChat   = false;
			this.selectAlipay   = false;
		},
		clickVisa: function() {
			this.selectVisa		= true;
			
			this.selectUnionPay	= false;
			this.selectWeChat   = false;
			this.selectAlipay   = false;
			this.selectMasterCard = false;
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.price = curr.price;
	vm.goodsInfo = curr.goodsInfo;
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/order_pay.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail) {
			vm.price = detail.price;
			vm.goodsInfo = detail.goodsInfo;
		}
		initPage();
	}
	
	function initPage(){
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo() {
		
	}
}

mui.init();
mui.plusReady(function(){
	plusReady();
});

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
