var conf = zengma_conf, upre = conf.getUrlPrefix();

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var loadingJs, okJs,cancelJs, defultNameJs, logoutErJs, enterNameJs,
	updateNameJs, nameIsNullJs, submittingJs, updateSuccJs, handlePicJs,
	uploadProJs, uploadProSuccJs, errorJs, onCertifiedJs;
i18n.readyI18n(function(){
	$("#centerText").html($.i18n.prop("center_titleText"));
	$("#uHeadPicText").html($.i18n.prop("center_headPicText"));
	$("#updateNameText").html($.i18n.prop("center_updateNameText"));
	$("#uPasswordText").html($.i18n.prop("center_uPasswordText"));
	$("#umodifyInfoText").html($.i18n.prop("center_umodifyInfoText"));
	$("#logoutText").html($.i18n.prop("center_logoutText"));
	$("#camera").html($.i18n.prop("center_canmeraText"));
	$("#gallery").html($.i18n.prop("center_galleryText"));
	$("#cancelText").html($.i18n.prop("center_cancelText"));
	$("#updateEmailText").html($.i18n.prop("center_emailText"));
	// javaScript
	loadingJs = $.i18n.prop("center_js_loading");
	okJs	  = $.i18n.prop("tan_ok");
	cancelJs  = $.i18n.prop("center_cancelText");
	defultNameJs = $.i18n.prop("center_js_defaultName");
	logoutErJs   = $.i18n.prop("center_js_logoutEr");
	enterNameJs  = $.i18n.prop("center_js_enterName");
	updateNameJs = $.i18n.prop("center_js_updateName");
	nameIsNullJs = $.i18n.prop("center_js_nameIsNull");
	submittingJs = $.i18n.prop("center_js_submitting");
	updateSuccJs = $.i18n.prop("center_js_updateSucc");
	handlePicJs  = $.i18n.prop("center_js_handlePic");
	uploadProJs  = $.i18n.prop("center_js_uploadPro");
	uploadProSuccJs = $.i18n.prop("center_js_uploadProSucc");
	errorJs      = $.i18n.prop("center_js_error");
	promptOkJs	 = $.i18n.prop("center_js_promptOk");
	onCertifiedJs= $.i18n.prop("center_js_onCertified");
	emailUpdateJs= $.i18n.prop("center_emailText");
	emailEnterJs = $.i18n.prop("center_enter_email");
	logouting	 = $.i18n.prop("center_logouting");
	emaillEr	 = $.i18n.prop("perfect_js_emailEr");
});
//------------------ end --------------------

