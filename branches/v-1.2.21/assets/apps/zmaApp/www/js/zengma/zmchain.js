var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	dpage = null,
	durl = 'zmdetail.html';

// extras parameter
var aid, zmid, openid, appType, write;

// write code parameter
var address, lockName;

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var selPlatformJs, connectUkeyJs, okJs,platformJs, cBaseZcodeJs, verifysignJs, 
	loadingJs, onContentJs, showCodeJs, hideCodeJs, startTimeJs, 
	endTimeJs, waitingJs, zmCreateTimeJs, zmNameJs, zmTitleJs, 
	zmCodeJs, contentdownJs;
i18n.readyI18n(function(){
	$("#zmchainText").html($.i18n.prop("zmchain_titleText"));
	$("#createText").html($.i18n.prop("zmchain_createText"));
	selPlatformJs = $.i18n.prop("zmchain_showWait_selPlatformInfo");
	connectUkeyJs = $.i18n.prop("zmdetail_showWait_connectUkey");
	platformJs = $.i18n.prop("zmdetail_showWait_platformInfo");
	cBaseZcodeJs = $.i18n.prop("zmdetail_showWait_cBaseZcode");
	okJs = $.i18n.prop("tan_ok");
	verifysignJs = $.i18n.prop("zmdetail_showWait_verifysign");
	loadingJs = $.i18n.prop("zmdetail_pullRefresh_loading");
	onContentJs = $.i18n.prop("zmdetail_pullRefresh_noContent");
	showCodeJs = $.i18n.prop("zmdetail_showCodeText");
	hideCodeJs = $.i18n.prop("zmdetail_hideCodeText");
	startTimeJs = $.i18n.prop("zmdetail_content_startTimeEr");
	endTimeJs = $.i18n.prop("zmdetail_content_endTimeEr");
	contentdownJs = $.i18n.prop("zmdetail_pullRefresh_contentdown");
	waitingJs = $.i18n.prop("zmdetail_showWait_waiting");
	zmCreateTimeJs = $.i18n.prop("zmdetail_zmcode_createTime");
	zmNameJs = $.i18n.prop("zmdetail_zmcode_name");
	zmTitleJs = $.i18n.prop("zmdetail_zmcode_title");
	zmCodeJs = $.i18n.prop("zmdetail_zmcode_zmCode");
});
//------------------ end --------------------
	
