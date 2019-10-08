var vm = new Vue({
	el: "#content",
	data: {
		goodsList: []
	},
	methods:{
		viewExpress: function(id){
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
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo() {
		var info = plus.storage.getItem("goodsInfo");
		var arr = JSON.parse(info);
		vm.goodsList = arr.reverse();
		if(conf.debug){console.log("加载商品信息：" + info);}
		// TODO 此处需要联网加载数据 since liujun 20190822
	}
}

mui.init();
mui.plusReady(function(){
	plusReady();
});