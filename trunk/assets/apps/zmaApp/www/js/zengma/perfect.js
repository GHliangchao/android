var conf = zengma_conf,upre = conf.getUrlPrefix(),dpage = null;
//i18n国际化资源 @since liujun 2018-02-23
//------------------start--------------------
var waitSubmitJs, okJs;
i18n.readyI18n(function(){
	$("#perfectText").html($.i18n.prop("perfect_titleText"));
	$("#camera").html($.i18n.prop("perfect_cameraText"));
	$("#gallery").html($.i18n.prop("perfect_galleryText"));
	$("#cancelText").html($.i18n.prop("perfect_cancelText"));
	$("#applyText").html($.i18n.prop("perfect_applyText"));
	// js中需要显示的国际化资源
	waitSubmitJs = $.i18n.prop("perfect_js_waitSubmit");
	okJs = $.i18n.prop("tan_ok");
	choosePlatform = $.i18n.prop("perfect_js_choosePlatform");
	cnameJs  = $.i18n.prop("perfect_js_cname");
	buznoJs  = $.i18n.prop("perfect_js_buzno");
	idphotoJS= $.i18n.prop("perfect_js_idphoto");
	canameJs = $.i18n.prop("perfect_js_caname");
	cainumJs = $.i18n.prop("perfect_js_cainum");
	contactJS= $.i18n.prop("perfect_js_contact");
	nameJS   = $.i18n.prop("perfect_js_name");
	idnumberJs = $.i18n.prop("perfect_js_idnumber");
	idmphotoJs = $.i18n.prop("perfect_js_idmphoto");
	regionJs   = $.i18n.prop("perfect_js_region");
	addressJs  = $.i18n.prop("perfect_js_address");
	uploadJs   = $.i18n.prop("perfect_js_waitupload");
	uploadSucc = $.i18n.prop("perfect_js_uploadSucc");
	uploadEr   = $.i18n.prop("perfect_js_uploadEr");
});
//------------------end--------------------
function plusReady(){
	var webv = plus.webview.currentWebview(),
		store = plus.storage,
		nextBtn = mui("#nextBtn")[0],
		curl=upre + "/app/memb/member!perfectInfo.action";
	window.addEventListener('ppreload',webinit,false);
	window.addEventListener("getnewlist", infoinit, false);
	//webv.addEventListener('show',infoinit,false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "perfect.html"}
	});
 	function webinit(e){
 		var detail = e.detail;//带参数的话通过detail获取
		webv.show("slide-in-right");
		infoinit();
	}
 	//webv.show();
 	infoinit();
 	function toLogin(){
 		mui.openWindow({
 			url:"login.html",
 			extras:{
 				redirect:"perfect.html"
 			}
 		});
 	}
 	function submitInfo(){
 		var message=docheck();
 		if(conf.debug) {
 			console.log(message);
 		}
 		if(message!=""){
 			showerr(message);
 		}else{
 			nextBtn.removeEventListener('click',submitInfo,false);	
 			try {
				plus.nativeUI.showWaiting(waitSubmitJs);
				mui.ajax(curl, {
					type: "post",
					data: $("#infoForm").serialize(),
					dataType: "json",
					cache: false,
					success: function(infs) {
						nextBtn.addEventListener('click',submitInfo,false);
						plus.nativeUI.closeWaiting();
						if (conf.debug) {
							console.debug(JSON.stringify(infs));
						}
						if (infs.ret == 0) {
							mui.openWindow({url: "register_last.html"});
							/*var dpage= null;
							dpage = plus.webview.getWebviewById("company_regist_result.html");
							if(dpage==null){
								mui.openWindow({
									url: "company_regist_result.html"});
							}else{
								mui.fire(dpage, "ppreload");
							}*/
						
						}else if (infs.ret === 2) {
							$.dialog({content: infs.msg, ok: okJs, modal:true,okCallback: toLogin});
						}else if (infs.ret == 1) {
							$.dialog({content: infs.msg, ok: okJs, modal:true});
						}
					},
					error: function(xhr, type, cause) {
						nextBtn.addEventListener('click',submitInfo,false);
						plus.nativeUI.closeWaiting();
						console.error(JSON.stringify(xhr));
						ajaxerror(xhr, type, cause);
					}
				});
			} catch (e) {
				nextBtn.addEventListener('click',submitInfo,false);
				plus.nativeUI.closeWaiting();
				console.error(e.message);
			}
 		}
 	}
 	
 	function docheck(){
 		var message="";
 		if ($("#isca").val() == 1 && $("#appid").val() == -1) {
 			message = choosePlatform;
 			return message;
 		}
 		if(role=='B'){
 			if ($.trim($("#cname").val()) === ""){
				message=cnameJs;
				return message;
			}
 			if ($.trim($("#buzno").val()) === ""){
				message=buznoJs;
				return message;
			}
 			if ($.trim($("#idbphoto").val()) === ""){
				message=idphotoJS;
				return message;
			}
 			if ($.trim($("#canme").val()) === ""){
				message=canameJs;
				return message;
			}
 			if ($.trim($("#cainum").val()) === ""){
				message=cainumJs;
				return message;
			}
 			if ($.trim($("#contact").val()) === ""){
				message=contactJS;
				return message;
			}
 		}
 		if ($.trim($("#name").val()) === ""){
			message=nameJS;
			return message;
		}if ($.trim($("#idnumber").val()) === ""){
			message=idnumberJs;
			return message;
		}if ($.trim($("#idmphoto").val()) === ""){
			message=idmphotoJs;
			return message;
		}if ($.trim($("#region").val()) === ""){
			message=regionJs;
			return message;
		}if ($.trim($("#address").val()) === ""){
			message=addressJs;
			return message;
		}
		return message;
 	}
 	function infoinit(){
 		var durl = upre + "/app/memb/member!membInfo.action";
		try {
			mui.ajax(durl, {
				type: "post",
				dataType: "html",
				success: function(infs) {
					var infs=$(infs);
					$("#regist").empty();
					$("#regist").append(infs);
					nextBtn.addEventListener('click',submitInfo,false);
					var cbtn = mui("#camera")[0],
					gbtn = mui("#gallery")[0];
					cbtn.addEventListener('click', camera, false);
					gbtn.addEventListener('click', gallery, false);
					if(role=='B'){
						mui("#bphoto")[0].addEventListener('click',pictruectrl,false);
					}
					mui("#mphoto")[0].addEventListener('click',pictruectrl,false);
				},
				error:function(xhr, type, cause){
					ajaxerror(xhr, type, cause);
				}
			});
		} catch (e) {
			console.error(e.message);
		}
	}
 	
 	var sid;
	//弹出底部按钮
	function pictruectrl() {
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
		pictruectrl();
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
		pictruectrl();
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
			uploadlogo(file, sid);
		}

		function uploadlogo(file,sid) {
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
							mui.toast(uploadSucc);
							$("#id"+sid).val(infs.msg);
							//imgs[sid] = infs.msg;
						}else if (infs.ret === 1) {
							//alert("图片上传失败");
							$.dialog({content: uploadEr, ok: okJs,modal:true});
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
	function showerr(err){
		$.dialog({content: err, ok: okJs,modal:true});
		//$('#herror')[0].innerText=err;
	}
	
}

mui.init({
	// @since liujun 2018-02-03
	// 注册之后，在信息完善页面,点击返回直接返回到首页，不需要再返回到注册页面
	beforeback: function(){
		var dpage = plus.webview.getWebviewById("index.html");
		if(dpage==null){
			mui.openWindow({url: "index.html"});
		}else{
			mui.fire(dpage, "ppreload");
		}
		return false;
	}
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});
