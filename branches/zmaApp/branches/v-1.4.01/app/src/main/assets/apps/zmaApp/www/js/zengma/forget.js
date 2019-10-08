var conf = zengma_conf,upre = conf.getUrlPrefix();
// i18n 国际化资源 @since liujun 2018-02-24
// ------------------start--------------------
var phoneTan, checkcodeTan, newPasswordTan, passwordTan,
	phoneTanEr, waitInfoEr, okTan, errorTan, updateSucc,imgcodeErJs,
	waitCodes, sendErrorTan, resetSendTan;
i18n.readyI18n(function(){
	// 页面上的国际化资源
	$("#forgetText").html($.i18n.prop("forget_titleText"));
	$("#phoneText").html($.i18n.prop("forget_phoneText"));
	$("#imgcheckcodeText").html($.i18n.prop("register_checkcodeText"));
	$("#checkcodeText").html($.i18n.prop("forget_checkcodeText"));
	$("#setPasswordText").html($.i18n.prop("forget_setPasswordText"));
	$("#sendCode").html($.i18n.prop("forget_sendCodeText"));
	$("#btnText").html($.i18n.prop("forget_btnText"));
	$("#password").attr("placeholder", $.i18n.prop("forget_placeholder_password"));
	$("#username").attr("placeholder", $.i18n.prop("forget_placeholder_username"));
	$("#checkcode").attr("placeholder", $.i18n.prop("forget_placeholder_checkcode"));
	$("#imgcode").attr("placeholder", $.i18n.prop("register_placeholder_checkcode"));
	// 弹框提示的国际化资源
	phoneTan = $.i18n.prop("forget_tan_phone");
	checkcodeTan = $.i18n.prop("forget_tan_checkcode");
	newPasswordTan = $.i18n.prop("forget_tan_newPassword");
	passwordTan = $.i18n.prop("forget_tan_passwordEr");
	phoneTanEr  = $.i18n.prop("forget_tan_phoneEr");
	waitInfoEr  = $.i18n.prop("forget_wait_info");
	okTan       = $.i18n.prop("tan_ok");
	errorTan    = $.i18n.prop("forget_tan_error");
	updateSucc  = $.i18n.prop("forget_tan_updateSucc");
	waitCodes   = $.i18n.prop("forget_tan_waitCodes");
	sendErrorTan= $.i18n.prop("forget_tan_sendError");
	resetSendTan= $.i18n.prop("forget_tan_resetSend");
	imgcodeErJs	= $.i18n.prop("forget_checkimgcode_error");
});
// ------------------ end --------------------
function plusReady(){
	var webv = plus.webview.currentWebview(),
		phone = mui("#username")[0],
		checkcode = mui("#checkcode")[0],
		password = mui("#password")[0],
		cfmbtn = mui("#cfmbtn")[0],
		sendCode = mui("#sendCode")[0],
		reg = /^0?1[3|4|5|7|8][0-9]\d{8}$/,
		SREG = /^[\@A-Za-z0-9\!\#\$\%\^\&\*\.\~]{6,20}$/,
		curl = upre + "/app/register!sendCheckCode.action",
		url = upre + "/app/login!modifyPasswrod.action";
	
	$("#checkImg").attr("src", upre+"/CheckCode.svl");
	sendCode.addEventListener('tap',sendCodes,false);
	cfmbtn.addEventListener('tap',doModify,false);
	window.addEventListener('reLogin',function(){
		/*mui.preload({
			url:"login.html"
		});*/
		var url = "login.html";
		var dpage = plus.webview.getWebviewById(url);
		console.log("open webview page is " + dpage);
		if(dpage == null){
			mui.preload({url:url});
		} else {
			mui.fire(dpage, "ppreload");
		}
		webv.close();
	},false);
	
	window.addEventListener("ppreload", initPage, false);
	webinit();
	function webinit(){
		webv.show("slide-in-right");
	}
	
	function initPage(){
		cleanData();
		webinit();
	}
	
	function cleanData(){
		phone.value = "";
		checkcode.value = "";
		password.value = "";
		imgCode.refresh();
		$("#imgcode").val("");
	}
	
	function doModify(){
		console.log("doModify");
		if ($.trim(phone.value) === ""){
			showerr(phoneTan);
			return;
		} else if($.trim(checkcode.value) === ""){
			showerr(checkcodeTan);
			return;
		} else if((pass=$.trim(password.value)) === ""){
			showerr(newPasswordTan);
			return;
		} else if(!SREG.test(password.value)){ // @since liujun 2018-02-03 添加检验密码格式
			showerr(passwordTan);
			return;
		}else if (!reg.test(phone.value)) {
			showerr(phoneTanEr);
			return;
		} else {
			cfmbtn.removeEventListener("tap", doModify, false);
			try {
				plus.nativeUI.showWaiting(waitInfoEr);
				$.ajax({
					url: url,
					type: "post",
					data: {
						username: phone.value,
						password: password.value,
						checkCode: checkcode.value,
					},
					dataType: "json",
					success: function(item) {
						cfmbtn.addEventListener("tap", doModify, false);
						if(conf.debug){
							console.log(JSON.stringify(item));
						}
						plus.nativeUI.closeWaiting();
						successHanlder(item);
					},
					error: function(xhr, type, cause){
						cfmbtn.addEventListener("tap", doModify, false);
						plus.nativeUI.closeWaiting();
						console.log(xhr.status);
						$.dialog({content: errorTan, ok: okTan, modal:true});
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
	
	function successHanlder(item){
		if (item.ret == 0) {
			$.dialog({content: updateSucc, ok: okTan, modal:true,okCallback:batchUp});
		} else{
			$.dialog({content: item.msg, ok: okTan, modal:true});
		} 
		function batchUp(){
			Access.initLogin(item);
			/*mui.preload({
				url : 'index.html'
			});*/
			var url = "index.html";
			var dpage = plus.webview.getWebviewById(url);
			console.log("open webview page is " + dpage);
			if(dpage == null){
				mui.preload({url:url});
			} else {
				mui.fire(dpage, "ppreload");
			}
			//webv.close();
		}
	}
	
	function showerr(err){
		$('#herror')[0].innerText=err;
	}

var InterValObj; //timer变量，控制时间
var count = 60; //间隔函数，1秒执行
var curCount; //当前剩余秒数

function sendCodes() {
	console.log("sendCode");
	showerr("");
//	var curl = upre + "/app/login!sendCheckCode.action";
	curCount = count;
	var imageCode = $("#imgcode").val();
	if (phone.value == "") {
		showerr(phoneTan);
	} else if (!reg.test(phone.value)) {
		showerr(phoneTanEr);
	} else if($.trim(imageCode) == ""){
		showerr(imgcodeErJs);
	} else {
		sendCode.removeEventListener('tap',sendCodes);
		$('#sendCode').removeClass('yzm');
		$('#sendCode').addClass('yzm_gray');
		sendCode.innerHTML = waitCodes + curCount;
		InterValObj = window.setInterval(SetRemainTime, 1000); //启动计时器，1秒执行一次
		try {
			mui.ajax(curl, {
				type: "GET",
				data: {
					phone: phone.value,
					imgcode: imageCode
				},
				dataType: "json",
				success: function(item) {
					console.log(item.msg);
					if(item.ret == 1){
						resetSend();
						showerr(item.msg);
						return;
					}
					showerr("");
					mui.toast(item.msg);
					//$.dialog({content: item.msg, modal: true, autoCloseTime: 1000});
					//alert("发送成功");
				},
				error: function(){
					mui.toast(sendErrorTan);
					resetSend();
					//$.dialog({ content: "发送失败!", modal: true, autoCloseTime: 1000});
				}
			});
		} catch (e) {
			console.error(e.message);
		}
	}
}
//timer处理函数
	function SetRemainTime() {
		if (curCount == 0) {
			resetSend();
		} else {
			curCount--;
			sendCode.innerHTML = waitCodes + curCount;
		}
	}
	
	function resetSend(){
		window.clearInterval(InterValObj); //停止计时器
		$('#sendCode').removeClass('yzm_gray');
		$('#sendCode').addClass('yzm');
		sendCode.addEventListener("click", sendCodes, false); //启用按钮
		sendCode.innerText = resetSendTan;
		imgCode.refresh();
		$("#imgcode").val("");
	}
}

//图片验证码
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

mui.init({
	swipeBack: false
});
mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});
