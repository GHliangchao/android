var vm = new Vue({
    el:"#content",
    data:{
        items: [],
        applyCacertCount: 0,
        noApp: false,
        noCaMsg: "",
        lookStatus: "",
        noApplyCA: "",
        applyCA: "",
        lockName: "",
        lockAddr: ""
    },
    methods:{
		gotoWriteCode: function(aid) {
			console.log("goto write code : lockName is " +this.lockName + "， lock address :" +this.lockAddr);
			var url = "/lock_write_code.html";
			var page = plus.webview.getWebviewById(url);
			if(page == null){
			    mui.preload({url: url, extras:{
			        lockName: this.lockName,
			        lockAddr: this.lockAddr,
			        appid: aid
			    }});
			} else {
			    mui.fire(page, "ppreload", {
			        lockName: this.lockName,
                    lockAddr: this.lockAddr,
                    appid: aid
			    });
			}
		},
		veiwApplyStatus: function(){
			console.log("veiwApplyStatus();");
			openWebview("/ca_apply_status.html");
		},
		applyCa: function(){
			console.log("applyCa();");
			openWebview("/ca_platform_select.html");
		}
    }
});

function openWebview(url){
	var page = plus.webview.getWebviewById(url);
	if(page == null){
		mui.preload({url: url});
	} else {
		mui.fire(page, "ppreload");
	}
}

// 国际化资源 @since liujun 2019-06-27
// ---------------------start-----------------------------
var showWaitJs, tanOkText;
i18n.readyI18n(function(){
	$("#appList").html($.i18n.prop("applist_titleText"));
	vm.noCaMsg   = $.i18n.prop("applist_noca");
	vm.lookStatus= $.i18n.prop("applist_lookStatus");
	vm.noApplyCA = $.i18n.prop("applist_noApplyCA");
	vm.applyCA   =  $.i18n.prop("applist_applyCA");
	showWaitJs = $.i18n.prop("zmlist_showWaitInfo");
	tanOkText = $.i18n.prop("tan_ok");
});
// --------------------- end -----------------------------

var conf = zengma_conf,upre = conf.getUrlPrefix();
var curl = upre + "/app/memb/about_lock!applist.action";
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.lockAddr = curr.address;
	vm.lockName = curr.lockName;
	
	window.addEventListener('ppreload',webinit,false);
	window.addEventListener('getnewlist',webinit,false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "app_list.html"}
	});
	initPage();
	
	function webinit(e){
		var detail = e.detail;
		if(detail){
			vm.lockAddr = detail.address;
			vm.lockName = detail.lockName;
		}
		initPage();
	}
	
	function initPage(){
		curr.show("slide-in-right");
		plus.nativeUI.showWaiting(showWaitJs);
		$.ajax(curl, {
			type: "GET",
			dataType: "json",
			success: function(res){
				if(conf.debug){
					console.log("initPage data:"+JSON.stringify(res)+", " + res.ret);
				}
				if(res.ret == 0){
					vm.items = res.apps;
					vm.applyCacertCount = res.count;
					vm.noApp = res.apps.length > 0 ? false: true;
					plus.nativeUI.closeWaiting();
					return;
				}
				plus.nativeUI.closeWaiting();
				showMsg(res.msg);
			},
			error: function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
}

mui.init();
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: tanOkText
	});
}
