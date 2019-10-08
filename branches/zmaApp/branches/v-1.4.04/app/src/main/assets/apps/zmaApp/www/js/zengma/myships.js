var vm = new Vue({
	el: "#content",
	data: {
		pageNum:1,
		ships:[],
		showNext: false,
		canclick: false,
	},
	methods: {
		view: function(id){
			var url = "/express_detail.html";
			var page= plus.webview.getWebviewById(url);
			if(page == null){
				mui.preload({url: url, extras:{eid: id}});
			} else {
				mui.fire(page, "preloading", {eid: id});
			}
		},
		gonext: function(){
			if(!vm.showNext){
				return;
			}
			if(!vm.canclick){
				return;
			}
			vm.canclick = false;
			vm.pageNum = vm.pageNum + 1;
			initInfo();
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.expressid = curr.expressid;
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/myship.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail) {
			vm.expressid = detail.expressid;
		}
		initPage();
	}
	
	function initPage(){
		vm.pageNum = 1;
		vm.ships = [];
		vm.canclick = false;
		vm.showNext = false;
		curr.show("slide-in-right");
		initInfo();
	}
	
}

function initInfo(){
	$.ajax({
		url: upre + "/app/memb/shipping!myships.action",
		type:"GET",
		data:{"pageNum":vm.pageNum},
		dataType: "json",
		success: function(res){
			if(conf.debug){console.log(JSON.stringify(res));}
			var ships = res.ships;
			var nowItem = vm.ships;
			vm.canclick = true;
			if(ships.length < 20){
				vm.showNext = false;
			}else{
				vm.showNext = true;
			}
			vm.ships = nowItem.concat(ships);
		},
		error: function(xhr, type, cause){
			if(vm.pageNum !=1){
				vm.pageNum = vm.pageNum - 1;
			}
			vm.canclick = true;
			ajaxerror(xhr, type, cause);
		}
	});
}

mui.init();
mui.plusReady(function(){
	plusReady();
});