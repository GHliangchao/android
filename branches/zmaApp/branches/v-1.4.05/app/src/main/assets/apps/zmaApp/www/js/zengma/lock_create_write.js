var vm = new Vue({
	el: "#content",
	data: {
		lockName: "",
		lockAddr: "",
		zmaCode: "",
		appid: "",
		signTitle: "",
		summary: "",
		address: "",
		latitude: "",
		longitude: "",
		coordsType: "gcj02",
		signTitileTxt: "",
		businessTitleTxt: "",
		addressTxt: "",
		submitTxt: "",
		showErrorMsg: false,
		errorMsg:""
	},
	methods:{
		submitInfo: function(){
			if(vm.signTitle == ""){
				showErMsg(signTitleEr);
				return;
			}
			if(vm.summary == ""){
				showErMsg(businessTitltEr);
				return;
			}
			/*if(vm.address == ""){
				showErMsg(addressEr);
				return;
			}*/
			cleanErInfo();
			
			// generate and write code
			generateAndWriteCode();
		}
	}
});

// i18n国际化资源 @since liujun 2019-07-01
//------------------start--------------------
var signTitleEr, businessTitltEr, addressEr, tanOkText, tancancelTxt,
	pullDownInfoText, noBaseZcodeText, operateTimeoutText, writeSuccess,
	macAddressError, zcodeExistText, getDataText, verifysignText,
	ukeyLoadingTxt, ukeyverifysignText;
i18n.readyI18n(function(){
	$("#titleText").html($.i18n.prop("lock_create_write_titleTxt"));
	vm.signTitileTxt = $.i18n.prop("lock_create_write_signTitleTxt");
	vm.businessTitleTxt = $.i18n.prop("lock_create_write_businessTitleTxt");
	vm.addressTxt = $.i18n.prop("lock_create_write_addressTxt");
	vm.submitTxt = $.i18n.prop("lock_create_write_submitTxt");
	 
	// js error
	signTitleEr = $.i18n.prop("lock_create_write_popup_signTitleEr"); 
	businessTitltEr = $.i18n.prop("lock_create_write_popup_businessTitltEr"); 
	addressEr = $.i18n.prop("lock_create_write_popup_addressEr"); 
	
	
	tanOkText = $.i18n.prop("tan_ok");
	tancancelTxt = $.i18n.prop("tan_cancel");
	ukeyLoadingTxt = $.i18n.prop("public_ukey_connect_prompt");
	ukeyverifysignText = $.i18n.prop("public_ukey_verifysignText");
	
	// 正在加载中...
	pullDownInfoText = $.i18n.prop("public_pull_down_infoText");
	// 该应用还没有基础甄码
	noBaseZcodeText = $.i18n.prop("zmdetail_js_noBaseZcode");
	// 操作时间过长，蓝牙断开，请重新操作
	operateTimeoutText = $.i18n.prop("zmdetail_js_operate_timeout");
	//甄码锁MAC地址错误
	macAddressError = $.i18n.prop("zmdetail_js_macAddress_error");
	// 该甄码已经写入到甄码锁中
	zcodeExistText = $.i18n.prop("zmdetail_js_zcode_exist");
	// 正在获取数据
	getDataText = $.i18n.prop("zmdetail_js_getData");
	// 正在验证签名数据
	verifysignText = $.i18n.prop("zmdetail_js_verifysignText");
	// 写码成功
	writeSuccess = $.i18n.prop("zmdetail_js_write_success");
});
//------------------end--------------------


var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	vm.lockName = curr.lockName;
	vm.lockAddr = curr.lockAddr;
	vm.zmaCode  = curr.zmaCode || "";
	vm.appid = curr.appid || "";
	
	window.addEventListener('ppreload', webinit, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect : "/lock_write_code.html"}
	});
	initPage();
	
	function webinit(e){
		var detail = e.detail;
		if(detail){
			vm.lockName = detail.lockName;
			vm.lockAddr = detail.lockAddr;
			vm.zmaCode  = detail.zmaCode || "";
			vm.appid = detail.appid || "";
		}
		initPage();
	}
	
	function initPage(){
		if(conf.debug){
			console.log("lockName is " + vm.lockName + "， lockAddress is " + vm.lockAddr);
			console.log("zmaCode is " + vm.zmaCode + "， appid is " + vm.appid);
		}
		cleanInfo();
		getSystemAddrInfo();
		curr.show("slide-in-right");
	}
}

