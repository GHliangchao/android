var vm = new Vue({
	el: "#content",
	data:{
		expressid: "",
		mailaddress: {},
		receaddress:{},
		gtypes:[],
		gtype:"",
		remark:"",
		haveMailAddress: false,
		haveReceAddress: false
	},
	methods: {
		selectAddress: function(type){
			var aurl = "/ship_other.html"
			var url  = "/address_list.html";
			var page = plus.webview.getWebviewById(url);
			
			if(page == null){
				mui.preload({url:url, extras:{type: type,prev:aurl}});
			} else {
				mui.fire(page, "preloading",{type: type,prev:aurl});
			}
		},	
		submitOrder: function(){
			if(!(vm.mailaddress.id && vm.mailaddress.id != null)){
				showMsg("请选择寄件地址");
				return;
			}
			if(!(vm.receaddress.id && vm.receaddress.id != null)){
				showMsg("请选择收件地址");
				return;
			}
			if(vm.gtype == 0){
				showMsg("请选择货物类型");
				return;
			}
			// 1. 创建订单
			this.createShip();
		},
		createShip: function() {
			var goodsInfo = vm.gtype;
			if(vm.remark!=""){
				goodsInfo = goodsInfo+"-"+vm.remark;
			}
			plus.nativeUI.showWaiting("正在生成快递单");
			$.ajax({
				url: upre + "/app/memb/shipping!createShip.action",
				data:{
					expressId     : vm.expressid,
					goodsInfo     : goodsInfo,
					mailAddressId : vm.mailaddress.id,
					receAddressId : vm.receaddress.id,
					type	      : 4,
				},
				type: "POST",
				dataType: "json",
				success: function(res) {
					plus.nativeUI.closeWaiting();
					if(conf.debug){console.log(JSON.stringify(res));}
					if(res.ret == 0){
						$.dialog({
							content: "操作成功",
							ok:"确定",
							modal:true,
							okCallback:function(){
								vm.successBack(res.shipId);
							}
						});
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
		successBack:function(shipId){
//			var webviewUrl = "/online_express.html";
//			var page = plus.webview.getWebviewById(webviewUrl);
//			
//			if (page == null) {
//				mui.preload({url: webviewUrl});
//			} else {
//				mui.fire(page, "ppreload");
//			}
			var url = "/express_detail.html";
			var page= plus.webview.getWebviewById(url);
			if(page == null){
				mui.preload({url: url, extras:{eid: shipId,closeShip:true}});
			} else {
				mui.fire(page, "preloading", {eid: shipId,closeShip:true});
			}
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.expressid = curr.expressid;
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/ship_other.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	window.addEventListener("selectAddress", selectAddress, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail) {
			vm.expressid = detail.expressid;
		}
		initPage();
	}
	
	function selectAddress(e) {
		dropPage();
		var detail = e.detail;
		if(detail){
			var type = detail.type;
			console.log("type:"+type)
			if(type=='M'){
				vm.mailaddress = detail.address;
				vm.haveMailAddress = true;
			}else{
				vm.receaddress = detail.address;
				vm.haveReceAddress = true;
			}
		}
		curr.show("slide-in-right");
	}
	
	function initPage(){
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo(){
		vm.gtypes = [];
		vm.haveMailAddress = false;
		vm.mailaddress = "";
		vm.haveReceAddress = false;
		vm.receaddress = "";
		vm.gtype = "";
		vm.remark = "";
		$.ajax({
			url: upre + "/app/memb/express!initOtherShipping.action",
			type:"GET",
			dataType: "json",
			success: function(res){
				if(conf.debug){console.log(JSON.stringify(res));}
				if(res.ret == 0) {
					vm.gtypes = res.gtypes;
					vm.haveMailAddress = res.default;
					if(res.default){
						vm.mailaddress = res.defaultAddress;
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