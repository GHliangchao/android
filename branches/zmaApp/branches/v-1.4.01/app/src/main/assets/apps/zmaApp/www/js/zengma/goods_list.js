var vm = new Vue({
	el: "#content",
	data: {
		codeSn: "",
		goodsInfo: {},
		contactInfo:[],
		showGoodsInfo: false,
		errorMsg: "",
	},
	methods: {
		wholesale: function(){
			var msg = "<center>批发请联系我们销售人员，协商批发价格、确定跨境方案</center></br>"
					+ "TEL:<a href='tel:13588021148'>13588021148</a>&nbsp;&nbsp;&nbsp;祝经理<br/>"
					+ "<a href='javascript:openURL();'>www.teggs.net</a>";
			
			/*$.each(vm.contactInfo, function(idx, info) {
				var content = info.title + "：";
				if(info.type == "P"){
					content += "<a href='tel:" + info.content + "'>"+info.content + "</a> ";
				} else {
					content += info.content + " ";
				}
				content += info.contact + "<br/>";
				msg += content;
			});*/
			$.dialog({
				content: msg,
				ok: "确定"
			});
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

function openURL(){
	var url = "http://www.teggs.net";
	plus.runtime.openURL(url);
}

var conf = zengma_conf, upre = conf.getUrlPrefix();

function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.codeSn= curr.codeSn;
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/goods_list.html"}
	});
	
	function webinit(e){
		var detail = e.detail;
		if (detail) {
			vm.codeSn = detail.codeSn;
		}
		initPage();
	}
	
	function initPage() {
		curr.show("slide-in-right");
		initContent();
	}
	
	function initContent(){
		$.ajax({
			url: upre + "/app/memb/selling_goods!findSellingGoods.action",
			data:{
				codeSn: vm.codeSn
			},
			type:"GET",
			dataType: "json",
			success: function(res) {
			    if(conf.debug){console.log("goodsInfo is " + JSON.stringify(res));}
				if(res.ret == 0){
					vm.goodsInfo  = res.goodsInfo;
					vm.contactInfo= res.sholesaleInfo;
					
					vm.showGoodsInfo = true;
					vm.erroMsg = "";
					return;
				}
				showErMsg(res.msg);
			},
			error: function(xhr, type, cause) {
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
}

function showErMsg(msg){
	vm.showGoodsInfo = false;
	vm.errorMsg = msg;
}

mui.init();
mui.plusReady(function(){
	plusReady();
});
