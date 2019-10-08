var vm = new Vue({
	el: "#content",
	data:{
		countries:[],
		fromCountry: "",
		fromPort: "",
		toCountry: "",
		toPort: "",
		weight: "",
		vol:"",
		name: "",
		phone: ""
	},
	methods:{
		opTeggsIndex: function(){
			plus.runtime.openURL("http://www.teggs.net");
		},
		checkParam: function(){
			if(this.fromPort == ""){
				showMsg("请输入出发港口");
				return false;
			}
			if(this.toPort == ""){
				showMsg("请输入目的港口");
				return false;
			}
			if(this.weight == ""){
				showMsg("请输入毛重");
				return false;
			}
			if(this.vol == ""){
				showMsg("请输入体积");
				return false;
			}
			if(this.name == ""){
				showMsg("请输入姓名");
				return false;
			}
			if(this.phone == ""){
				showMsg("请输入电话");
				return false;
			}
			return true;
		},
		submitInfo: function(){
			if(conf.debug){
				console.log("fromCountry = " + this.fromCountry);
				console.log("fromPort = " + this.fromPort);
				console.log("toCountry = " + this.toCountry);
				console.log("toPort = " + this.toPort);
				console.log("weight = " + this.weight);
				console.log("vol = " + this.vol);
				console.log("name = " + this.name);
				console.log("phone = " + this.phone);
			}
			
			if(!this.checkParam()){
				return;
			}
			
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/cross_border!submitInfo.action",
				data: {
					fromCountry: vm.fromCountry,
					fromPort: vm.fromPort,
					toCountry: vm.toCountry,
					toPort: vm.toPort,
					weight: vm.weight,
					vol: vm.vol,
					name: vm.name,
					phone: vm.phone
				},
				type: "POST",
				dataType: "json",
				success: function(res) {
					plus.nativeUI.closeWaiting();
					if(conf.debug){console.log(JSON.stringify(res));}
					if(res.ret == 0){
						cleanInfo();
						mui.toast("提交成功");
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
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/goods_buy.html"}
	});
	
	initPage();
	window.addEventListener("ppreload", initPage, false);
	
	function initPage(){
		cleanInfo();
		curr.show("slide-in-right");
		plus.nativeUI.showWaiting("");
		$.ajax({
			url: upre + "/app/memb/cross_border!initInfo.action",
			type:"GET",
			dataType:"json",
			success: function(res){
				if(conf.debug){console.log(JSON.stringify(res));}
				plus.nativeUI.closeWaiting();
				vm.countries = res.countries;
			},
			error: function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}			
		});
	}
}

function cleanInfo(){
	vm.fromCountry = "";
	vm.fromPort = "";
	vm.toCountry = "";
	vm.toPort = "";
	vm.weight = "";
	vm.vol = "";
	vm.name = "";
	vm.phone = "";
}

mui.init();
mui.plusReady(function() {
	plusReady();
});

function showMsg(msg){
	$.dialog({
		content: msg,
		ok: "确定"
	});
}