function plusReady() {
	var webv = plus.webview.currentWebview(),
		curl = upre + "/app/memb/member!init.action",
		lurl = upre + "/app/memb/member!logout.action",
		mnurl = upre + "/app/memb/member!modifyName.action",
		meurl = upre + "/app/memb/member!modifyEmail.action",
		cbtn = mui("#camera")[0],
		gbtn = mui("#gallery")[0],
		logoutbtn = mui("#logout")[0],
		modifyName = mui('#modifyName')[0],
		modifyPassword = mui('#modifyPassword')[0],
		modifyInfo = mui('#modifyInfo')[0],
		profilebtn = mui("#profile")[0],
		modifyEmailBtn = mui("#modifyEmail")[0],
		listLast = 0,
		nickname, profile;
	window.addEventListener("ppreload", webinit, false);
	window.addEventListener("getnewlist", infoinit, false);
	logoutbtn.addEventListener("tap", logout, false);
	modifyName.addEventListener("tap", modifyNickName, false);
	modifyPassword.addEventListener("tap", modifyPwd, false);
	modifyInfo.addEventListener("tap", modifyUserInfo, false);
	profilebtn.addEventListener("tap", picturectrl, false);
	cbtn.addEventListener("tap", camera, false);
	gbtn.addEventListener("tap", gallery, false);
	modifyEmailBtn.addEventListener("tap", modifyEmail, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "member_center.html"}
	})
	function webinit(e) {
		var detail = e.detail;
		infoinit();
	}
	infoinit();
	function infoinit(){
		// 设置状态栏 @since liujun 2018-11-30
		conf.setDarkStatusbar();
		webv.show("slide-in-right");
		var ts = new Date().getTime();
		if (listLast != 0 && (ts - listLast) < 1000) {
			return;
		}
		listLast = ts;
		plus.nativeUI.showWaiting(loadingJs);
		try{
			mui.ajax(curl, {
				type: "GET",
				dataType: "json",
				success: function(infs) {
					plus.nativeUI.closeWaiting();
					if (conf.debug) {
						console.log("ddddddddd: "+JSON.stringify(infs));
					}
					if (infs.ret == 0) {
						successHandler(infs);
					} else if (infs.ret == 1) {
						$.dialog({
							content: infs.msg,
							ok: okJs,
							cancel: cancelJs,
							modal: true,
							okCallback: gotologin,
							cancelCallback: closePage
						});
					}
				},
				error: function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr,type, cause);
				}
			});
		} catch (e) {
			plus.nativeUI.closeWaiting();
			console.error(e.message);
		}
	}
	
	function successHandler(infs){
		nickname = infs.nickname || defultNameJs;
		var name = infs.auth == 'N'
		         ? (nickname + "&nbsp;&nbsp;" + onCertifiedJs)
		         : nickname;
		$("#nickname").empty().append(name);
		$("#email").empty().append(infs.email);
		if (infs.profile) {
			profile = infs.profile;
			$('#profile').attr("style","background: url(" + profile + ") no-repeat; background-size:cover ;");
		} else {
			$('#profile').attr("style","background: url(images/s1.jpg) no-repeat; background-size:cover ;");
		}
	}
	
	function closePage(){
		mui.back();
	}
	
	function logout(){
		plus.nativeUI.showWaiting(logouting);
		logoutbtn.removeEventListener("tap", logout, false);
		doLogout();
	}
	
	function doLogout() {
		mui.ajax(lurl, {
			type: "GET",
			dataType:"json",
			success: function(infs){
				logoutbtn.addEventListener("tap", logout, false);
				if(conf.debug){
					console.debug(JSON.stringify(infs));
				}
				if (infs.ret == 0) {
//					cleanup();
					Access.clrLogged(true);
					plus.storage.clear();
					//go-login
					setTimeout(function(){
						plus.nativeUI.closeWaiting();
						var page = plus.webview.getWebviewById("login.html");
						if (page == null){
							mui.preload({
								url:"login.html",
								extras: {
									hideOpener: true,
									redirect: "member_center.html",
									backIndex: true
								}
							});
						} else {
							mui.fire(page, "ppreload", {
								hideOpener: true,
								redirect: "member_center.html",
								backIndex: true
							});
						}
					}, 100);
				} else {
					plus.nativeUI.closeWaiting();
					$.dialog({
						content: infs.msg,
						ok: okJs,
						modal: true
					});
				}
			},
			error: function(){
				plus.nativeUI.closeWaiting();
				logoutbtn.addEventListener("tap", logout, false);
				$.dialog({
					content: logoutErJs,
					ok: okJs,
					modal: true
				});
			}
		});
	}
	
