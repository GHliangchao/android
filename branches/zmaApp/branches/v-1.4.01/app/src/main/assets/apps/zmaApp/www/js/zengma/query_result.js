var vm = new Vue({
	el: "#result",
	data: {
		codeSn: "",
		code:"",
		version:"",
		goodsInfo:{},
		checkCount:"",
		startTime:"",
		validityTime:"",
		modifyInfo:{},
		declareInfo:{},
		ships:[],
		showGoodsInfo: false,
		errorMsg: "",
	},
	methods: {
		selectExpress: function(){
			var url = "/choose_express.html";
			var page= plus.webview.getWebviewById(url);
			var gid = vm.goodsInfo.id;
			if(page == null){
				mui.preload({url: url, extras:{gid: gid}});
			} else {
				mui.fire(page, "preloading", {gid: gid});
			}
		},
		goodsBuy: function(){
			var url = "/goods_buy.html";
			var page= plus.webview.getWebviewById(url);
			var gid = vm.goodsInfo.id;
			if(page == null){
				mui.preload({url: url, extras:{goodsId: gid}});
			} else {
				mui.fire(page, "preloading", {goodsId: gid});
			}
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();

function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.codeSn = curr.codeSn;
	vm.code = curr.code;
	vm.version = curr.version;
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/query_result.html"}
	});
	
	function webinit(e){
		var detail = e.detail;
		if (detail) {
			vm.codeSn = detail.codeSn;
			vm.code = detail.code;
			vm.version = detail.version;
		}
		initPage();
	}
	
	function initPage() {
		curr.show("slide-in-right");
		initContent();
	}
	
	function initContent(){
		$.ajax({
			url: upre + "/app/memb/express!queryInfo.action",
			data:{
				codeSn: vm.codeSn,
				code:vm.code,
				version:vm.version
			},
			type:"GET",
			dataType: "json",
			success: function(res) {
			    if(conf.debug){console.log("goodsInfo is " + JSON.stringify(res));}
				if(res.ret == 1){
					showMsg(res.msg);
				}else{
					vm.code = res.code;
					vm.goodsInfo = res.goodsInfo;
					vm.checkCount = res.checkCount;
					vm.startTime = res.startTime;
					vm.validityTime = res.validityTime;
					vm.modifyInfo = res.modifyInfo;
					vm.ships = res.ships;
				}
				
			},
			error: function(xhr, type, cause) {
				ajaxerror(xhr, type, cause);
			}
		});
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
