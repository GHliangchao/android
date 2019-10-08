var vm = new Vue({
	el: "#content",
	data: {
		eid: "",
		ship:"",
		logs:[]
	},
	methods:{
		telPhone: function(phone) {
			if (phone) { 
				window.location.href = "tel:" + phone;
				return;
			}
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix(),closeShip;
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.eid = curr.eid;
	closeShip = curr.closeShip || false;
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/express_detail.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail) {
			vm.eid = detail.eid;
			closeShip = detail.closeShip || false;
		}
		initPage();
	}
	
	function initPage(){
		vm.ship = "";
		vm.logs = [];
		console.log("closeShip:"+closeShip);
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo() {
		$.ajax({
			url: upre + "/app/memb/shipping!shipDetail.action",
			type:"GET",
			data:{"id":vm.eid},
			dataType: "json",
			success: function(res){
				if(conf.debug){console.log(JSON.stringify(res));}
				if(res.ret == 1){
					showMsg(res.msg);
				}else{
					vm.ship = res.ship;
					vm.logs = res.logs;
				}
			},
			error: function(xhr, type, cause){
				ajaxerror(xhr, type, cause);
			}
		});
		if(closeShip){
			window.retains = {
				"/online_express.html" : true
			};
			var query_result = plus.webview.getWebviewById("/query_result.html"),
			choose_express = plus.webview.getWebviewById("/choose_express.html"),
			shipOther = plus.webview.getWebviewById("/ship_other.html"),
			shipOwner = plus.webview.getWebviewById("/ship_owner.html");
			if(shipOther!=null){
				shipOther.close("none");
			}
			if(shipOwner!=null){
				shipOwner.close("none");
			}
			if(choose_express!=null){
				choose_express.close("none");
			}
			if(query_result!=null){
				query_result.close("none");
			}
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