//	function cleanup() {
//		var menu, pages;
//		Access.clrLogged(true);
//		pages = plus.webview.all();
//		mui.each(pages, function(pi, page){
//			if(conf.debug){
//				console.log(page.getURL());
//			}
//			var url, i, index = "index.html";
//			if (webv == page) {
//				console.log("webw == page");
//				return;
//			}
//			url = page.getURL();
//			i = url.indexOf(index);
//			if (i == url.length - index.length) {
//				console.log("i == url.length - index.length");
//				return;
//			}
//			page.close("none");
//		});
//		pages = null;
//	}

	function modifyEmail(){
		modifyEmailBtn.removeEventListener("tap", modifyEmail, false);
		mui.prompt(emailUpdateJs,"",emailEnterJs,new Array(promptOkJs, cancelJs), function(e){
			modifyEmailBtn.addEventListener("tap", modifyEmail, false);
			if (e.index == 0){
				doModifyEmail(e.value);
			}
		});
	}

	function doModifyEmail(email){
		var reg = new RegExp("^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$");
		if ($.trim(email) != "" && !reg.test(email)){
			mui.toast(emaillEr);
			return;
		}
		plus.nativeUI.showWaiting(submittingJs);
		$.ajax({
			url: meurl,
			type: "POST",
			dataType:"JSON",
			data:{
				email: email
			},
			success:function(infs){
				plus.nativeUI.closeWaiting();
				if (infs.ret == 0) {
					$("#email").empty().append(email);
					mui.toast(updateSuccJs);
				} else if (infs.ret == 1) {
					$.dialog({
						content: infs.msg,
						ok: okJs,
						modal: true
					});
				}
			},
			error: function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	function modifyNickName() {
		modifyName.removeEventListener("tap", modifyNickName, false);
		mui.prompt(
			enterNameJs,
			"",
			updateNameJs,
			new Array(promptOkJs, cancelJs),
			function (e){
				modifyName.addEventListener("tap", modifyNickName, false);
				if (e.index == 0) {
					if (conf.debug) {
						console.log(e.value);
					}
					doModifyName(e.value);
				}
			}
		)
	}
	
	function doModifyName(val) {
		if (val == null || val == "") {
			mui.toast(nameIsNullJs);
			return;
		}
		plus.nativeUI.showWaiting(submittingJs);
		try{
			mui.ajax(mnurl, {
				type: "POST",
				data: {
					nickname: val
				},
				dataType: "json",
				success: function(infs) {
					plus.nativeUI.closeWaiting();
					if (conf.debug) {
						console.debug(JSON.stringify(infs));
					}
					if (infs.ret == 0) {
						var tag = $("#nickname").empty().append(val);
						if(infs.rnauth == 'N'){
						    tag.append("&nbsp;&nbsp;").append(onCertifiedJs);
						}
						mui.toast(updateSuccJs);
					} else if (infs.ret == 1) {
						$.dialog({
							content: infs.msg,
							ok: okJs,
							modal: true
						});
					}
				},
				error: function (xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		} catch (e) {
			plus.nativeUI.closeWaiting();
			console.error(e.message);
		}
	}
	
	function picturectrl() {
		mui('#picture').popover('toggle');
	}
	
	var imagePath = null , Orientation;
	function camera() {
		var camera = plus.camera.getCamera(1);
		camera.captureImage(function success(path) {
			plus.io.resolveLocalFileSystemURL(path, function(entry) {
				var localurl = entry.toLocalURL();
				if (mui.os.ios) {
					var img2 = new Image();
					img2.src = localurl;
					EXIF.getData(img2, function() {
						EXIF.getAllTags(this);
						Orientation = EXIF.getTag(this, 'Orientation');
					});
				}
				appendFile(localurl);
				$("#demo_input").trigger("click");
				imagePath = path;
				//$("#fabuforum").attr("src",path);
			});
		}, function error(e) {
				//mui.alert("调用摄像头失败~");
		});
			// 先隐藏asheet
		picturectrl();
	}
	
	function gallery() {
		plus.gallery.pick(function(path) {
			if (mui.os.ios) {
				var img2 = new Image();
				img2.src = path;
				EXIF.getData(img2, function() {
					EXIF.getAllTags(this);
					Orientation = EXIF.getTag(this, 'Orientation');
				});
			}
			imagePath = path
			//$("#fabuforum").attr("src",path);
			appendFile(path);
				
		}, function(e) {
			//mui.alert("获取相册图片失败~");
		});
			// 先隐藏asheet
		picturectrl();
	}
	
	function appendFile(path) {
		var img = new Image(),//dwid = window.screen.width
			dwid=1080,
			ts = new Date().getTime();
		img.src = path;
		plus.nativeUI.showWaiting(handlePicJs);
		img.onload = function() {
			var that = this,
				te,
				rems = 4;
			//生成比例
			var w = that.width,
				h = that.height,
				scale = w / h;
			console.log("before:"+w);
			console.log("scale:"+scale);
			// 减小图片大小： 480 -> 2 *rems * conf.rem（提高处理和上传速度）
			w = Math.ceil(16 * rems * conf.rem) || w;
			console.log("after:"+w);
			h = w / scale;

			if (conf.debug) {
				te = new Date().getTime();
				console.log("load-img-time: " + (te - ts) + "ms");
				ts = te;
			}
			//生成canvas
			var canvas = document.getElementById('icanvas');
			var ctx;
			if (mui.os.ios) {
				//如果方向角不为1，都需要进行旋转 added by lzk  
				if (Orientation != "" && Orientation != 1) {
					h=Math.ceil(dwid);
					w=scale*h;		
					handleImg(this, Orientation, canvas, h, w);
				} else {
					w=Math.ceil(dwid);
					h = w / scale;
					ctx = canvas.getContext('2d');
					$(canvas).attr({
						width: w,
						height: h
					});
					ctx.drawImage(that, 0, 0, w, h);
				}
			} else {
				w=Math.ceil(dwid);
				h = w / scale;
				ctx = canvas.getContext('2d');
				$(canvas).attr({
					width: w,
					height: h
				});
				ctx.drawImage(that, 0, 0, w, h);
			}
			var base64 = canvas.toDataURL(conf.imgType);
			if (conf.debug) {
				te = new Date().getTime();
				console.log("handle-img-time: " + (te - ts) + "ms");
			}
			plus.nativeUI.closeWaiting();
			uploadProfile(base64, path, canvas.width, canvas.height, rems);
			$("#profile").attr("style","background: url("+path+"); background-size:cover ;");
		}
	}
	
	function uploadProfile(file, spath, w, h, rems) {
		var upre = conf.getUrlPrefix(),
			purl = upre + "/app/memb/member!uploadProfile.action",
			ts = new Date().getTime();
		try {
			plus.nativeUI.showWaiting(uploadProJs);
			mui.ajax(purl, {
				type: "POST",
				data: {
					imageFile: file
				},
				dataType: "json",
				cache: false,
				success: function(infs) {
					var te;
					plus.nativeUI.closeWaiting();
					if (conf.debug) {
						te = new Date().getTime();
						console.debug(JSON.stringify(infs));
						console.log("upload-time: " + (te - ts) + "ms");
					}
					var dpage= null;
						dpage = plus.webview.getWebviewById("member_center.html");
					if(dpage!=null){
						mui.fire(dpage,"getnewlist");
					}
					if (infs.ret == 1) {
//						alert({content: infs.msg});
						$.dialog({content: infs.msg, ok: okJs,modal:true});
						return;
					}
					mui.toast(uploadProSuccJs);
					if (conf.debug) {
						console.log("render-time: " + (new Date().getTime() - te) + "ms");
					}
				},
				error:function(xhr,type, cause){
					plus.nativeUI.closeWaiting();
					if (xhr.status === 401) {
						mui.preload({url: "login.html",
							extras: {redirect: plus.webview.currentWebview().id,
									isfresh :true}
							});
						//conf.perfect().show(xhr.status);
					} else {
						console.log(xhr.status);
//						alert({content: "出错啦~"});
						$.dialog({content: errorJs, ok: okJs,modal:true});
					}
				}
			});
		} catch (e) {
			plus.nativeUI.closeWaiting();
			console.error(e.message);
		}
	}
	
	function modifyPwd() {
		/*mui.preload({
			url: "reset.html"
		});*/
		var url = "reset.html";
		openWebv(url);
	}
	
	function modifyUserInfo() {
		/*var dpage = plus.webview.getWebviewById("memb_info.html");
		if (dpage == null) {
			mui.preload({
				url: "memb_info.html"
			})
		} else {
			mui.fire(dpage, "ppreload");
		}*/
		var url = "memb_info.html";
		openWebv(url);
	}
	
	function openWebv(url){
		var dpage = plus.webview.getWebviewById(url);
		if (dpage == null) {
			mui.preload({url: url});
		} else {
			mui.fire(dpage, "ppreload");
		}
	}
}

mui.init({
	swipeBack: false,
	beforeback:function(){
		// @since liujun 2018-11-30 返回index.html，重新设置状态栏颜色
		var webv = plus.webview.currentWebview();
		var openerPage = webv.opener();
		console.log("opener html is " + openerPage.id);
		if (openerPage.id == "zmaApp" || openerPage.id == "index.html") {
			mui.fire(openerPage, "ppreload");
			webv.close();
			return false;
		}
		return true;
	}
});

mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});
