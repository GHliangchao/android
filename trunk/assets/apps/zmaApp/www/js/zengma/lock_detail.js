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
		name = detail.name;
		address = detail.address;
		code = detail.code;
		console.log("lock_detail webinit() name="+name+",address="+address+",code="+code);
		initInfo();
		webv.show("slide-in-right");
	}
	
	function initInfo(){
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
		
		plus.nativeUI.showWaiting("正在加载中~~");
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
						ok: "确定",
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
		var page = plus.webview.getWebviewById("zcNFC.html");
		if (page == null) {
			mui.openWindow({
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
		console.log("read NFC start");
		var options = {cardId: address, format:"txt"};
		
		// 执行读操作
		plus.blelock.nfcRead({
			success:success,
			error:error,
			options: options
		});
		
		function success(result){
			console.log("读NFC成功结果："+JSON.stringify(result));
		}
		
		function error(result){
			console.log("读NFC失败结果："+JSON.stringify(result));
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
				showMsg("未获取位置信息，请在空旷的位置上报");
				return;
			}
			var wgs84togcj02  = coordtransform.wgs84togcj02(lng ,lat);
			lng = wgs84togcj02[0];
			lat  = wgs84togcj02[1];
			var gcj02tobd09 = coordtransform.gcj02tobd09(lng ,lat);
			lng = gcj02tobd09[0];
			lat  = gcj02tobd09[1];
			var page = plus.webview.getWebviewById("map.html");
			if (page == null) {
				mui.openWindow({
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
				showMsg("甄码锁未写入甄码");
				return;
			}
			message += "<div style='text-align: left;'>";
			message += "甄码编码：" + result.zcode + "<br/>";
			message += "甄码时间：" + result.zcTimeText + "<br/>";
			message += "CA名称：" + result.caName + "<br/>";
			message += "证书序号：" + result.certSn + "<br/>";
			message += "甄码用户名：" + result.zcUsername + "<br/>";
			message += "甄码标题：" + result.zcTitle + "<br/>";
			message += "</div>";
			
			mui.ajax(readUrl, {
				data: {
					"lockId": zclockId,
					"message": message
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
			showMsg("甄码锁地址错误");
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
				showMsg("连接失败");
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
		version.text("锁版本" + result.zclockVersions+" 协议版本"+result.protoVersions);
		$("#state").text(result.statusText+" 电量"+result.battery+"%");
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
				showMsg("甄码锁当前已可重用");
				saveLog(0x05, "重置成功:甄码锁当前已属于可重用状态");
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
					saveLog(0x05, "重置失败："+res.msg);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					saveLog(0x05, "重置失败");
					ajaxerror(xhr, type, cause);
				}
			});
		}
		
		function connectKey(cn){
			plus.nativeUI.showWaiting("正在连接Ukey~");
			plus.mgca.connect(cn,
			function(rep){
				if(rep.result==0){
					signUp();
					return;
				}
				plus.nativeUI.closeWaiting();
				showMsg(rep.message);
				saveLog(0x05,"重置失败（连接UKey）："+rep.message,"",xmlData);
			}, function(err){
				plus.nativeUI.closeWaiting();
				showMsg(err);
				saveLog(0x05,"重置失败（连接UKey）："+err,"",xmlData);
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
					saveLog(0x05,"重置失败（UKey签名）："+nrep.message,"",xmlData);
				}, function(err){
					showMsg(err.message);
					saveLog(0x05,"重置失败（UKey签名）："+err.message,"",xmlData);
					return;
				}
			);
		}
		
		function verifysign(mes){
			plus.nativeUI.showWaiting("正在验签");
			var reserUrl = upre + "/app/memb/zcode_lock!verifySignResetLock.action";
			mui.ajax(reserUrl,{
				type:"GET",
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
					saveLog(0x05, "重置失败（Ukey签名）："+res.msg, mes, xmlData);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					saveLog(0x05, "重置失败", mes, xmlData);
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
				$.dialog({content:"重置成功", ok :"确    定", okCallback:function(){
						code = "";
						$("#code").empty();
						return handshake(0x00);
					}});
				saveLog(0x05, "重置成功", mes, xmlData);
			}

			function error(result){
				plus.nativeUI.closeWaiting();
				saveLog(0x05, result.message, mes, xmlData);
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
			var dpage = plus.webview.getWebviewById("zmlist.html");
			// re-preload: can't preload in autoShow: false page
			if(dpage == null){
		        dpage = mui.openWindow({url: "zmlist.html",
		            extras:{
		               write:'Y',address:address,lockName:name
		            }});
		        return;
		    }else{
		        mui.fire(dpage,'ppreload',{
		            write:'Y',address:address,lockName:name
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
					openWrite(e.appId);
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
		var dataxml;

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
				showMsg("甄码锁还没有写入甄码");
				return;
			}
			var churl = upre + "/app/memb/zcode_lock!queryTerminalByCode.action";
			plus.nativeUI.showWaiting("正在获取数据");
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
					saveLog(0x02, "开锁失败(验证身份)："+res.msg, "", "");
				},
				error:function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
			
		}
		
		// 通过终端序列号来连接Ukey
		function connectKey(cn, result){
			plus.nativeUI.showWaiting("正在连接Ukey");
			plus.mgca.connect(cn,
			function(rep){
				plus.nativeUI.closeWaiting();
				if(rep.result==0){
					signUp(result);
					return;
				}
				saveLog(0x02, "开锁失败(Ukey签名)："+rep.message, "", dataxml);
				showMsg(rep.message);
			}, function(err){
				plus.nativeUI.closeWaiting();
				saveLog(0x02, "开锁失败(Ukey签名)："+err.message, "", dataxml);
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
					saveLog(0x02, "开锁失败(Ukey签名)："+nrep.message, "", dataxml);
					showMsg(nrep.message);
				}, function(err){
					saveLog(0x02, "开锁失败(Ukey签名)："+err.message, "", dataxml);
					showMsg(err.message);
					return;
				}
			);
		}
		
		function verifysign(mes,result){
			plus.nativeUI.showWaiting("正在验证签名数据");
			var veurl = upre + "/app/memb/zcode_lock!verifySignOpLock.action";
			var consts = plus.blelock.consts;
			var encrypted = false, status;
			
			if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
				encrypted = true;
			}
			if((consts.STATUS_REUSABLE.code  & result.status) != 0){
				// a.锁可重用状态:
				saveLog(0x02, "开锁失败：锁属于可重用状态,无法开锁", mes, dataxml);
				showMsg("锁属于可重用状态，无法开锁");
			}else if((consts.STATUS_AUTHORIZED.code & result.status) != 0){
				mui.ajax(veurl,{
					type:"GET",
					dataType:"json",
					data:{
						xmlInfo:dataxml,
						bizdatasign:mes,
						zcode: result.zcode,
						seed:result.seed
					},
					success:function(res){
						// UKey验签成功。
						console.log("verifysign(): success result = "+JSON.stringify(res)+","+res.zcKey);
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
						saveLog(0x02, "开锁失败（Ukey签名）："+res.msg, mes, dataxml);
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
				$.dialog({content:"开锁成功", ok :"确    定",okCallback:function(){return handshake(0x00)}});
				saveLog(0x02, "开锁成功", mes, dataxml);
			}

			function error(result){
				plus.nativeUI.closeWaiting();
				saveLog(0x02, result.message, mes, dataxml);
				showMsg(result.message);
			}
		}
	}
	//-------------------------开锁流程完成-------------------------------------
	
	// -------------------------关闭锁流程-------------------------------------
	function closeLock(){
		var isHandShake = false;
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
				handshake(0x00,doCloseLock);
			}else{
				console.log("不需要握手");
				doCloseLock();
			}
		}
		
		function doCloseLock(){
			$.dialog({content:"请手动挂锁以完成关锁",ok:"确   定", okCallback: closeLock});
			
			function closeLock(){
				lockService.closeLock({
					success: success,
					error: error,
					timeout: 10/*0: default 30s */
				});
				
				function success(result){
					showMsg("关锁成功");
					saveLog(0x04, "关锁成功");
				}
				
				function error(result){
					saveLog(0x04, result.message);
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
			plus.nativeUI.showWaiting("正在获取数据");
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
					saveLog(0x07,"修改锁密钥失败（验证身份）："+rep.message, "", dataxml);
					showMsg(res.msg);
				},
				error:function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		}
		
		function connectKey(cn){
			plus.nativeUI.showWaiting("正在连接Ukey~");
			terminal = cn;
			plus.mgca.connect(cn,
				function(rep){
					plus.nativeUI.closeWaiting();
					if(rep.result==0){
						signUp();
						return;
					}
					showMsg(rep.message);
					saveLog(0x07,"修改锁密钥失败（连接UKey）："+rep.message, "", dataxml);
				}, function(err){
					plus.nativeUI.closeWaiting();
					showMsg(err.message);
					saveLog(0x07,"修改锁密钥失败（连接UKey）："+err.message, "", dataxml);
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
					saveLog(0x07,"修改锁密钥失败（UKey签名）："+nrep.message, "", dataxml);
				}, function(err){
					showMsg(err.message);
					saveLog(0x07,"修改锁密钥失败（UKey签名）："+err.message, "", dataxml);
					return;
				}
			);
		}
		
		function verifysign(mes){
			plus.nativeUI.showWaiting("正在验签");
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
					saveLog(0x07, "修改锁密钥失败（Ukey验证签名）："+res.msg, "", dataxml);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					saveLog(0x07, "修改锁密钥失败（Ukey验证签名）：网络问题或其他原因", "", dataxml);
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
				saveLog(0x07, "修改成功",mes, dataxml);
			}
			
			function callBack(){
				plus.nativeUI.showWaiting("正在完成修改");
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
							showMsg("修改成功");
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
				saveLog(0x07, result.message, mes, dataxml);
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
			title:"请选择需要连接的Ukey序列号",
			content: selTerminal,
			ok: "确  定",
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
			plus.nativeUI.showWaiting("正在获取数据");
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
					saveLog(0x08,"切换升级失败（验证身份）："+rep.message, "", dataxml);
					showMsg(res.msg);
				},
				error:function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		}
		
		function connectKey(cn){
			plus.nativeUI.showWaiting("正在连接Ukey~");
			terminal = cn;
			plus.mgca.connect(cn,
				function(rep){
					plus.nativeUI.closeWaiting();
					if(rep.result==0){
						signUp();
						return;
					}
					showMsg(rep.message);
					saveLog(0x08,"切换升级失败（连接UKey）："+rep.message, "", dataxml);
				}, function(err){
					plus.nativeUI.closeWaiting();
					showMsg(err.message);
					saveLog(0x08,"切换升级失败（连接UKey）："+err.message, "", dataxml);
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
					saveLog(0x08,"切换升级失败（UKey签名）："+nrep.message, "", dataxml);
				}, function(err){
					showMsg(err.message);
					saveLog(0x08,"切换升级失败（UKey签名）："+err.message, "", dataxml);
					return;
				}
			);
		}
		
		function verifysign(mes){
			plus.nativeUI.showWaiting("正在验证Ukey签名");
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
					saveLog(0x08,"切换升级失败（UKey验签）："+err, mes, dataxml);
					showMsg(res.msg);
				},
				error: function(xhr, type, cause){
					plus.nativeUI.closeWaiting();
					saveLog(0x08,"切换升级失败（UKey验签）："+err, mes, dataxml);
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
				showMsg("切换成功");
				saveLog(0x08, "切换成功", mes, dataxml);
			}

			function error(result){
				plus.nativeUI.closeWaiting();
				saveLog(0x08, result.message, mes, dataxml);
				showMsg(result.message);
			}
		}
		
	}
}

// @since liujun 2018-03-20
// 保存操作日志
function saveLog(type, content, dataSign, xmlData){
	console.log("saveLog(): type = "+ type+",content="+content+",address="+address);
	if(!dataSign){
		dataSign = "";
	}
	if(!xmlData){
		xmlData = "";
	}
	var saveUrl = upre + "/app/memb/zcode_lock!saveOpLog.action";
	mui.ajax(saveUrl,{
		type:"POST",
		dataType:"json",
		data:{
			type   : type,
			content: content,
			address: address,
			datasign: dataSign,
			plaindata: xmlData
		},
		success:function(e){
			console.log("save log data:"+JSON.stringify(e));
		},
		error : function(xhr, type, cause){
			console.log("xhr = " + xhr + ",type = " + type + ",cause = " + cause);
		}
	});
}

mui.init({
	swipeBack: false
});
mui.plusReady(function(){
	conf.uiInit();
	plusReady();
})

function showMsg(msg){
	$.dialog({
		content: msg,
		ok: "确定"
	})
}

function openWrite(id){
	if(lockService){
		console.log("openWrite lockService close");
		lockService.close();
		lockService = null;
	}
	var dpage = plus.webview.getWebviewById("zmdetail.html");
	// re-preload: can't preload in autoShow: false page
	if(dpage == null){
        dpage = mui.openWindow({url: "zmdetail.html",
            extras:{
               aid:id,write:'Y',address:address,lockName:name
            }});
        return;
    }else{
        console.log(dpage.id);
        mui.fire(dpage,'ppreload',{
            aid:id,write:'Y',address:address,lockName:name
        });
    }
}