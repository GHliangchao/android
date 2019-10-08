var apptop = new Vue({
	el:"#apptop",
	data:{
		opType: "M" ,// M - 地址管理， S - 选择地址
		addressType:"",//地址类型，寄件地址,收件地址
		prev:"" //上级页面地址
	},
	methods:{
		
	}
});

var vm = new Vue({
	el: "#content",
	data: {
		addressList: []
	},
	methods:{
		selectAddress: function(id, idx){
			if(apptop.opType == 'M'){
				return;
			}	
			var data = this.addressList[idx];
			if(apptop.prev!=""){
				console.log("btype:"+apptop.addressType);
				var page = plus.webview.getWebviewById(apptop.prev);
				if (page == null) {
					mui.preload({url: apptop.prev, extras:{address: data,type:apptop.addressType}});
				} else {
					mui.fire(page, "selectAddress", {address: data,type:apptop.addressType});
				}
			}else{
				var url  = "/goods_buy.html";
				var page = plus.webview.getWebviewById(url);
				if (page == null) {
					mui.preload({url: url, extras:{address: data}});
				} else {
					mui.fire(page, "selectAddress", {address: data});
				}
			}
		},
		addAddress: function(){
			var url = "/address_add.html";
			var page= plus.webview.getWebviewById(url);
			
			if(page == null) {
				mui.preload({url: url, extras:{
					opType: apptop.opType,
					opAddr: 'A'
				}});
			} else {
				mui.fire(page, "preloading",{
					opType: apptop.opType,
					opAddr: 'A'
				});
			}
		},
		editAddress: function(aid){
			var url = "/address_add.html";
			var page= plus.webview.getWebviewById(url);
			
			if(page == null) {
				mui.preload({url: url, extras:{
					opType: apptop.opType,
					opAddr: 'U',
					addrId: aid
				}});
			} else {
				mui.fire(page, "preloading",{
					opType: apptop.opType,
					opAddr: 'U',
					addrId: aid
				});
			}
		},
		
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	apptop.opType = curr.opType || "";
	apptop.addressType = curr.type || "";
	apptop.prev = curr.prev || "";
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/address_list.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	function webinit(e) {
		dropPage();
		var detail = e.detail;
		if(detail){
			apptop.opType = detail.opType || "";
			if(detail.type!=""&&detail.type!=undefined){
				console.log(1111);
				apptop.addressType = detail.type || "";
				apptop.prev = detail.prev || "";
			}
		}
		initPage();
	}
	
	function initPage(){
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo() {
		$.ajax({
			url: upre + "/app/memb/member_address!list.action",
			type:"GET",
			dataType: "json",
			success: function(res){
				if(conf.debug){console.log(JSON.stringify(res));}
				if(res.ret == 0) {
					vm.addressList = res.addressList;
					return;
				}
				showMsg(res.msg);
			},
			error: function(xhr, type, cause){
				ajaxerror(xhr, type, cause);
			}
		})
	}
	
}

function showMsg(msg){
	$.dialog({
		content: msg,
		ok: "确定"
	});
}

mui.init();
mui.plusReady(function(){
	plusReady();
});
