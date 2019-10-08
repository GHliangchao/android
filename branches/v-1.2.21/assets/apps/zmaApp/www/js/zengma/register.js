var conf = zengma_conf,upre = conf.getUrlPrefix(),dpage = null;
// i18n国际化资源 @since liujun 2018-02-23
//------------------start--------------------
var okJs, agreeProJs, chooseRegroleJs, phoneJs, atypismPassJs,
	phoneErJs, passwordJs, passwordErJs, cfmPasswordErJs,imgcodeErJs,
	checkCodeErJs, waitCodesJs, sendErrorJs, resetSendJs;
i18n.readyI18n(function(){
	$("#titleText").html($.i18n.prop("register_titleText"));
	$("#regroleText").html($.i18n.prop("register_regroleText"));
	$("#regrole").append("<option value='0' style=\"display: none;\">"+$.i18n.prop('register_selRole')+"</option>"
						+"<option value='P'>"+$.i18n.prop('register_roleP')+"</option>"
						+"<option value='B'>"+$.i18n.prop('register_roleB')+"</option>");
	$("#phoneText").html($.i18n.prop("register_phoneText"));
	$("#imgcheckcodeText").html($.i18n.prop("register_checkcodeText"));
	$("#checkcodeText").html($.i18n.prop("register_checkcodeText"));
	$("#sendCode").html($.i18n.prop("register_sendCode"));
	$("#passwordText").html($.i18n.prop("register_passwordText"));
	$("#repeatPassText").html($.i18n.prop("register_repeatPassText"));
	$("#checkBoxText").html($.i18n.prop("register_checkBoxText"));
	$("#protocolText").html($.i18n.prop("register_protocolText"));
	$("#nextText").html($.i18n.prop("register_nextText"));
	$("#phone").attr("placeholder", $.i18n.prop("register_placeholder_phone"));
	$("#checkcode").attr("placeholder", $.i18n.prop("register_placeholder_checkcode"));
	$("#imgcode").attr("placeholder", $.i18n.prop("register_placeholder_checkcode"));
	$("#password").attr("placeholder", $.i18n.prop("register_placeholder_password"));
	$("#cfmPassword").attr("placeholder", $.i18n.prop("register_placeholder_repeatPass"));
	// js中需要国际化的文字
	okJs = $.i18n.prop("tan_ok");
	agreeProJs = $.i18n.prop("register_js_agreeProtocol");
	chooseRegroleJs = $.i18n.prop("register_js_chooseRegrole");
	phoneJs   = $.i18n.prop("register_js_phone");
	phoneErJs = $.i18n.prop("register_js_phoneEr");
	passwordJs= $.i18n.prop("register_js_password");
	passwordErJs   = $.i18n.prop("register_js_passwordEr");
	cfmPasswordErJs= $.i18n.prop("register_js_repeatPassEr");
	atypismPassJs  = $.i18n.prop("register_js_atypismpass");
	checkCodeErJs  = $.i18n.prop("register_js_checkcodeEr");
	waitCodesJs    = $.i18n.prop("register_js_waitCodes");
	sendErrorJs    = $.i18n.prop("register_js_sendError");
	resetSendJs    = $.i18n.prop("register_js_resetSend");
	imgcodeErJs	   = $.i18n.prop("forget_checkimgcode_error");
});
//------------------end--------------------
function plusReady(){
	var phone = mui("#phone")[0],
		regrole= mui("#regrole")[0],
		checkcode = mui("#checkcode")[0],
		sendCode = mui("#sendCode")[0],
		password = mui("#password")[0],
		cfmPassword = mui("#cfmPassword")[0],
		checkpoint = mui("#checkpoint")[0],
		regBtn = mui("#regbtn")[0],
		reg = /^0?1[3|4|5|7|8][0-9]\d{8}$/,
		SREG = /^[\@A-Za-z0-9\!\#\$\%\^\&\*\.\~]{6,20}$/,
		prxy = mui("#prxy")[0],
		rurl = upre + "/app/register!register.action",
		curl = upre + "/app/register!sendCheckCode.action";
		
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "register.html"}
	});
	$("#checkImg").attr("src", upre+"/CheckCode.svl");
	phone.value = "";
	sendCode.addEventListener('click',sendCodes,false);
