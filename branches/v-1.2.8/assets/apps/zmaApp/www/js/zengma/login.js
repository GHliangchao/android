var conf = zengma_conf,upre = conf.getUrlPrefix(),dpage = null;
//i18n国际化资源 @since liujun 2018-02-23
//------------------start--------------------
var usernameTan, passwordTan, phoneTan, imgcodeTan, 
imgcodeErTan, okTan, waitInfo;
i18n.readyI18n(function(){
	$("#loginText").html($.i18n.prop("login_TitleText"));
    $("#username").attr("placeholder", $.i18n.prop("login_placeholder_username"));
    $("#password").attr("placeholder", $.i18n.prop("login_placeholder_password"));
    $("#imgcode").attr("placeholder", $.i18n.prop("login_placeholder_imgcode"));
    $("#loginBtn").html($.i18n.prop("login_loginBtn"));
    $("#forget").html($.i18n.prop("login_forget"));
    $("#register").html($.i18n.prop("login_register"));
    // 弹框的内容显示
    usernameTan = $.i18n.prop("login_tan_username");
    passwordTan = $.i18n.prop("login_tan_password");
    phoneTan    = $.i18n.prop("login_tan_phone");
    imgcodeTan  = $.i18n.prop("login_tan_imgcode");
    imgcodeErTan= $.i18n.prop("login_tan_imgcodeEr");
    okTan = $.i18n.prop("tan_ok");
    waitInfo = $.i18n.prop("login_wait_info");
});
//------------------end--------------------
function plusReady() {
	var self = plus.webview.currentWebview(),
		loginBtn = mui("#loginBtn")[0],
		username = mui("#username")[0],
		password = mui("#password")[0],
		imgcode = mui("#imgcode")[0],
		imgReg = /^\d{4}$/ ,
		reg = /^0?1[3|4|5|7|8][0-9]\d{8}$/,
		register = mui("#register")[0],
		forget = mui("#forget")[0],
		curl = upre + '/app/login!login.action',
		redirect = self.redirect,
		isfresh = self.isfresh;
	$("#checkImg").attr("src", upre+"/CheckCode.svl");
	loginBtn.addEventListener('tap', dologin, false);
	register.addEventListener("tap", registerHandler, false);
	forget.addEventListener("tap", forgetHandler, false);
	var opener=self.opener();
	if(opener!=null){
		var openerid=opener.id;
		if(openerid=="forget.html"){
			opener.close();
		}
	}
	window.addEventListener("ppreload", webinit, false);
	function webinit(e){
		var detail = e.detail;
		redirect = detail.redirect;
		isfresh = detail.isfresh;
		self.show("slide-in-right");
	}
	window.addEventListener("colesback", function(e) {
		loginBtn.addEventListener("tap", dologin, false);
	}, false);
	function closeback(){
		loginBtn.addEventListener("tap", dologin, false);
	}
	function dologin() {
		if(username.value == "") {
			$.dialog({content: usernameTan, ok: okTan,modal:true,okCallback: closeback});
			return;
		} else if(password.value == "") {
			$.dialog({content: passwordTan, ok: okTan,modal:true,okCallback: closeback});
			return;
		} else if(!reg.test(username.value)) {
			$.dialog({content: phoneTan, ok: okTan,modal:true,okCallback: closeback});
		} else if(imgcode.value == ""){
			$.dialog({content: imgcodeTan, ok: okTan,modal:true});
			return;
		} else if(!imgReg.test(imgcode.value)) {
			$.dialog({content: imgcodeErTan, ok: okTan,modal:true});
			return;
		}else {
			loginBtn.removeEventListener("tap", dologin, false);
			try {
				plus.nativeUI.showWaiting(waitInfo);
				mui.ajax(curl, {
					type: "POST",
					data: {
						username: username.value,
						password: password.value,
						imgcode: imgcode.value,
					},
					dataType: "json",
					success: successHandler,
					error: function() {
						plus.nativeUI.closeWaiting();
						loginBtn.addEventListener("tap", dologin, false);
						console.log("login-failed")
					}
				});
			} catch(e) {
				plus.nativeUI.closeWaiting();
				loginBtn.addEventListener("tap", dologin, false);
				console.error(e.message);
			}
		}
	}
	
		function successHandler(e) {
			var item = e;
			loginBtn.addEventListener("tap", dologin, false);
			plus.nativeUI.closeWaiting();
	
			if (typeof e.detail === "object") {
				item = e.detail.item;
			}
			if (conf.debug) {
				console.log("successHandler(): " + JSON.stringify(item));
			}
			if(item.ret == "0"){
				Access.initLogin(item);
				if (redirect && redirect != "index.html") {
						var dpage = plus.webview.getWebviewById(redirect);
						if (conf.debug) {
							console.log("redirect: " + redirect);
						}
						// re-preload: can't preload in autoShow: false page
						if(dpage == null){
							mui.openWindow({url: redirect});
						}else{
							if(isfresh){
								mui.fire(dpage, "getnewlist");
							}else{
								mui.fire(dpage, "ppreload");
							}
						}
					}else{
						var dpage = plus.webview.getWebviewById('index.html');
						// re-preload: can't preload in autoShow: false page
						if(dpage == null){
							mui.openWindow({url: 'index.html'});
						}else{
							mui.fire(dpage, "ppreload");
						}
					}
					//self.close();
			}else{
	//			password.value = "";
				imgcode.value = "";
				imgCode.refresh();
				$.dialog({content: item.msg, ok: "确定",modal:true});
			}
		}
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {
			redirect: "login.html"
		}
	});

	function registerHandler() {
		mui.openWindow({
			url: 'register.html'
		});
	}

	function forgetHandler() {
		mui.openWindow({
			url: 'forget.html'
		});
	}
	function ImgCheckcode(){
		this.url= upre+"/CheckCode.svl";
	}
	ImgCheckcode.prototype = {
		constructor: ImgCheckcode,
		init: function(id, url){
			var self = this;
			self.img = $("#checkImg");
			self.url = url || self.url;
			$(self.img).click(function(){
				self.refresh();
			});
		},
		refresh: function(){
			$("#imgcode").value = "";
			var newurl=this.url + "?_=" + new Date().getTime();
			$(this.img).attr("src",newurl);
		}
	};
	var imgCode = new ImgCheckcode();
	imgCode.init();
	
}

//plusReady事件后，自动创建menu窗口；
mui.plusReady(function() {	
	plusReady();
	conf.uiInit();
	plus.nativeUI.closeWaiting();
	plus.webview.currentWebview().show();
	mui.init({
		swipeBack: false
	});
});
//mui.plusReady(plusReady);