function getSystemAddrInfo(){
	plus.geolocation.getCurrentPosition(successCB, errorCB, {
		provider:'baidu',
		enableHighAccuracy:true,
		coordsType: vm.coordsType
	});
	
	function successCB(e){
		if(conf.debug){
			console.log("获取系统的地址信息："+JSON.stringify(e));
			console.log('Geolocation\nLatitude:' + e.coords.latitude + '\nLongitude:' + e.coords.longitude + '\nAltitude:' + e.coords.altitude);
		}
		var coords = e.coords;
		var addresses = e.address;
		vm.latitude = coords.latitude;
		vm.longitude= coords.longitude;
		vm.address  = addresses.country + addresses.province + addresses.city + addresses.district;
	}
	
	function errorCB(e) {
		showErMsg(e.message);
	}
}

function cleanInfo(){
	vm.signTitle = "";
	vm.summary = "";
	vm.address = "";
	
	cleanErInfo();
}

function cleanErInfo(){
	vm.showErrorMsg = false;
	vm.errorMsg = "";
}

function showErMsg(msg){
	vm.showErrorMsg = true;
	vm.errorMsg = msg;
}

mui.init();
mui.plusReady(function(){
	plusReady();
});

//弹框
function showMsg(msg) {
	$.dialog({
		content : msg,
		ok : tanOkText
	});
}

// ------- 创建甄码并将甄码写入到甄码锁中去 ----------
// lockServeice:  用于甄码锁访问（开关锁、读写码等）
var lockService = null;
var termainal, xmlData, newCode;

// 检查蓝牙是否连接
function checkCnxn() {
	var service = lockService;
	if (service == null || !service.open) {
		showMsg(operateTimeoutText);
		return true;
	}
	return false;
}

