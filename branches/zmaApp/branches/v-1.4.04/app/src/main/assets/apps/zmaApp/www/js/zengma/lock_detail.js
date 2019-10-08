var vm = new Vue({
    el:"#content",
    data:{
        mclCodeTxt: "",
        macAddressTxt: "",
        lockNameTxt: "",
        versionInfoTxt: "",
        lockStatusTxt: "",
        readNFCTxt: "",
        writeNFCTxt: "",
        readMCLCodeTxt:"",
        closeLockTxt: "",
        reportingLocationTxt: "",
        writeMCLCodeTxt:"",
        openLockTxt:"",
        resetLockTxt:"",
        updatePwdTxt: "",
        upgradeTxt: ""
    },
    methods: {

    }
});

// 国际化资源 @since liujun 2019-06-27
// ---------------------start-----------------------------
var loadingTxt, tanOkText, getLocationErr, lockMCLCodeisNull,
    zmaDateTime, zmaCaName, zmaCertNo, zmaUserName, zmaTitle,
    zmaLockAddressErr, zmaConnectEr, zmaLockVersion, zmaProtocol,
    zmaBatteryLevel,zmalockReusable, ukeyLoadingTxt, ukeyverifysignText,
    zmaResetSucc, popupLoadingTxt, opLockErByLockReusable,
    openLockSucc, closeLockTips, closeLockSucc, zmaModifyPwdTips,
    zmaModifyPwdSucc, selectUkeyTips, zmaUpgradeSuccess;
i18n.readyI18n(function(){
    // -------------  界面显示内容 start ----------------------------
	$("#titleText").html($.i18n.prop("lock_detail_titleText"));
    vm.mclCodeTxt = $.i18n.prop("lock_detail_mclCode");
    vm.macAddressTxt = $.i18n.prop("lock_detail_macAddressTxt");
    vm.lockNameTxt = $.i18n.prop("lock_detail_lockNameTxt");
    vm.versionInfoTxt = $.i18n.prop("lock_detail_versionInfoTxt");
    vm.lockStatusTxt = $.i18n.prop("lock_detail_lockStatusTxt");
    vm.readNFCTxt = $.i18n.prop("lock_detail_readNFCTxt");
    vm.writeNFCTxt= $.i18n.prop("lock_detail_writeNFCTxt");
    vm.readMCLCodeTxt = $.i18n.prop("lock_detail_readMCLCodeTxt");
    vm.closeLockTxt = $.i18n.prop("lock_detail_closeLockTxt");
    vm.reportingLocationTxt = $.i18n.prop("lock_detail_reportingLocationTxt");
    vm.writeMCLCodeTxt = $.i18n.prop("lock_detail_writeMCLCodeTxt");
    vm.openLockTxt = $.i18n.prop("lock_detail_openLockTxt");
    vm.resetLockTxt = $.i18n.prop("lock_detail_resetLockTxt");
    vm.updatePwdTxt = $.i18n.prop("lock_detail_updatePwdTxt");
    vm.upgradeTxt = $.i18n.prop("lock_detail_upgradeTxt");
    // -------------  界面显示内容 end ----------------------------

    popupLoadingTxt = $.i18n.prop("public_loading_getData");
	loadingTxt = $.i18n.prop("public_loading_infoTxt");
	tanOkText = $.i18n.prop("tan_ok");
	getLocationErr = $.i18n.prop("lock_detail_popup_nolocation");
	lockMCLCodeisNull = $.i18n.prop("lock_detail_popup_zmaisNull");
	zmaDateTime = $.i18n.prop("lock_detail_popup_zmaTime");
	zmaCaName = $.i18n.prop("lock_detail_popup_caName");
	zmaCertNo = $.i18n.prop("lock_detail_popup_cacertSno");
	zmaUserName = $.i18n.prop("lock_detail_popup_zmaUserName");
	zmaTitle = $.i18n.prop("lock_detail_popup_zmaTitle");
	zmaLockAddressErr = $.i18n.prop("lock_detail_popup_lockAddressEr");
	zmaConnectEr = $.i18n.prop("lock_detail_popup_connectErr");
	zmaLockVersion = $.i18n.prop("lock_detail_popup_lockVersion");
	zmaProtocol = $.i18n.prop("lock_detail_popup_ProtocolVersion");
	zmaBatteryLevel = $.i18n.prop("lock_detail_popup_batteryLevel");
	zmalockReusable = $.i18n.prop("lock_detail_popup_lockReusable");
	zmaResetSucc = $.i18n.prop("lock_detail_popup_resetSucc");
	opLockErByLockReusable = $.i18n.prop("lock_detail_popup_lockReusable_OpLockEr");
	openLockSucc = $.i18n.prop("lock_detail_popup_openLockSucc");
	closeLockTips = $.i18n.prop("lock_detail_popup_closeLockTips");
	closeLockSucc = $.i18n.prop("lock_detail_popup_closeLockSucc");
	zmaModifyPwdTips = $.i18n.prop("lock_detail_popup_modifyPwdTips");
	zmaModifyPwdSucc = $.i18n.prop("lock_detail_popup_modifyPwdSucc");
	selectUkeyTips = $.i18n.prop("lock_detail_popup_selectUkeyTips");
	zmaUpgradeSuccess = $.i18n.prop("lock_detail_popup_upgradeSuccess");

	ukeyLoadingTxt = $.i18n.prop("public_ukey_connect_prompt");
	ukeyverifysignText = $.i18n.prop("public_ukey_verifysignText");
});
// --------------------- end -----------------------------

