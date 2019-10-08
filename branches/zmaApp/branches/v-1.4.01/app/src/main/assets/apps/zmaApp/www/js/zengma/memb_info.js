var conf = zengma_conf, upre = conf.getUrlPrefix();

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var loadingJs, submittingJs, okJs, cnameJs, buznoJs,
	idbphotoJs, canmeJs, cainumJs, contactJs, nameJs,
	idnumberJs, idmphotoJs, regionJs, addressJs, uploadJs,
	uploadSuccJs, uploadErrorJs;
i18n.readyI18n(function(){
	$("#membInfoText").html($.i18n.prop("membInfo_title"));
	$("#camera").html($.i18n.prop("membInfo_camera"));
	$("#gallery").html($.i18n.prop("membInfo_gallery"));
	$("#pictureCancel").html($.i18n.prop("membInfo_cancel"));
	$("#cfmbtn").html($.i18n.prop("membInfo_cmfBtn"));
	// javaScript
	loadingJs = $.i18n.prop("membInfo_showWait_loading");
	submittingJs = $.i18n.prop("membInfo_showWait_submit");
	okJs 	     = $.i18n.prop("tan_ok");
	cnameJs		 = $.i18n.prop("membInfo_js_cname");
	buznoJs      = $.i18n.prop("membInfo_js_buzno");
	idbphotoJs	 = $.i18n.prop("membInfo_js_idbphoto");
	canmeJs		 = $.i18n.prop("membInfo_js_canme");
	cainumJs	 = $.i18n.prop("membInfo_js_cainum");
	contactJs	 = $.i18n.prop("membInfo_js_contact");
	nameJs		 = $.i18n.prop("membInfo_js_name");
	idnumberJs	 = $.i18n.prop("membInfo_js_idnumber");
	idmphotoJs	 = $.i18n.prop("membInfo_js_idmphoto");
	regionJs	 = $.i18n.prop("membInfo_js_region");
	addressJs	 = $.i18n.prop("membInfo_js_address");
	uploadJs	 = $.i18n.prop("membInfo_showWait_upload");
	uploadSuccJs = $.i18n.prop("membInfo_js_uploadSucc");
	uploadErrorJs= $.i18n.prop("membInfo_js_uploadError");
});
//------------------ end --------------------

