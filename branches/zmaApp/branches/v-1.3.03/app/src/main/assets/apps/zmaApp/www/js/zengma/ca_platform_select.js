var conf = zengma_conf,
	upre = conf.getUrlPrefix();

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var readPlatformInfoJs, submitInfoJs, contentJs, okJs;
i18n.readyI18n(function(){
	$("#caPlatformSelect").html($.i18n.prop("caplatformselect_titleText"));
	$("#submitText").html($.i18n.prop("caplatformselect_submitText"));
	readPlatformInfoJs = $.i18n.prop("caplatformselect_showWait_readPlatformInfo");
	submitInfoJs	   = $.i18n.prop("caplatformselect_showWait_submitInfo");
	contentJs		   = $.i18n.prop("caplatformselect_dialog_content");
	okJs			   = $.i18n.prop("tan_ok");
});
//------------------ end --------------------

function plusReady(){
	var webv = plus.webview.currentWebview(),
		curl = upre + "/app/memb/membca!appselect.action";
		surl = upre + "/app/memb/membca!saveApply.action";
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "ca_platform_select.html"}
	});
	window.addEventListener("ppreload",webinit, false);
	window.addEventListener('getnewlist', infoinit, false);
	
	function webinit(e){
		var detail = e.detail;
		infoinit();
	}
	infoinit();
	function infoinit(){
		webv.show("slide-in-right");
		plus.nativeUI.showWaiting(readPlatformInfoJs);
		try{
			mui.ajax(curl,{
				type:"get",
				dataType:"html",
				success:function(infs){
					plus.nativeUI.closeWaiting();
					var infs = $(infs);
					if(conf.debug){
						console.log(infs);
					}
					$("#applist").empty();
					$("#applist").append(infs);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		}catch(e){
			plus.nativeUI.closeWaiting();
			if(conf.debug){
				console.log(e.message);
			}
		}
	}
	
	$('#submit')[0].addEventListener("tap", submitApply, false);
	function submitApply(){
		plus.nativeUI.showWaiting(submitInfoJs);
		$('#submit')[0].removeEventListener("tap", submitApply, false);
		var appid = $("#appid option:selected").val();
		
		if(conf.debug){
			console.log("appid = "+appid);
		}
		
		if($.trim(appid) === ''){
			plus.nativeUI.closeWaiting();
			$('#submit')[0].addEventListener("tap", submitApply, false);
			$.dialog({
				content: contentJs,
				ok:okJs
			});
			return;
		}
		
		try{
			mui.ajax(surl,{
				type:"POST",
				dataType:"json",
				data:{
					applicationId:appid
				},
				cache:false,
				success:successHandler,
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					$('#submit')[0].addEventListener("tap", submitApply, false);
					ajaxerror(xhr, type, cause);
				}
			});
		}catch(e){
			plus.nativeUI.closeWaiting();
			$('#submit')[0].addEventListener("tap", submitApply, false);
			if(conf.debug){
				console.log(e.message);
			}
		}
	}
	
	function successHandler(infs){
		plus.nativeUI.closeWaiting();
		$('#submit')[0].addEventListener("tap", submitApply, false);
		if(conf.debug){
			console.log(JSON.stringify(infs));
		}
		if(infs.ret === 1){
			$.dialog({
				content: infs.msg,
				ok:okJs
			});
			return;
		}
		// @since liujun 2018-01-19
		// 申请ca时，当身份证为空的时候，跳转去完善信息页面
		if(infs.ret === 2){
			$.dialog({
				content: infs.msg,
				ok:okJs,
				modal: true,
				okCallback: toMemberInfo
			});
			function toMemberInfo(){
				var infoView = plus.webview.getWebviewById("memb_info.html");
				if(infoView == null){
					mui.preload({url: "memb_info.html"});
				}else{
					mui.fire(infoView, "getnewlist");
				}
			}
			return;
		}
		var dpage = plus.webview.currentWebview();
		plus.webview.close(dpage);
		mui.fire(dpage.opener(),'ppreload');
	}
	
}

mui.init({
	swipeBack: false
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});