function plusReady(){
	var webv = plus.webview.currentWebview(),
		curl = upre + "/app/memb/membca!zmchainlist.action",
		eurl = upre + "/app/memb/mpge_zcode!selevidenceChain.action";
	
	aid  = webv.appid;
	zmid = webv.zmid;
	write= webv.write || "N";
	openid = webv.openid;
	appType = webv.appType;
	// write code
	address = webv.address;
	lockName= webv.lockName;
	console.log("appid is "+ aid+", zmid is "+zmid);
	window.addEventListener('ppreload', webinit ,false);
	mui.currentWebview.addEventListener("close", closeHandler, false);
	window.ajaxerror   = Access.newAjaxErrorHandler({
		extras: {redirect: "zmchain.html"}
	});
	
	function closeHandler() {
		var service = lockService, w = window;
		console.log("closing");
		
		if (service) {
			lockService = null;
			service.close();
		}
		return true;
	}
	
 	function webinit(e){
 		console.log("zmchain webinit");
 		var detail = e.detail; // 带参数的话通过detail获取
 		if (detail.appid != undefined) {
 			aid = detail.appid;
 		}
 		if (detail.zmid != undefined) {
 			zmid = detail.zmid;
 		}
 		if (detail.openid != undefined) {
 			openid = detail.openid;
 		}
 		if (detail.appType != undefined) {
 			appType = detail.appType;
 		}
 		if (detail.write != undefined) {
 			write= detail.write;
 		}
 		if (detail.address != undefined) {
 			address = detail.address;
 		}
 		if (detail.lockName != undefined) {
 			lockName = detail.lockName;
 		}
 		infoinit();
 		webv.show("slide-in-right");
	}
 	infoinit();
	function infoinit(){
		console.log("zmchain open id is "+ openid);
		webv.show("slide-in-right");
		plus.nativeUI.showWaiting(selPlatformJs);
		// 根据应用的类型来分辨，需要查询的是证据链还是甄码链
		console.log("appType is " + appType);
		if (appType == undefined || appType == 'Y') {
			$("#create").hide();
			$("#moduleBar").show();
			selZcodeChain();
		} else {
			evidenceChain();
		}
	}
	
	function selZcodeChain(){
		console.log("selZcodeChain()");
		mui.ajax(curl, {
			type:"GET",
			dataType:"html",
			data:{
				applicationId: aid,
				zmId : zmid
			},
			success:function(infs){
				plus.nativeUI.closeWaiting();
				var zcpdeInfo = $("#zcodeInfo");
				zcpdeInfo.empty();
				zcpdeInfo.html(infs);
				
			},
			error: function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	function evidenceChain() {
		console.log("evidenceChain()");
		mui.ajax(eurl, {
			type: "GET",
			data: "html",
			data: {
				zcodeId: zmid,
				appid: aid,
				write: write
			},
			success: function(infs) {
				plus.nativeUI.closeWaiting();
				console.log(infs);
				if (write == 'N') {
					$("#moduleBar").hide();
					$("#create").show();
					$("#create")[0].addEventListener("tap", createZcode, false);
				}
				var zcpdeInfo = $("#zcodeInfo");
				zcpdeInfo.empty();
				zcpdeInfo.html(infs);
				
			},
			error: function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		})
	}
	
	function createZcode(){
		console.log("zmdetail --> createZcode: Params:[baseZcode: " + code + 
				"，rootId: " + rootId + "，aid: " + aid + "，zmid: " + zmid + "]");
		mui.openWindow({url: "zcode_create.html",extras: {
			zcode: code, appid: aid, rootId: rootId, zmid: zmid, createBaseCode: 'N'
		}});
	}
	
}

//整体滑动暂不支持android手机，因为两个页面的移动动画，无法保证同步性；
mui.init({
	beforeback: function(){
		var openerid = plus.webview.currentWebview().opener().id;
		console.log("before back open id is " + openerid);
		if ("scan_zcode.html" == openerid) {
			mui.fire(plus.webview.currentWebview().opener(), "ppreload");
			return true;
		}
	}
});
mui.plusReady(function(){
	plusReady();
	conf.uiInit();
});

//--------------写甄码到锁中的操作  2018.09.13 尚未测试--------------------
//lockService: 用于甄码锁访问（开关锁、读写码等）
var lockService = null, blelock, xmlData, lockStatus;

//检查蓝牙是否连接
function checkCnxn() {
	var service = lockService;
	if (service == null || !service.open) {
		$.dialog({
			content : "操作时间过长，蓝牙断开，请重新操作",
			ok : okJs
		})
		return true;
	}
	return false;
}

function writeCode(wCode) {
	console.log("writeCode() start : code=" + wCode + ", address=" + address);
	if (!address) {
		showMsg("甄码锁MAC地址错误");
		return;
	}
	
	// 开始连接甄码锁 @since liujun 2018-09-13
	plus.blelock.connect({
		request : {
			address: address
		},
		timeout : 0,
		success : function(result) {
			console.log("connect success : result=" + JSON.stringify(result));
			lockService = result.lockService;
			handshake(); // 连接成功进行握手操作
		},
		error : function(result) {
			console.log("connect error: result=" + JSON.stringify(result));
			plus.nativeUI.closeWaiting();
			showMsg(result.message);
		}
	});
	
	// 握手操作
	function handshake() {
		console.log("handshake() start");
		var consts = plus.blelock.consts;
		if (checkCnxn()) {
			console.log("lockService is not exist");
			return;
		}
		lockService.handshake({
			success : success,
			error : error,
			request : 0x01
		// 0x01 加密
		});

		function success(result) {
			// 使用Ukey确认身份，服务器验签。
			plus.nativeUI.closeWaiting();
			// 判断甄码是否一样 @since liujun 2018-09-25
			if (result.zcode == wCode) {
				showMsg("该甄码已经写入到甄码锁中");
				return;
			}
			checkUser(result);
		}
		function error(result) {
			console.log("handshake is error: result=" + JSON.stringify(result));
			plus.nativeUI.closeWaiting();
			showMsg(result.message);
		}
	}
	
	// 验证用户身份{appid}
	function checkUser(result) {
		var churl = upre + "/app/memb/zcode_lock!queryUkeyTerminal.action";
		plus.nativeUI.showWaiting("正在获取数据");
		mui.ajax(churl, {
			data: {
				appid : aid,
				newZcode : wCode,
				zcode : result.zcode,
				seed : result.seed,
				address : address
			},
			dataType : "json",
			type : "GET",
			success : function(res) {
				console.log("checkUser() result = " + JSON.stringify(res));
				plus.nativeUI.closeWaiting();
				if (res.ret === 0) { // 成功
					connectKey(res.terminal, result);
					xmlData = res.xml;
					return;
				}
				saveLog(0x01, "写码失败（验证身份）：" + res.msg);
				showMsg(res.msg);
			},
			error : function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	// 通过终端序列号来连接Ukey
	function connectKey(cn, result) {
		plus.nativeUI.showWaiting(connectUkeyJs);
		plus.mgca.connect(cn, function(rep) {
			plus.nativeUI.closeWaiting();
			if (rep.result == 0) {
				signUp(result);
				return;
			}
			showMsg(rep.message);
			saveLog(0x01, "写码失败（连接UKey时）：" + rep.message);
		}, function(err) {
			plus.nativeUI.closeWaiting();
			showMsg(err.message);
			saveLog(0x01, "写码失败（连接UKey时）：" + err.message);
			return;
		});
	}
	
	function signUp(result) {
		console.log("xmlData is" + xmlData);
		plus.mgca.sign(xmlData, function(nrep) {
			var mes = nrep.message;
			if (nrep.result == 0) {
				verifysign(mes, result);
				return;
			}
			showMsg(nrep.message);
			saveLog(0x01, "写码失败（UKey签名时）：" + nrep.message);
		}, function(err) {
			showMsg(err.message);
			saveLog(0x01, "写码失败（UKey签名时）：" + err.message);
			return;
		});
	}
	
	function verifysign(mes, result) {
		plus.nativeUI.showWaiting("正在验证签名数据");
		var veurl = upre + "/app/memb/zcode_lock!verifySign.action";
		var consts = plus.blelock.consts;
		var encrypted = false;

		if ((consts.STATUS_ENCRYPTED.code & result.status) != 0) {
			encrypted = true;
		}
		if ((consts.STATUS_REUSABLE.code & result.status) != 0) {
			// a.锁可重用状态:
			lockStatus = 'N';
		} else if ((consts.STATUS_AUTHORIZED.code & result.status) != 0) {
			// b.锁授权状态:{seed,}
			lockStatus = 'Y';
		}
		mui.ajax(veurl, {
			type : "POST",
			dataType : "json",
			data : {
				xmlInfo : xmlData,
				bizdatasign : mes,
				appid : aid,
				zcode : result.zcode,
				newZcode : wCode,
				lockStatus : lockStatus,
				address : address,
				seed : result.seed
			},
			success : function(res) {
				// UKey验签成功。
				console.log("verifysign(): success result = "
						+ JSON.stringify(res));
				plus.nativeUI.closeWaiting();
				if (res.ret === 0) {
					// 检查是否可以签名
					var zcodew = {
						"plainLength" : res.plainLength,
						"packetBody" : res.packetBody
					};
					zcodew.encrypted = encrypted;
					wzcode(zcodew, mes, result.zcode);
					return;
				}
				// UKey验签失败。
				showMsg(res.msg);
				saveLog(0x01, "写码失败：" + res.msg);
			},
			error : function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		})
	}
	
	function wzcode(zcode, mes, oldZcode) {
		if (checkCnxn()) {
			return;
		}
		// 开始写码
		lockService.wzcode({
			success : success,
			error : error,
			zcode : zcode
		});

		function success(result) {
			console.log("写码结果：" + JSON.stringify(result));
			plus.nativeUI.closeWaiting();
			saveLog(0x01, "写码成功", mes);
			updateStatus(oldZcode);
			$.dialog({
				content : "写码成功",
				ok : okJs,
				okCallback : openLockDetail
			})

			function openLockDetail() {
				if (lockService) {
					console.log("openLockDetail lockService close");
					lockService.close();
					lockService = null;
				}
				console.log("openLockDetail() lockName=" + lockName
						+ ",address=" + address + ",code=" + code);
				var page = plus.webview.getWebviewById("lock_detail.html");
				if (page == null) {
					mui.openWindow({
						url : "lock_detail.html",
						extras : {
							"name" : lockName,
							"address" : address,
							"code" : code
						}
					});
				} else {
					mui.fire(page, "ppreload", {
						"name" : lockName,
						"address" : address,
						"code" : code
					});
				}
			}
		}

		function error(result) {
			plus.nativeUI.closeWaiting();
			showMsg(result.message);
			saveLog(0x01, "写码失败：" + result.message);
		}
	}
	// 保存日志
	function saveLog(type, content, dataSign) {
		if (!dataSign) {
			dataSign = "";
		}
		if (!xmlData) {
			xmlData = "";
		}
		console.log("saveLog(): type = " + type + ",content=" + content
				+ ",address=" + address);
		var saveUrl = upre + "/app/memb/zcode_lock!saveOpLog.action";
		mui.ajax(saveUrl, {
			type : "POST",
			dataType : "json",
			data : {
				type : type,
				content : content,
				address : address,
				datasign : dataSign,
				plaindata : xmlData
			},
			success : function(e) {
				console.log("save log data:" + JSON.stringify(e));
			},
			error : function(xhr, type, cause) {
				console.log("xhr = " + xhr + ",type = " + type + ",cause = "
						+ cause);
			}
		});
	}

	// 修改锁的状态
	function updateStatus(zcode) {
		console.log("newZcode = " + wCode + ", lockStatus=" + lockStatus
				+ ",address = " + address + ",zcode=" + zcode);
		var updateUrl = upre + "/app/memb/zcode_lock!updateZclockStatus.action";
		mui.ajax(updateUrl, {
			type : "POST",
			dataType : "json",
			data : {
				newZcode : wCode,
				lockStatus : lockStatus,
				address : address,
				zcode : zcode
			},
			success : function(res) {
				console.log("update lock status:" + JSON.stringify(res));
			},
			error : function(xhr, type, cause) {
				console.log("xhr=" + xhr + ",type=" + type + ",cause="
						+ cause);
			}
		});
	}
	
}

//弹框
function showMsg(msg) {
	console.log("弹框：" + msg);
	$.dialog({
		content : msg,
		ok : okJs
	});
}