function plusReady() {
	var webv = plus.webview.currentWebview(),
		curl = upre + "/app/memb/memb_info!getInfo.action",
		surl = upre + "/app/memb/memb_info!submit.action",
		cbtn = mui("#camera")[0],
		gbtn = mui("#gallery")[0],
		cfmbtn = mui("#cfmbtn")[0],
		sid,
		listLast = 0;
	window.addEventListener("ppreload", webinit, false);
	window.addEventListener("getnewlist", infoinit, false);
	cbtn.addEventListener("tap", camera, false);
	gbtn.addEventListener("tap", gallery, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "memb_info.html"}
	})
	
	function toLogin(){
 		mui.preload({
 			url:"login.html",
 			extras:{
 				redirect:"memb_info.html"
 			}
 		});
 	}
	
	function webinit(e) {
		var detail = e.detail;
		infoinit();
	}
	
	infoinit();
	function infoinit(){
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
				dataType: "html",
				success: function(infs) {
					plus.nativeUI.closeWaiting();
					successHandler(infs);
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
		$("#infoContent").empty();
		$("#infoContent").append(infs);
		if (isAllow == 'Y') {
			if (role == 'B') {
				mui("#bphoto")[0].addEventListener("tap", picturectrl, false);
			}
			mui("#mphoto")[0].addEventListener("tap", picturectrl, false);	
			cfmbtn.addEventListener("tap", submitInfo, false);
		} else {
			$(".bottom").hide();
		}
	}
	
	function submitInfo() {
		var result = checkData();
		if (result != "") {
			mui.toast(result);
			return;
		}
		cfmbtn.removeEventListener("tap", submitInfo, false);
		plus.nativeUI.showWaiting(submittingJs);
		try{
			mui.ajax(surl, {
				type: "POST",
				data: $("#infoForm").serialize(),
				dataType: "json",
				cache: false,
				success: function(infs){
					cfmbtn.addEventListener("tap", submitInfo, false);
					plus.nativeUI.closeWaiting();
					if (conf.debug) {
						console.debug(JSON.stringify(infs));
					}
					if (infs.ret == 0) {
						$.dialog({
							content: infs.msg,
							ok: okJs,
							modal: true,
							okCallback: batchup
						});
					} else if (infs.ret == 1) {
						$.dialog({
							content: infs.msg,
							ok: okJs,
							modal: true,
							okCallback: toLogin
						});
					} else if (infs.ret == 2) {
						$.dialog({
							content: infs.msg,
							ok: okJs,
							modal: true
						});
					}
					
					function batchup(){
						webv.close();
					}
				},
				error: function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					cfmbtn.addEventListener("tap", submitInfo, false);
					ajaxerror(xhr, type, cause);
				}
			});
		} catch(e){
			plus.nativeUI.closeWaiting();
			cfmbtn.addEventListener("tap", submitInfo, false);
			console.error(e.message);
		}
		
	}
	
	function checkData(){
		var message = "";
		if (role == 'B') {
			if ($.trim($("#cname").val()) === "") {
				message = cnameJs;
				return message;
			}
			if ($.trim($("#buzno").val()) === ""){
				message = buznoJs;
				return message;
			}
 			if ($.trim($("#idbphoto").val()) === ""){
				message=idbphotoJs;
				return message;
			}
 			if ($.trim($("#canme").val()) === ""){
				message=canmeJs;
				return message;
			}
 			if ($.trim($("#cainum").val()) === ""){
				message=cainumJs;
				return message;
			}
 			if ($.trim($("#contact").val()) === ""){
				message=contactJs;
				return message;
			}
		}
		if ($.trim($("#name").val()) === ""){
			message=nameJs;
			return message;
		}
		if ($.trim($("#idnumber").val()) === ""){
			message=idnumberJs;
			return message;
		}
		if ($.trim($("#idmphoto").val()) === ""){
			message=idmphotoJs;
			return message;
		}
		if ($.trim($("#region").val()) === ""){
			message=regionJs;
			return message;
		}
		if ($.trim($("#address").val()) === ""){
			message=addressJs;
			return message;
		}
		return message;
	}	
	
	function picturectrl() {
		sid = $(this).attr("id") || sid;
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
				//$("#demo_input").trigger("click");
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
		plus.nativeUI.showWaiting(uploadJs);
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
			//uploadlogo(base64, path, canvas.width, canvas.height, rems);
			showPic(base64,path);
		}
	}
	
	function showPic(file,path){
		$("#" + sid).attr("src",path);
		uploadPicture(file, sid);
	}
	
	function uploadPicture(file, sid) {
		console.log("file:"+file);
		var upre = conf.getUrlPrefix(),
			purl = upre + "/app/login!uploadpic.action",
			ts = new Date().getTime();
		try {
			plus.nativeUI.showWaiting(uploadJs);
			mui.ajax(purl, {
				type: "post",
				data: {
					file: file
				},
				dataType: "json",
				cache: false,
				success: function(infs) {
					plus.nativeUI.closeWaiting();
					var te;
					if (conf.debug) {
						te = new Date().getTime();
						console.debug(JSON.stringify(infs));
						console.log("upload-time: " + (te - ts) + "ms");
					}
					if (infs.ret === 0) {
						mui.toast(uploadSuccJs);
						$("#id"+sid).val(infs.msg);
						//imgs[sid] = infs.msg;
					}else if (infs.ret === 1) {
						//alert("图片上传失败");
						$.dialog({content: uploadErrorJs, ok: okJs,modal:true});
						return;
					}else if (infs.ret === 2) {
						//alert({content:infs.msg,cfmAction:"toLogin"});
						$.dialog({content: infs.msg, ok: okJs,modal:true,okCallback: toLogin});
						return;
					}
				},
				error: function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					console.error(JSON.stringify(xhr));
				}
			});
		} catch (e) {
			plus.nativeUI.closeWaiting();
			console.error(e.message);
		}
	}
}

mui.init({
	swipeBack: false
});

mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});
