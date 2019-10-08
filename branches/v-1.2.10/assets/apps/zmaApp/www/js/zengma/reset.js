var conf = zengma_conf,upre = conf.getUrlPrefix();

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var oldPwdErJs, newPwdErJs, cfmPwdErJs,onEqualJs, updatePwdJs,
	updatePwdSuccJs, okJs;
i18n.readyI18n(function(){
	$("#resetText").html($.i18n.prop("resetPassword_title"));
	$("#oldPwdTexct").html($.i18n.prop("resetPassword_oldPwdText"));
	$("#newPwdText").html($.i18n.prop("resetPassword_newPwdText"));
	$("#cfmPwdText").html($.i18n.prop("resetPassword_cfmPwdText"));
	$("#cfmbtn").html($.i18n.prop("resetPassword_cfmbtnText"));
	$("#oldPassword").attr("placeholder", $.i18n.prop("resetPassword_oldPassword"));
	$("#newPassword").attr("placeholder", $.i18n.prop("resetPassword_newPassword"));
	$("#cfmPassword").attr("placeholder", $.i18n.prop("resetPassword_cfmPassword"));
	// javaScript
	oldPwdErJs = $.i18n.prop("resetPassword_js_oldPwdEr");
	newPwdErJs = $.i18n.prop("resetPassword_js_newPwdEr");
	cfmPwdErJs = $.i18n.prop("resetPassword_js_cfmPwdEr");
	onEqualJs  = $.i18n.prop("resetPassword_js_onEqual");
	updatePwdJs= $.i18n.prop("resetPassword_js_updatePwd");
	updatePwdSuccJs = $.i18n.prop("resetPassword_js_updatePwdSucc");
	okJs       = $.i18n.prop("tan_ok");
});
//------------------ end --------------------

function plusReady(){
	var webv = plus.webview.currentWebview(),
		curl = upre + "/app/memb/member!modifyPassword.action",
		oldPassword = mui('#oldPassword')[0],
		newPassword = mui('#newPassword')[0],
		cfmPassword = mui('#cfmPassword')[0],
		SREG = /^[\@A-Za-z0-9\!\#\$\%\^\&\*\.\~]{6,20}$/,
		cfmbtn = mui('#cfmbtn')[0];
	cfmbtn.addEventListener('tap',doModify,false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "reset.html"}
	});
	window.addEventListener('reLogin',function(){
		mui.openWindow({
			url:"login.html"
		})
		webv.close();
	},false);
	
	function doModify(){
		var oldpwd = $.trim(oldPassword.value);
		var newpwd = $.trim(newPassword.value);
		var cfmpwd = $.trim(cfmPassword.value);
		if(!SREG.test(oldpwd)){ // @since liujun 2018-02-03 添加检验密码格式
			mui.toast(oldPwdErJs);
			return;
		} else if(!SREG.test(newpwd)){ // @since liujun 2018-02-03 添加检验密码格式
			mui.toast(newPwdErJs);
			return;
		} else if(!SREG.test(cfmpwd)){ // @since liujun 2018-02-03 添加检验密码格式
			mui.toast(cfmPwdErJs);
			return;
		} else if (newpwd !== cfmpwd) {
			mui.toast(onEqualJs);
			return;
		} else {
			cfmbtn.removeEventListener("tap", doModify, false);
			plus.nativeUI.showWaiting(updatePwdJs);
			try {
				$.ajax({
					url: curl,
					type: "post",
					data: {
						oldPassword: oldpwd,
						newPassword: newpwd,
						cfmPassword: cfmpwd
					},
					dataType: "json",
					success: function(item) {
						cfmbtn.addEventListener("tap", doModify, false);
						if(conf.debug){
							console.log(JSON.stringify(item));
						}
						plus.nativeUI.closeWaiting();
						successHandler(item);
					},
					error: function(xhr, type, cause){
						cfmbtn.addEventListener("tap", doModify, false);
						plus.nativeUI.closeWaiting();
						ajaxerror(xhr, type, cause);
					}
				});
			} catch (e) {
				cfmbtn.addEventListener("tap", doModify, false);
				plus.nativeUI.closeWaiting();
				if(conf.debug){
					console.error(e.message);
				}
			}
		}
	}
	
	function successHandler(item){
		if (item.ret == 0) {
			$.dialog({content: updatePwdSuccJs, ok: okJs,modal:true,okCallback:batchUp});
		} else if(item.ret == 1){
			$.dialog({content: item.msg, ok: okJs,modal:true,okCallback:batchUp1});
		}  else if(item.ret == 2){
			$.dialog({content: item.msg, ok: okJs,modal:true});
		}
		
		function batchUp(){
			Access.initLogin(item);
			mui.openWindow({
				url : 'index.html'
			})
			webv.close();
		}
		
		function batchUp1(){
			mui.openWindow({
				url:"login.html",
				extras:{
					redirect:"reset.html"
				}
			});
		}
	}

}

mui.init({
	swipeBack: false
});

mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});
