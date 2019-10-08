var vm = new Vue({
	el: "#content",
	data: {
		
	},
	methods:{
		selectAddress: function(){
			mui.back();
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/address_list.html"}
	});
	
	window.addEventListener("preloading", initPage, false);
	initPage();
	
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
