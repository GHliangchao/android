var vm = new Vue({
	el: "#content",
	data: {
		eid: ""
	},
	methods:{
		
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.eid = curr.eid;
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/express_detail.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail) {
			vm.eid = detail.eid;
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