function generateAndWriteCode(){
	if (vm.lockAddr == "") {
		showMsg(macAddressError);
		return;
	}
	
	plus.nativeUI.showWaiting("");
	
	// step 1: 开始连接甄码锁
	plus.blelock.connect({
		request: {
			address: vm.lockAddr
		},
		timeout: 0,
		success: function(result) {
			if(conf.debug){console.log("connect success : result=" + JSON.stringify(result));}
			lockService = result.lockService;
			handshake(); // 连接成功进行握手操作
		},
		error: function(result) {
			if(conf.debug){console.log("connect error: result=" + JSON.stringify(result));}
			plus.nativeUI.closeWaiting();
			showMsg(result.message);
		}
	});
	
	// step 2: 握手操作
	function handshake() {
		if(conf.debug){console.log("handshake() start");}
		var consts = plus.blelock.consts;
		if (checkCnxn()) {
			console.log("lockService is not exist");
			return;
		}
		lockService.handshake({
			success: success,
			error: error,
			request: 0x01 // 0x01 加密
		});
		
		function success(result) {
			if(conf.debug){console.log("handshake success: " + JSON.stringify(result));}
			plus.nativeUI.closeWaiting();
			generateSign(result);
		}
		
		function error(result) {
			if(conf.debug){console.log("handshake is error: result=" + JSON.stringify(result));}
			plus.nativeUI.closeWaiting();
			showMsg(result.message);
		}
	}
	
	// step 3: 预签名生成甄码
	function generateSign(result){
		if(conf.debug){console.log("generateSign() start -->");}
		var url = upre + "/app/memb/about_lock!prepareZcode.action";
		plus.nativeUI.showWaiting("正在执行预签名操作");
		mui.ajax(url, {
			data: {
				appid: vm.appid,
				zcode: vm.zmaCode,
				signTitle: vm.signTitle,
				summary: vm.summary,
				address: vm.address,
				longitude: vm.longitude,
				latitude: vm.latitude
			},
			dataType: "json",
			type: "POST",
			success: function(res) {
				console.log("checkUser() result = " + JSON.stringify(res));
				plus.nativeUI.closeWaiting();
				if (res.ret === 0) { // 成功
					termainal = res.terminal;
					xmlData = res.xml;
					newCode = res.code;
					connectKey(result);
					return;
				}
				saveLog(0x01, "写码失败（验证身份）：" + res.msg);
				showMsg(res.msg);
			},
			error: function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	// step 4: 通过终端序列号来连接Ukey
	function connectKey(result) {
		plus.nativeUI.showWaiting(ukeyLoadingTxt);
		plus.mgca.connect(termainal, function(rep) {
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
	
	// step 5: 使用Ukey签名
	function signUp(result) {
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
	
	// step 6: 验证签名操作
	function verifysign(bizdatasign, result){
		plus.nativeUI.showWaiting(verifysignText);
		
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
		
		var url = upre + "/app/memb/about_lock!verifySign.action";
		mui.ajax(url, {
			type: "POST",
			dataType: "json",
			data:{
				seed: result.seed,
				appid: vm.appid,
				zcode: newCode,
				bizdatasign: bizdatasign,
				summary: vm.summary,
				signTitle: vm.signTitle,
				oldZcode: result.zcode,
				status: lockStatus,
				address: vm.lockAddr
			},
			success : function(res) {
				// UKey验签成功。
				if(conf.debug){console.log("verifysign(): success result = " + JSON.stringify(res));}
				plus.nativeUI.closeWaiting();
				if (res.ret === 0) {
					// 检查是否可以签名
					var zcodew = {
						"plainLength" : res.plainLength,
						"packetBody" : res.packetBody
					};
					zcodew.encrypted = encrypted;
					wzcode(zcodew, bizdatasign, result.zcode);
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
		});
	}
	
	// step 7. 将生成的甄码写入到甄码锁中
	function wzcode(zcode, mes, oldZcode){
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
			if(conf.debug){console.log("写码结果：" + JSON.stringify(result));}
			plus.nativeUI.closeWaiting();
			saveLog(0x01, "写码成功", mes);
			updateStatus(oldZcode);
			$.dialog({
				content : writeSuccess,
				ok : tanOkText,
				okCallback : openLockDetail
			})

			function openLockDetail() {
				if (lockService) {
					console.log("openLockDetail lockService close");
					lockService.close();
					lockService = null;
				}
				console.log("openLockDetail() lockName=" + vm.lockName
						+ ",address=" + vm.lockAddr + ",code=" + zcode);
				var page = plus.webview.getWebviewById("/lock_detail.html");
				if (page == null) {
					mui.preload({
						url : "/lock_detail.html",
						extras : {
							"name" : vm.lockName,
							"address" : vm.lockAddr,
							"code" : newCode
						}
					});
				} else {
					mui.fire(page, "ppreload", {
						"name" : vm.lockName,
						"address" : vm.lockAddr,
						"code" : newCode
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

	// step 8. 修改锁的状态
	function updateStatus(zcode) {
		if(conf.debug){console.log("newZcode = " + newCode + ", lockStatus=" + lockStatus + ",address = " + vm.lockAddr + ",zcode=" + zcode);}
		var updateUrl = upre + "/app/memb/zcode_lock!updateZclockStatus.action";
		mui.ajax(updateUrl, {
			type: "POST",
			dataType: "json",
			data: {
				newZcode: newCode,
				lockStatus: lockStatus,
				address: vm.lockAddr,
				zcode: zcode
			},
			success : function(res) {
				if(conf.debug){console.log("update lock status:" + JSON.stringify(res));}
			},
			error : function(xhr, type, cause) {
				if(conf.debug){console.log("xhr=" + xhr + ",type=" + type + ",cause=" + cause);}
			}
		});
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
	if(conf.debug){console.log("saveLog(): type = " + type + ",content=" + content + ",address=" + vm.lockAddr);}
	var saveUrl = upre + "/app/memb/zcode_lock!saveOpLog.action";
	mui.ajax(saveUrl, {
		type : "POST",
		dataType : "json",
		data : {
			type : type,
			content : content,
			address : vm.lockAddr,
			datasign : dataSign,
			plaindata : xmlData,
			lng: vm.longitude,
			lat: vm.latitude,
			operateAddr: vm.address,
			coordsType: vm.coordsType,
			zcode: newCode
		},
		success : function(e) {
			if(conf.debug){console.log("save log data:" + JSON.stringify(e));}
		},
		error : function(xhr, type, cause) {
			if(conf.debug){console.log("xhr = " + xhr + ",type = " + type + ",cause = " + cause);}
		}
	});
}