var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	lockService = null,
	zclockId, address, name, lockType;

function plusReady(){
	var webv = plus.webview.currentWebview(),
		code = webv.code,
		blelock = plus.blelock,
		consts = blelock.consts,
		readBtn = $("#read"),
		closeBtn = $("#close"),
		uploadBtn = $("#upload"),
		writeBtn = $("#write"),
		openBtn = $("#open"),
		resetBtn = $("#reset"),
		modifyBtn = $("#modify"),
		upgradeBtn = $("#upgrade"),
		readNFCBtn = $("#readNFC"),
		writeNFCBtn = $("#writeNFC"),
		initUrl = upre + "/app/memb/zcode_lock!initInfo.action",
		selCodeUrl = upre + "/app/memb/zcode_lock!writeByZcode.action",
		readUrl = upre + "/app/memb/zcode_lock!readLog.action",
		resetUrl = upre + "/app/memb/zcode_lock!resetLock.action";
		address = webv.address, name = webv.name;
		
	window.addEventListener("ppreload", webinit, false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "lock_detail.html"}
	});
	// @since liujun 2018-03-19 关闭页面的时候，断开与锁之间的连接
	mui.currentWebview.addEventListener("close", closeHandler, false);
	function closeHandler(){
		var service = lockService, w = window;
		console.log("closing");
		
		if(w.stabilityTest != null){
			w.stabilityTest.stop(null, "", true);
			w.stabilityTest = null;
			console.log("close stability test");
		}
		
		if(service){
			lockService = null;
			service.close();
		}
		return true;
	}
	
	readBtn.click(readZcode);
	uploadBtn.click(locate);
	resetBtn.click(reset);
	modifyBtn.click(modifyKey);
	readNFCBtn.click(readNFC);
	writeNFCBtn.click(function(){
		goNFC('w');
	});
	upgradeBtn.click(switchUpgrade); 
	
	initInfo();
	function webinit(e){
		var detail = e.detail;
		if(detail){
			name = detail.name;
			address = detail.address;
			code = detail.code;
		}
		initInfo();
	}
	
	function initInfo(){
		dropPage();
		console.log("lock_detail webinit() name="+name+",address="+address+",code="+code);
	    webv.show("slide-in-right");
		$("#write")[0].addEventListener('tap', writeCode, false);
		openBtn[0].addEventListener('tap', openLock, false);
		closeBtn[0].addEventListener('tap', closeLock, false);
		$("#code").text(code);
		$("#address").text(address);
		$("#name").text(name);
		$("#read").hide();
		$("#close").hide();
		$("#upload").hide();
		$("#write").hide();
		$("#open").hide();
		$("#reset").hide();
		$("#modify").hide();
		$("#upgrade").hide();
		var verifyManger = false;
		
		plus.nativeUI.showWaiting(loadingTxt);
		mui.ajax(initUrl, {
			type: "POST",
			data: {
				"macAddress": address,
				"zcode": code
			}, 
			dataType: "json",
			success: function(res){
				if (conf.debug) {
					console.log(JSON.stringify(res));
				}
				if (res.ret === 0) {
					var msg = res.msg,
						right = msg.substring(1, msg.length - 1).split(",");
					var a;
					for(a in right){
						if (right[a] === '"M"') {
							resetBtn.show();
							modifyBtn.show();
							upgradeBtn.show();
							openBtn.show();
							verifyManger = true;
						}else if (right[a] === '"O"') {
							openBtn.show();
						}else if (right[a] === '"I"') {
							writeBtn.show();
						}
					}
					//可重用状态
					if (code === "") {
						writeBtn.show();
						openBtn.hide();
						readBtn.hide();
					} else {
						readBtn.show();
					}
					closeBtn.show();
					uploadBtn.show();
					zclockId = res.lockId;
					lockType = res.type;
					if (lockType === 'B' || lockType === 'X') {
						$("#nfc").show();
					}
					// 如果是管理员就隐藏写入甄码按钮 @since liujun 2018-04-02
					if(verifyManger){
						writeBtn.hide();
					}
				} else {
					$.dialog({
						content: res.msg,
						ok: tanOkText,
						okCallback:callBack
					});
					function callBack(){
						mui.back();
					}
				}
				plus.nativeUI.closeWaiting();
			},
			error: function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	function goNFC(opType){
		if(lockService){
			console.log("openWrite lockService close");
			lockService.close();
			lockService = null;
		}
		var page = plus.webview.getWebviewById("zcNFC.html");
		if (page == null) {
			mui.preload({
				url: "zcNFC.html",
				extras: {
					"opType": opType, address: address
				}
			});
		} else {
			mui.fire(page, "ppreload", {"opType": opType, address: address});
		}
	}
	
	/*
	 * @since liujun 2018-04-08
	 * 读NFC功能 
	 */
	function readNFC(){
		if(lockService){
			console.log("openWrite lockService close");
			lockService.close();
			lockService = null;
		}
		console.log("read NFC start");
		var options = {cardId: address, format:"txt"};
		
		// 执行读操作
		plus.blelock.nfcRead({
			success:success,
			error:error,
			options: options
		});
		
		function success(result){
		    if(conf.debug){
		        console.log("读NFC成功结果："+JSON.stringify(result));
		    }
		}
		
		function error(result){
		    if(conf.debug){
		        console.log("读NFC失败结果："+JSON.stringify(result));
		    }
			showMsg(result.message);
		}
	}
	
	function locate(){
		if (isNotConnected) {
			connectBlueTooth(doLocate);
		} else {
			doLocate();
		}
		
		function doLocate(){
			lockService.locate({
				success: success,
				error: error,
				timeout: 15/*0: default 30s */
			});
		}
		
		function success(result){
			plus.nativeUI.closeWaiting();
			// 转换坐标 @since liujun 2018-04-08
			var lng = result.lng;
			var lat = result.lat;
			if(!(lng && lat)){
				showMsg(getLocationErr);
				return;
			}
			// wgs84 --> gcj02 gcj02(高德/腾讯/Google中国使用)
			var wgs84togcj02  = coordtransform.wgs84togcj02(lng ,lat);
			lng = wgs84togcj02[0];
			lat  = wgs84togcj02[1];
			
			/* gcj02 --> bd09 （百度地图使用）
			var gcj02tobd09 = coordtransform.gcj02tobd09(lng ,lat);
			lng = gcj02tobd09[0];
			lat  = gcj02tobd09[1];*/
			
			var page = plus.webview.getWebviewById("map.html");
			if (page == null) {
				mui.preload({
					url: "map.html",
					extras: {
						"lng": lng,
						"lat": lat,
						"zclockId" : zclockId
					}
				});
			} else {
				mui.fire(page, "ppreload", {"lng": lng, "lat": lat, "zclockId": zclockId});
			}
		}
		
	}
	
	function readZcode(){
		if (isNotConnected) {
			connectBlueTooth(doReadZcode);
		} else {
			doReadZcode();
		}
		
		function doReadZcode() {
			lockService.readZcode({
				success: success,
				error: error
			});
		}
		
		function success(result){
			var message = "";
			if (result.zcode === "") {
				plus.nativeUI.closeWaiting();
				showMsg(lockMCLCodeisNull);
				return;
			}
			message += "<div style='text-align: left;'>";
			message += vm.mclCodeTxt + "：" + result.zcode + "<br/>";
			message += zmaDateTime + "：" + result.zcTimeText + "<br/>";
			message += zmaCaName + "：" + result.caName + "<br/>";
			message += zmaCertNo + "：" + result.certSn + "<br/>";
			message += zmaUserName + "：" + result.zcUsername + "<br/>";
			message += zmaTitle + "：" + result.zcTitle + "<br/>";
			message += "</div>";
			
			mui.ajax(readUrl, {
				data: {
					lockId: zclockId,
					message: message,
					zcode: result.zcode
				},
				type: "POST",
				dataType: "json",
				success: function(res){
					plus.nativeUI.closeWaiting();
					if (res.ret === 0) {
						showMsg(message);
					} else {
						showMsg(res.msg);
					}
				},
				error: function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
			
		}
		
	}
	
	function error(result){
		plus.nativeUI.closeWaiting();
		showMsg(result.message);
	}
	
	// 连接蓝牙
	function connectBlueTooth(nextDo){
		if (!address) {
			showMsg(zmaLockAddressErr);
			return;
		}
		
		if (typeof nextDo != "function") {
			console.log("nextDo is not function");
			return;
		}
		
		
		plus.blelock.connect({
			request: {
				"address": address
			},
			timeout: 0,
			success: function(result){
				lockService = result.lockService;
				nextDo();
			},
			error: function(result){
				showMsg(zmaConnectEr);
			}
		});
	}
	
	//握手
	function handshake(encrypt, op){
		lockService.handshake({
			success: success,
			error: error,
			request: encrypt
		});
		
		function success(result){
			if(conf.debug){console.log("握手返回的result:"+JSON.stringify(result));}
			 zclockInfo(result);
			// @since liujun 2018-03-17
			// 传入下一个握手后的甄码操作
			if(typeof op === "function"){
				if(conf.debug){
					console.log("进入到握手下一步");
				}
				op(result);
			}
		}
		
		function error(){
			var errno = result.result;
			if (errno > consts.ER_NONE.errno && errno < consts.ER_NOCODE.errno) {
				zclockInfo(result);
			}
			showMsg(result.message);
		}
	}
	
	function zclockInfo(result){
		var version = $("#version");
		var zcode = $("#zcode");
		
		zcode.text(result.zcode);
		version.text(zmaLockVersion + " " + result.zclockVersions + " " + zmaProtocol + " " + result.protoVersions);
		$("#state").text(result.statusText +" "+ zmaBatteryLevel +" "+ result.battery+"%");
	}
	
	function isNotConnected(){
		var service = lockService;
		if (service == null || !service.open) {
			return true;
		}
		return false;
	}
	
	// 重置流程：
	// 1. 握手 获取甄码编码、随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色         -- 测试省略
	// 注：UKEY的作用是验身，控制访问甄码密钥。
	// 3. 签名 服务器检查甄码、用户关系，使用甄码密钥签名随机串（16进制串表示） -- 测试时APP端签名
	// 4. 重置 给甄码锁发送重置指令，锁进入可重用状态。
	function reset(){
		var xmlData, seed, encrypted = false, newCode;
		if (isNotConnected) {
			connectBlueTooth(doHandshake);
		} else {
			doHandshake();
		}
		
		function doHandshake(){
			return handshake(0x00, doResetLock);
		}
		
		function doResetLock(result){
			var consts = blelock.consts;
			seed = result.seed;
			newCode = result.zcode;
			
			if ((consts.STATUS_ENCRYPTED.code & result.status) != 0) {
				encrypted = true;
			}
			if ((consts.STATUS_REUSABLE.code & result.status) != 0) {
				// a.锁处于可用状态
				showMsg(zmalockReusable);
				saveLog(0x05, "重置成功:甄码锁当前已属于可重用状态", newCode);
			} else if ((consts.STATUS_AUTHORIZED.code & result.status)){
				//b.锁处于授权状态
				queryTerminal(result);
			}
		}
		
		function queryTerminal(result){
			var queryUrl = upre + "/app/memb/zcode_lock!resetLockQueryTerminal.action";
			mui.ajax(queryUrl,{
				dataType:"json",
				type:"GET",
				data:{
					zcode:result.zcode,
					seed :result.seed,
					address:address
				},
				success:function(res){
					console.log("queryTerminal reset lock result:"+JSON.stringify(res));
					plus.nativeUI.closeWaiting();
					if(res.ret === 0){
						connectKey(res.terminal);
						xmlData = res.xml;
						return;
					}
					showMsg(res.msg);
					saveLog(0x05, "重置失败："+res.msg, newCode);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					saveLog(0x05, "重置失败", newCode);
					ajaxerror(xhr, type, cause);
				}
			});
		}
		
		function connectKey(cn){
			plus.nativeUI.showWaiting(ukeyLoadingTxt);
			plus.mgca.connect(cn,
			function(rep){
				if(rep.result==0){
					signUp();
					return;
				}
				plus.nativeUI.closeWaiting();
				showMsg(rep.message);
				saveLog(0x05,"重置失败（连接UKey）："+rep.message, newCode,"",xmlData);
			}, function(err){
				plus.nativeUI.closeWaiting();
				showMsg(err);
				saveLog(0x05,"重置失败（连接UKey）："+err, newCode, "",xmlData);
				return;
			});
		}
		
		function signUp(){
			console.log("xmlData is:"+ xmlData);
			plus.nativeUI.closeWaiting();
			plus.mgca.sign(xmlData,
				function(nrep){
					var mes=nrep.message;
					if(nrep.result==0){
						verifysign(mes);
						return;
					}
					showMsg(nrep.message);
					saveLog(0x05,"重置失败（UKey签名）："+nrep.message, newCode, "",xmlData);
				}, function(err){
					showMsg(err.message);
					saveLog(0x05,"重置失败（UKey签名）："+err.message, newCode, "",xmlData);
					return;
				}
			);
		}
		
		function verifysign(mes){
			plus.nativeUI.showWaiting(ukeyverifysignText);
			var reserUrl = upre + "/app/memb/zcode_lock!verifySignResetLock.action";
			mui.ajax(reserUrl,{
				type:"POST",
				dataType:"json",
				data:{
					xmlInfo:xmlData,
					bizdatasign:mes,
					zcode: newCode,
					seed: seed
				},
				success:function(res){
					// UKey验签成功。
					console.log("verifysign(): success result = "+JSON.stringify(res));
					plus.nativeUI.closeWaiting();
					if(res.ret === 0){
						// 检查是否可以签名
						var zcodew = {
							   "zcSign" : res.zcSign
						};
						zcodew.encrypted = encrypted;
						resetOpLock(zcodew, mes);
						return;
					}
					// UKey验签失败。
					showMsg(res.msg);
					saveLog(0x05, "重置失败（Ukey签名）："+res.msg, newCode, mes, xmlData);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					saveLog(0x05, "重置失败", newCode, mes, xmlData);
					ajaxerror(xhr, type, cause);
				}
			})
		}
		
		function resetOpLock(resetCode, mes){
			lockService.resetLock({
				success: success,
				error: error,
				zcode: resetCode
			});

			function success(result){
				plus.nativeUI.closeWaiting();
				$.dialog({content:zmaResetSucc, ok :tanOkText, okCallback:function(){
						/*code = "";
						$("#code").empty();
						return handshake(0x00);*/
						if(lockService){
							lockService.close();
							lockService = null;
						}
						var url = "/lock.html";
						var page = plus.webview.getWebviewById(url);
						if(page == ""){
							mui.preload({url: url});
						}else {
							mui.fire(page, "resetSucc");
						}
					}});
				saveLog(0x05, "重置成功", newCode, mes, xmlData);
			}

			function error(result){
				plus.nativeUI.closeWaiting();
				saveLog(0x05, result.message, newCode, mes, xmlData);
				showMsg(result.message);
			}
		}
	}
	
	/*
	 * @since liujun 2018-03-14
	 * 1.如果有甄码：就通过甄码查询是那一个APP，进入到自己的这个APP的甄码列表
	 * 2.如果没有甄码（锁可重用状态）：进入到应用选择页面，从选择APP中的甄码，写入到甄码锁中。
	 */
	function writeCode(){
		if(code){ // 有甄码存在
			selectCode(code);
		}else{ // 甄码不存在
			if(lockService){
				console.log("writeCode lockService close");
				lockService.close();
				lockService = null;
			}
			var dpage = plus.webview.getWebviewById("/app_list.html");
			// re-preload: can't preload in autoShow: false page
			if(dpage == null){
		        dpage = mui.preload({url: "/app_list.html",
		            extras:{
		               address: address,lockName: name
		            }});
		        return;
		    }else{
		        mui.fire(dpage,'ppreload',{
		            address: address,lockName: name
		        });
		    }
		}
	}
	
	function selectCode(zcode){
		plus.nativeUI.showWaiting();
		mui.ajax(selCodeUrl,{
			data:{
				zcode:zcode
			},
			dataType:"json",
			type:"GET",
			success:function(e){
				plus.nativeUI.closeWaiting();
				console.log("select code app id is "+JSON.stringify(e));
				if(e.ret === 0){
					openWrite(e.appId, e.appType, zcode);
		            return;
				}
				showMsg(e.msg);
			},
			error:function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type,cause);
			}
			
		})
	}
	
	// ------------------------写甄码完成-------------------------------------
	
	//------------------------- 开锁流程 -------------------------------------
	// 开锁流程：
	// 1. 握手 获取甄码编码、随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色         -- 测试省略
	// 注：UKEY的作用是验身，控制访问甄码密钥。
	// 3. 签名 服务器检查甄码、用户关系，使用甄码密钥签名随机串（16进制串表示） -- 测试时APP端签名
	// 4. 开锁 给甄码锁发送开锁指令
	function openLock(){
		var dataxml, newZcode;

		if (isNotConnected) {
			console.log("没有连接");
			connectBlueTooth(doOpenLock);
		} else {
			console.log("已经连接");
			doOpenLock();
		}
		
		function doOpenLock(){
			handshake(0x00,checkUser); // 握手不加密 
		}
		
		// 握手成功
		function checkUser(result){
			if(!result.zcode){
				showMsg(lockMCLCodeisNull);
				return;
			}
			newZcode = result.zcode;
			
			var churl = upre + "/app/memb/zcode_lock!queryTerminalByCode.action";
			plus.nativeUI.showWaiting(popupLoadingTxt);
			mui.ajax(churl, {
				data:{
					zcode:result.zcode,
					seed :result.seed,
					address:address
				},
				dataType:"json",
				type:"GET",
				success:function(res){
					console.log("checkUser() result = "+JSON.stringify(res));
					plus.nativeUI.closeWaiting();
					if(res.ret === 0){ // 成功
						connectKey(res.terminal,result);
						dataxml = res.xml;
						return;
					}
					showMsg(res.msg);
					saveLog(0x02, "开锁失败(验证身份)："+res.msg, newZcode, "", "");
				},
				error:function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
			
		}
		
		// 通过终端序列号来连接Ukey
		function connectKey(cn, result){
			plus.nativeUI.showWaiting(ukeyLoadingTxt);
			plus.mgca.connect(cn,
			function(rep){
				plus.nativeUI.closeWaiting();
				if(rep.result==0){
					signUp(result);
					return;
				}
				saveLog(0x02, "开锁失败(Ukey签名)："+rep.message, newZcode, "", dataxml);
				showMsg(rep.message);
			}, function(err){
				plus.nativeUI.closeWaiting();
				saveLog(0x02, "开锁失败(Ukey签名)："+err.message, newZcode, "", dataxml);
				showMsg(err.message);
				return;
			});
		}

		function signUp(result){
			console.log("dataxml is"+ dataxml);
			plus.mgca.sign(dataxml,
				function(nrep){
					var mes=nrep.message;
					if(nrep.result==0){
						console.log("签名成功");
						verifysign(mes,result);
						return;
					}
					saveLog(0x02, "开锁失败(Ukey签名)："+nrep.message, newZcode, "", dataxml);
					showMsg(nrep.message);
				}, function(err){
					saveLog(0x02, "开锁失败(Ukey签名)："+err.message, newZcode, "", dataxml);
					showMsg(err.message);
					return;
				}
			);
		}
		
		function verifysign(mes,result){
			plus.nativeUI.showWaiting(ukeyverifysignText);
			var veurl = upre + "/app/memb/zcode_lock!verifySignOpLock.action";
			var consts = plus.blelock.consts;
			var encrypted = false, status;
			
			if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
				encrypted = true;
			}
			if((consts.STATUS_REUSABLE.code  & result.status) != 0){
				// a.锁可重用状态:
				saveLog(0x02, "开锁失败：锁属于可重用状态,无法开锁", newZcode, mes, dataxml);
				showMsg(opLockErByLockReusable);
			}else if((consts.STATUS_AUTHORIZED.code & result.status) != 0){
				mui.ajax(veurl,{
					type:"POST",
					dataType:"json",
					data:{
						xmlInfo:dataxml,
						bizdatasign:mes,
						zcode: result.zcode,
						seed:result.seed
					},
					success:function(res){
						// UKey验签成功。
						console.log("verifysign(): success result = "+JSON.stringify(res));
						plus.nativeUI.closeWaiting();
						if(res.ret === 0){
							// 检查是否可以签名
							var zcodew = {
								   "zcSign" : res.zcSign
							};
							zcodew.encrypted = encrypted;
							opLock(zcodew, mes);
							return;
						}
						// UKey验签失败。
						showMsg(res.msg);
						saveLog(0x02, "开锁失败（Ukey签名）："+res.msg, newZcode, mes, dataxml);
					},
					error:function(xhr, type, cause){
						plus.nativeUI.closeWaiting();
						ajaxerror(xhr, type, cause);
					}
				})
			}
		}
		
		function opLock(zcodew, mes){
			// 开始开锁
			lockService.openLock({
				success: success,
				error: error,
				zcode: zcodew
			});

			function success(result){
				plus.nativeUI.closeWaiting();
				$.dialog({content:openLockSucc, ok : tanOkText,okCallback:function(){return handshake(0x00)}});
				saveLog(0x02, "开锁成功", newZcode, mes, dataxml);
			}

			function error(result){
				plus.nativeUI.closeWaiting();
				saveLog(0x02, result.message, newZcode, mes, dataxml);
				showMsg(result.message);
			}
		}
	}
	//-------------------------开锁流程完成-------------------------------------
	
	// -------------------------关闭锁流程-------------------------------------
	function closeLock(){
		var isHandShake = false, closeZcode;
		if (isNotConnected) {
			console.log("没有连接");
			connectBlueTooth(doHandShake);
		} else {
			console.log("已经连接");
			doHandShake();
		}
		
		// 握手流程可选
		function doHandShake(){
			if(isHandShake){ 
				console.log("需要握手");
				handshake(0x00, doCloseLock);
			}else{
				console.log("不需要握手");
				doCloseLock();
			}
		}
		
		function doCloseLock(res){
			
			if(conf.debug){
				console.log("关闭锁的甄码:"+JSON.stringify(res));
			}
//			closeZcode = res.zcode;
			$.dialog({content: closeLockTips,ok: tanOkText, okCallback: closeLock});
			
			function closeLock(){
				lockService.closeLock({
					success: success,
					error: error,
					timeout: 10/*0: default 30s */
				});
				
				function success(result){
					showMsg(closeLockSucc);
					saveLog(0x04, "关锁成功", closeZcode);
				}
				
				function error(result){
					saveLog(0x04, result.message, closeZcode);
					showMsg(result.message);
				}
			}
		}
		
	}
	// -------------------------关闭锁流程-------------------------------------
	
	// -------------------------修改锁密钥流程-------------------------------------
	// 修改密钥流程：
	// 1. 握手 获取随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色	-- 测试省略
	// 注：UKEY的作用是验身，控制访问锁密钥。
	// 3. 签名 服务器检查用户关系，使用锁密钥签名随机串（16进制串表示）	-- 测试时APP端签名
	// 4. 改密 给甄码锁发送修改密钥指令。
	function modifyKey(){
		var dataxml, encrypted = false, mzcode, seed, status='Y', terminal;

		if (isNotConnected) {
			console.log("没有连接");
			connectBlueTooth(doModifyKey);
		} else {
			console.log("已经连接");
			doModifyKey();
		}
		
		function doModifyKey(){
			handshake(0x01,getHandshakeResult); 
		}
		
		function getHandshakeResult(result){
			var consts = plus.blelock.consts;
			
			if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
				encrypted = true;
			}
			if((consts.STATUS_REUSABLE.code  & result.status) != 0){
				// a.锁可重用状态:
				status = 'N';
			}
			mzcode = result.zcode;
			seed   = result.seed;
			checkUser();
		}
		
		function checkUser(){
			var churl = upre + "/app/memb/zcode_lock!managerQueryTerminal.action";
			plus.nativeUI.showWaiting(popupLoadingTxt);
			mui.ajax(churl, {
				data:{
					zcode:mzcode,
					seed :seed,
					lockStatus: status,
					address:address,
					zcode:mzcode,
					mark:'U'
				},
				dataType:"json",
				type:"GET",
				success:function(res){
					console.log("checkUser() result = "+JSON.stringify(res));
					plus.nativeUI.closeWaiting();
					if(res.ret === 0){ // 成功
						connectKey(res.terminal);
						dataxml = res.xml;
						return;
					}else if(res.ret === 2){
						dataxml = res.xml;
						selectUkey(res.msg, connectKey, "", dataxml);
						return;
					}
					saveLog(0x07,"修改锁密钥失败（验证身份）："+rep.message, mzcode, "", dataxml);
					showMsg(res.msg);
				},
				error:function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		}
		
		function connectKey(cn){
			plus.nativeUI.showWaiting(ukeyLoadingTxt);
			terminal = cn;
			plus.mgca.connect(cn,
				function(rep){
					plus.nativeUI.closeWaiting();
					if(rep.result==0){
						signUp();
						return;
					}
					showMsg(rep.message);
					saveLog(0x07,"修改锁密钥失败（连接UKey）："+rep.message, mzcode, "", dataxml);
				}, function(err){
					plus.nativeUI.closeWaiting();
					showMsg(err.message);
					saveLog(0x07,"修改锁密钥失败（连接UKey）："+err.message, mzcode, "", dataxml);
					return;
				});
		}
		
		function signUp(){
			console.log("dataxml is"+ dataxml);
			plus.mgca.sign(dataxml,
				function(nrep){
					var mes=nrep.message;
					if(nrep.result==0){
						verifysign(mes);
						return;
					}
					showMsg(nrep.message);
					saveLog(0x07,"修改锁密钥失败（UKey签名）："+nrep.message, mzcode, "", dataxml);
				}, function(err){
					showMsg(err.message);
					saveLog(0x07,"修改锁密钥失败（UKey签名）："+err.message, mzcode, "", dataxml);
					return;
				}
			);
		}
		
		function verifysign(mes){
			plus.nativeUI.showWaiting(ukeyverifysignText);
			var reserUrl = upre + "/app/memb/zcode_lock!verifySignModifyKey.action";
			mui.ajax(reserUrl,{
				type:"GET",
				dataType:"json",
				data:{
					xmlInfo:dataxml,
					bizdatasign:mes,
					address: address,
					seed: seed,
					terminal:terminal
				},
				success:function(res){
					// UKey验签成功。
					console.log("verifysign(): success result = "+JSON.stringify(res));
					plus.nativeUI.closeWaiting();
					if(res.ret === 0){
						console.log("UKey验证签名成功");
						var options = {encrypted: false};
						options.encrypted = encrypted;
						options.plainLength = res.plainLength;
						options.packetBody  = res.packetBody;
						opModifyKey(options, mes);
						return;
					}
					// UKey验签失败。
					showMsg(res.msg);
					saveLog(0x07, "修改锁密钥失败（Ukey验证签名）："+res.msg, mzcode, "", dataxml);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					saveLog(0x07, "修改锁密钥失败（Ukey验证签名）：网络问题或其他原因", mzcode, "", dataxml);
					ajaxerror(xhr, type, cause);
				}
			});
		}
		
		function opModifyKey(options, mes){
			lockService.modifyKey({
				success: success,
				error: error,
				options: options
			});
			
			function success(result){
				plus.nativeUI.closeWaiting();
				callBack();
				saveLog(0x07, "修改成功", mzcode, mes, dataxml);
			}
			
			function callBack(){
				plus.nativeUI.showWaiting(zmaModifyPwdTips);
				var uUrl = upre + "/app/memb/zcode_lock!cleanKey.action";
				mui.ajax(uUrl, {
					type:"POST",
					dataType:"json",
					data:{
						address: address
					},
					success: function(res){
						plus.nativeUI.closeWaiting();
						if(res.ret == 0){
							showMsg(zmaModifyPwdSucc);
							return;
						}
						showMsg(res.msg);
					},
					error:function(xhr, type, cause){
						plus.nativeUI.closeWaiting();
						ajaxerror(xhr, type, cause);
					}
				});
			}

			function error(result){
				plus.nativeUI.closeWaiting();
				saveLog(0x07, result.message, mzcode, mes, dataxml);
				showMsg(result.message);
			}
		}
		
	}
	// -------------------------修改锁密钥流程-------------------------------------
	// 选择需要连接的序列号
	function selectUkey(msg, connectKey){
		var selTerminal = "<select id='select'>";
		$.each(msg,function(i, d){
			selTerminal += "<option value='"+d+"'>"+d+"</option>";
		});
		selTerminal += "</select>";
		$.dialog({
			title: selectUkeyTips,
			content: selTerminal,
			ok: tanOkText,
			okCallback:callBack
		});
		function callBack(){
			connectKey($("#select").val());
		}
	}
	// -------------------------升级切换流程-------------------------------------
	// 1. 握手 获取随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色	-- 测试省略
	// 注：UKEY的作用是验身，控制访问锁密钥。
	// 3. 签名 服务器检查用户关系，使用锁密钥签名随机串（16进制串表示）	-- 测试时APP端签名
	// 4. 切换 给甄码锁发送切换指令，锁进入升级状态（使用nordic官方APP升级固件）。
	function switchUpgrade(){
		var szcode, seed, lockStatus = 'Y', dataxml, terminal, options; 
		
		if (isNotConnected) {
			console.log("没有连接");
			connectBlueTooth(doSwitchUpgrade);
		} else {
			console.log("已经连接");
			doSwitchUpgrade();
		}
		
		function doSwitchUpgrade(){
			handshake(0x00,getHandshakeResult); // 握手不加密 
		}
		
		function getHandshakeResult(result){
			plus.nativeUI.showWaiting(popupLoadingTxt);
			var consts = plus.blelock.consts;
			
			options = {encrypted: false};
			if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
				options.encrypted = true;
			}
			if((consts.STATUS_REUSABLE.code  & result.status) != 0){
				// a.锁可重用状态:
				lockStatus = 'N';
			}
			szcode = result.zcode;
			seed   = result.seed;
			checkUser();
		}
		
		function checkUser(){
			var swUrl = upre + "/app/memb/zcode_lock!managerQueryTerminal.action";
			mui.ajax(swUrl, {
				type:"GET",
				dataType:"json",
				data:{
					zcode:szcode,
					seed :seed,
					lockStatus: lockStatus,
					address:address,
					mark:'S'
				},
				success:function(res){
					console.log("获取Ukey序列号："+JSON.stringify(res));
					plus.nativeUI.closeWaiting();
					if(res.ret === 0){ // 成功
						connectKey(res.terminal);
						dataxml = res.xml;
						return;
					}else if(res.ret === 2){
						dataxml = res.xml;
						selectUkey(res.msg, connectKey);
						return;
					}
					saveLog(0x08,"切换升级失败（验证身份）："+rep.message, szcode, "", dataxml);
					showMsg(res.msg);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		}
		
		function connectKey(cn){
			plus.nativeUI.showWaiting(ukeyLoadingTxt);
			terminal = cn;
			plus.mgca.connect(cn,
				function(rep){
					plus.nativeUI.closeWaiting();
					if(rep.result==0){
						signUp();
						return;
					}
					showMsg(rep.message);
					saveLog(0x08,"切换升级失败（连接UKey）："+rep.message, szcode, "", dataxml);
				}, function(err){
					plus.nativeUI.closeWaiting();
					showMsg(err.message);
					saveLog(0x08,"切换升级失败（连接UKey）："+err.message, szcode, "", dataxml);
					return;
				});
		}
		
		function signUp(){
			console.log("dataxml is"+ dataxml);
			plus.mgca.sign(dataxml,
				function(nrep){
					var mes=nrep.message;
					if(nrep.result==0){
						verifysign(mes);
						return;
					}
					showMsg(nrep.message);
					saveLog(0x08,"切换升级失败（UKey签名）："+nrep.message, szcode, "", dataxml);
				}, function(err){
					showMsg(err.message);
					saveLog(0x08,"切换升级失败（UKey签名）："+err.message, szcode, "", dataxml);
					return;
				}
			);
		}
		
		function verifysign(mes){
			plus.nativeUI.showWaiting(ukeyverifysignText);
			var vUrl = upre + "/app/memb/zcode_lock!verifySwitchUpgradeSign.action";
			mui.ajax(vUrl, {
				type:"GET",
				dataType:"json",
				data:{
					xmlInfo:dataxml,
					bizdatasign:mes,
					seed: seed,
					address:address,
					terminal:terminal
				},
				success:function(res){
					console.log("验签数据"+JSON.stringify(res));
					plus.nativeUI.closeWaiting();
					if(res.ret === 0){
						options.lockSign = res.sign;
						onSwitchUpgrade(mes);
						return;
					}
					saveLog(0x08,"切换升级失败（UKey验签）："+err, szcode, mes, dataxml);
					showMsg(res.msg);
				},
				error: function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					saveLog(0x08,"切换升级失败（UKey验签）："+err, szcode, mes, dataxml);
					ajaxerror(xhr, type, cause);
				}
			});
		}
		
		function onSwitchUpgrade(mes){
			lockService.switchUpgrade({
				success: success,
				error: error,
				options: options
			});
			
			function success(result){
				console.log("切换升级成功："+JSON.stringify(result));
				plus.nativeUI.closeWaiting();
				showMsg(zmaUpgradeSuccess);
				saveLog(0x08, "切换成功", szcode, mes, dataxml);
			}

			function error(result){
				plus.nativeUI.closeWaiting();
				saveLog(0x08, result.message, szcode, mes, dataxml);
				showMsg(result.message);
			}
		}
		
	}
}

// @since liujun 2018-03-20
// 保存操作日志
function saveLog(type, content, code, dataSign, xmlData){
	console.log("saveLog(): type = "+ type+",content="+content+",address="+address +", code = " + code);
	if(!dataSign){
		dataSign = "";
	}
	if(!xmlData){
		xmlData = "";
	}
	if(!code){
		var pageZcode = $("#code").html();
		code = pageZcode || "";
		if(conf.debug){console.log("获取甄码：" + pageZcode);}
	}
	if(conf.debug){console.log("获取甄码：" + code);}
	// 获取位置信息
	var coordsType = "gcj02", latitude, longitude, operateAddr;
	getSystemAddrInfo();
	
	function getSystemAddrInfo(){
		plus.geolocation.getCurrentPosition(successCB, errorCB, {
			provider:'baidu',
			enableHighAccuracy:true,
			coordsType: coordsType
		});
		
		function successCB(e){
			if(conf.debug){
				console.log("获取系统的地址信息："+JSON.stringify(e));
				console.log('Geolocation\nLatitude:' + e.coords.latitude + '\nLongitude:' + e.coords.longitude + '\nAltitude:' + e.coords.altitude);
			}
			var coords = e.coords;
			var addresses = e.address;
			latitude = coords.latitude;
			longitude= coords.longitude;
			operateAddr = addresses.country + addresses.province + addresses.city + addresses.district;
			// save
			saveOpLog();
		}
		
		function errorCB(e) {
			if(conf.debug){
				console.log("获取系统的地址信息出错："+JSON.stringify(e));
			}
		}
	}
	
	function saveOpLog(){
		var saveUrl = upre + "/app/memb/zcode_lock!saveOpLog.action";
		mui.ajax(saveUrl,{
			type:"POST",
			dataType:"json",
			data:{
				type   : type,
				content: content,
				address: address,
				datasign: dataSign,
				plaindata: xmlData,
				lng: longitude,
				lat: latitude,
				operateAddr: operateAddr,
				coordsType: coordsType,
				zcode: code
			},
			success:function(e){
				console.log("save log data:"+JSON.stringify(e));
			},
			error: function(xhr, type, cause){
				console.log("xhr = " + xhr + ",type = " + type + ",cause = " + cause);
			}
		});
	}
}

mui.init({
	beforeback: function(){
		if(lockService){
			console.log("close lockService");
			lockService.close();
			lockService = null;
		}
	}
});
mui.plusReady(function(){
	conf.uiInit();
	plusReady();
})

function showMsg(msg){
	$.dialog({
		content: msg,
		ok: tanOkText
	})
}

function openWrite(id, appType, zcode){
	if(lockService){
		console.log("openWrite lockService close");
		lockService.close();
		lockService = null;
	}
	var dpage = plus.webview.getWebviewById("/lock_write_code.html");
	// re-preload: can't preload in autoShow: false page
	if(dpage == null){
        dpage = mui.preload({url: "/lock_write_code.html",
            extras:{
               appid:id, lockAddr:address, lockName:name, zmaCode: zcode
            }});
        return;
    }else{
        console.log(dpage.id);
        mui.fire(dpage,'ppreload',{
            appid:id, lockAddr:address, lockName:name, zmaCode: zcode
        });
    }
}