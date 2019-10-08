var vm = new Vue({
	el: "#content",
	data: {
		gid:"",
		companys:[
//			{"id":"1","icon":"images/kd1.svg","name":"EMS"},
//			{"id":"2","icon":"images/kd2.svg","name":"顺丰快递"},
//			{"id":"3","icon":"images/kd3.svg","name":"申通快递"},
//			{"id":"4","icon":"images/kd4.svg","name":"圆通快递"},
//		    {"id":"5","icon":"images/kd5.svg","name":"中通快递"},{"id":6,"icon":"images/kd6.svg","name":"百世汇通"},
//			{"id":"7","icon":"images/kd7.svg","name":"韵达快递"}
			],
	},
	methods: {
		chooseExpress: function(id){
			console.log("express:"+id);
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();

function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.gid= curr.gid;
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/choose_express.html"}
	});
	
	function webinit(e){
		var detail = e.detail;
		if (detail) {
			vm.gid = detail.gid;
		}
		initPage();
	}
	
	function initPage() {
		curr.show("slide-in-right");
		initContent();
	}
	
	function initContent(){
		$.ajax({
			url: upre + "/app/memb/express!ships.action",
			type:"GET",
			dataType: "json",
			success: function(res) {
			    if(conf.debug){console.log("goodsInfo is " + JSON.stringify(res));}
			    vm.companys = res.ships;			
			},
			error: function(xhr, type, cause) {
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
}

mui.init();
mui.plusReady(function(){
	plusReady();
});