//	prxy.addEventListener("click",function(event){
//		var tanchub=$('#yhxy');
//		tanchub[0].style.display="";
//		event.stopPropagation();
//	},false);
	regBtn.addEventListener("tap", register, false);
	window.addEventListener("colesback",function(e){
		regBtn.addEventListener("tap", register, false);
	},false);
	
	function register(){
		console.log("do-register");
		showerr("");
		if(!$("#checkpoint").hasClass("checkbox_choosed")){
			showerr(agreeProJs);
			return;
		}
		if ($.trim(regrole.value) === ""||regrole.value==0){
			showerr(chooseRegroleJs);
			return;
		}
		if ($.trim(phone.value) === ""){
			showerr(phoneJs);
			return;
		}else if (!reg.test(phone.value)) {
			showerr(phoneErJs);
			return;
		}else if((pass = $.trim(password.value)) === ""){
			showerr(passwordJs);
			return;
		}else if(!SREG.test(password.value)){ // @since liujun 2018-02-03 添加检验密码格式
			showerr(passwordErJs);
			return;
		}else if(!SREG.test(cfmPassword.value)){
			showerr(cfmPasswordErJs);
			return;
		}else if(password.value != cfmPassword.value){
			showerr(atypismPassJs);
			return;
		}else if($.trim(checkcode.value) === ""){
			showerr(checkCodeErJs);
			return;
		}
		regBtn.removeEventListener("tap", register, false);
		try {
			mui.ajax(rurl, {
				type: "GET",
				data: {
					username: phone.value,
					password:password.value,
					code:checkcode.value,
					rego:regrole.value
				},
				dataType: "json",
				success: function(infs) {
					regBtn.addEventListener("tap", register, false);
					if (conf.debug) {
						console.log(JSON.stringify(infs));
					}
					if (infs.ret == 0) {
						Access.initLogin(infs);
						var username = infs.loginname;
						var dpage= null;
						dpage = plus.webview.getWebviewById("perfect.html");
						if(dpage==null){
							mui.openWindow({url: "perfect.html"});
						}else{
							mui.fire(dpage, "ppreload");
						}
					}else{
//						alert(infs.msg);
						$.dialog({content: infs.msg, ok: okJs, modal:true});
					}
				},
				error:function(xhr,type, cause){
					regBtn.addEventListener("tap", register, false);
					ajaxerror(xhr, type, cause);
				}
			});
		} catch (e) {
			console.error(e.message);
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
	//	var curl = upre + "/app/login!sendCheckCode.action";
		curCount = count;
		var imageCode = $("#imgcode").val();
		if (phone.value == "") {
			showerr(phoneJs);
		} else if (!reg.test(phone.value)) {
			showerr(phoneErJs);
		} else if($.trim(imageCode) == ""){
			showerr(imgcodeErJs);
		} else {
			sendCode.removeEventListener('click',sendCodes);
			$('#sendCode').removeClass('yzm');
			$('#sendCode').addClass('yzm_gray');
			sendCode.innerHTML = waitCodesJs + curCount + "s)";
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
						showerr(sendErrorJs);
						resetSend();
						//$.dialog({ content: "发送失败!", modal: true, autoCloseTime: 1000});
						//alert("发送失败");
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
			sendCode.innerHTML = waitCodesJs + curCount + "s)";
		}
	}
	
	function resetSend(){
		window.clearInterval(InterValObj); //停止计时器
		$('#sendCode').removeClass('yzm_gray');
		$('#sendCode').addClass('yzm');
		sendCode.addEventListener("click", sendCodes, false); //启用按钮
		sendCode.innerText = resetSendJs;
		imgCode.refresh();
		$("#imgcode").val("");
	}
}

// 图片验证码
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

mui.init();
mui.plusReady(plusReady);

function checkagree(){
	var agree=$("#checkpoint");
	if(agree.hasClass("checkbox_choosed")){
		agree.removeClass("checkbox_choosed");
	}else{
		agree.addClass("checkbox_choosed");
	}
	return;
}
