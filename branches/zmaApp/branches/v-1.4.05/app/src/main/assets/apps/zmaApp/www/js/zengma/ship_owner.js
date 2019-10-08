var vm = new Vue({
	el: "#content",
	data:{
		expressid: "",
		mailaddress: {},
		receaddress:{},
		gtypes:[],
		goodes:[],
		gtype:"",
		remark:"",
		gids:[],
		haveMailAddress: false,
		haveReceAddress: false
	},
	methods: {
		selectAddress: function(type){
			var aurl = "/ship_owner.html"
			var url  = "/address_list.html";
			var page = plus.webview.getWebviewById(url);
			
			if(page == null){
				mui.preload({url:url, extras:{type: type,prev:aurl}});
			} else {
				mui.fire(page, "preloading",{type: type,prev:aurl});
			}
		},	
		addGoods:function(){
			var options = {cardId:""};
		
			plus.blelock.scanSecretCodeNfcRead({
	    		success: success,
	    		error: error,
	    		options: options
	    	});
	    	
	    	function success(res){
				console.log("读NFC成功结果："+JSON.stringify(res));
				
				// 1.点击返回就不进行任何操作
				if (res.result == 0 && res.message == 'backclick') {
					return;
				}
				
				var code    = res.code;
				var codeSn  = res.codeSn;
				var version = res.version;
				var sign    = res.sign;
				var ts      = res.ts;
				var digest  = res.digest;
				
				if(conf.debug){
					code    = "74835df622f7ebf9";
					codeSn  = "150000000005";
					version = "1";
					ts      = "1552527991000";
					sign    = "6a656db733373c391fe7a6a59840869e";
					digest  = "a25e145053e8f0d939449f861b22770c";
				}
				
				var arr = vm.goodes;
				var size= arr.length;
				for(var i = 0; i < size; i++){
					var obj = arr[i];
					if(obj.codeSn == codeSn){
						mui.toast("该商品已经添加过了");
						return;
					}
				}
				
				vm.queryGoodsCodeInfo(code, codeSn, version, ts, sign, digest);
	    	}
	    		
	    	function error(){
	    		console.log("读NFC失败结果："+JSON.stringify(res));
				showMsg(res.message);
	    	}
		},
		queryGoodsCodeInfo: function(code, codeSn, version, ts, sign, digest) {
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/express!queryGoodsCodeInfo.action",
				type: "GET",
				data:{
					 codeSn: codeSn,
					   code: code,
					version: version,
					     ts: ts,
					   sign: sign,
					 digest: digest
				},
				dataType:"json",
				success: function(res) {
					if(conf.debug){console.log(JSON.stringify(res));}
					plus.nativeUI.closeWaiting();
					if(res.ret == 0){
						var codeInfo= res.codeInfo;
						var goods   = {};
						goods.id    = codeInfo.id;
						goods.name  = res.name;
						goods.codeSn= codeInfo.codeSn;
						// set List
						var goodses = vm.goodes;
						vm.goodes   = goodses.concat(goods);	
						return;
					}
					showMsg(res.msg);
				},
				error: function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			})
		},
		deleteGoods:function(index){
			vm.goodes.splice(index,1);
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
			if(vm.goodes.length==0){
				showMsg("请添加要快递的商品");
				return;
			}else{
				vm.gids = {};
				var gids =[];
				for(var i=0;i<vm.goodes.length;i++){
					var gid = vm.goodes[i].id;
					if(contains(gids,gid)){
						showMsg("请勿添加重复的商品");
						return;
					}
					gids.push(gid);
				}
				var goodsIds = {};
				for(var i =0;i<gids.length;i++){
					goodsIds[i] = gids[i];
				}
				vm.gids = goodsIds;
			}
			// 1. 创建订单
			this.createShip();
		},
		createShip: function() {
			var goodsInfo = vm.gtype;
			if(vm.remark!=""){
				goodsInfo = goodsInfo+"-"+vm.remark;
			}
			var data = {
					expressId     : vm.expressid,
					goodsInfo     : goodsInfo,
					mailAddressId : vm.mailaddress.id,
					receAddressId : vm.receaddress.id,
					type	      : 3,
					goodsIds      : vm.gids
			};
			plus.nativeUI.showWaiting("正在生成快递单");
			$.ajax({
				url: upre + "/app/memb/shipping!createShip.action",
				data:data,
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

function contains(arr, obj) {
    var i = arr.length;
    while (i--) {
        if (arr[i] === obj) {
            return true;
        }
    }
    return false;
}

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.expressid = curr.expressid;
	vm.goodes = [{
			"id"    : curr.gid, 
			"name"  : curr.name, 
			"codeSn": curr.codeSn
	}];
	
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/ship_owner.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	window.addEventListener("selectAddress", selectAddress, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail) {
			vm.expressid = detail.expressid;
			vm.goodes = [{
				"id"    : detail.gid,
				"name"  : detail.name,
				"codeSn": detail.codeSn
			}];
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
		if(conf.debug){console.log("enter initPage goods info: " + JSON.stringify(vm.goodes));}
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo(){
		cleanInfo();
		plus.nativeUI.showWaiting("");
		
		$.ajax({
			url: upre + "/app/memb/express!initOtherShipping.action",
			type:"GET",
			dataType: "json",
			success: function(res){
				plus.nativeUI.closeWaiting();
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
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	function cleanInfo(){
		vm.gtypes = [];
		vm.haveMailAddress = false;
		vm.mailaddress = "";
		vm.haveReceAddress = false;
		vm.receaddress = "";
		vm.gtype = "";
		vm.remark = "";
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