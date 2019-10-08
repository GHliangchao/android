var vm = new Vue({
	el: "#content",
	data:{
		lockName: "",
		lockAddr: "",
		zmaCode: "",
		appid: "",
		startTime: "",
		endTime: "",
		pageNo: 0,
		items: [],
		count: -1,
		showNullData: false,
		pullDownNomoreText: "",
		startTimeTxt: "",
		endTimeTxt: "",
		searchTxt: "",
		signTitleTxt: "",
		zmacodeTxt: "",
		signNameTxt: "",
		signTimeTxt: "",
		writeTxt:"",
		coordsType: "gcj02",
		latitude: "",
		longitude: "",
		address: ""
	},
	methods:{
		search: function(){
			doPull(true);
		},
		writeCode: function(newCode){
			writeCode(newCode);
		},
		createAndWrite:function(){
			var url = "/lock_create_write.html";
			var page = plus.webview.getWebviewById(url);
			if(page == null){
				mui.preload({url: url, extras:{
					lockName: this.lockName,
					lockAddr: this.lockAddr,
					zmaCode: this.zmaCode,
					appid: this.appid
				}});
			} else {
				mui.fire(page, "ppreload", {
					lockName: this.lockName,
					lockAddr: this.lockAddr,
					zmaCode: this.zmaCode,
					appid: this.appid
				});
			}
		}
	}
});

// 国际化资源 @since liujun 2019-06-27
// ---------------------start-----------------------------
var ukeyLoadingTxt, ukeyverifysignText, tanOkText, tancancelTxt;
var pullDownInfoText, pullDownNomoreText, noBaseZcodeText,
	operateTimeoutText, macAddressError, zcodeExistText, getDataText,
	verifysignText, writeSuccess;
i18n.readyI18n(function(){
    // -------------  界面显示内容 start ----------------------------
	$("#writeCodeTitle").html($.i18n.prop("lock_write_code_titleText"));
	vm.startTimeTxt = $.i18n.prop("public_input_search_js_startDate");
    vm.endTimeTxt = $.i18n.prop("public_input_search_js_endDate");
    vm.searchTxt = $.i18n.prop("public_input_search_js_searchText");
    vm.signTitleTxt = $.i18n.prop("zmdetail_zmcode_title");
    vm.zmacodeTxt = $.i18n.prop("zmdetail_zmcode_zmCode");
    vm.signNameTxt = $.i18n.prop("zmdetail_zmcode_name");
    vm.signTimeTxt = $.i18n.prop("zmdetail_zmcode_createTime");
    vm.writeTxt = $.i18n.prop("lock_detail_writeNFCTxt");
    // -------------  界面显示内容 end ----------------------------


	ukeyLoadingTxt = $.i18n.prop("public_ukey_connect_prompt");
	ukeyverifysignText = $.i18n.prop("public_ukey_verifysignText");
	tanOkText = $.i18n.prop("tan_ok");
	tancancelTxt = $.i18n.prop("tan_cancel");
	
	// 没有更多数据了
	vm.pullDownNomoreText = $.i18n.prop("public_pull_down_nomoreText");
	
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
// --------------------- end -----------------------------

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
		curr.show("slide-in-right");
		cleanData();
		doPull(true);
		getSystemAddrInfo();
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
			var addresses= e.address;
			vm.latitude = coords.latitude;
			vm.longitude= coords.longitude;
			vm.address  = addresses.country + addresses.province + addresses.city + addresses.district;
		}
		
		function errorCB(e) {
			if(conf.debug){
				console.log("获取系统地址信息出错了："+JSON.stringify(e));
			}
		}
	}
	
	function cleanData(){
		this.startTime = "";
		this.endTime = "";
	}
	
}

// 时间的选择项
(function($) {
	var btns = $('.btnTime');
	btns.each(function(i, btn) {
		btn.addEventListener('tap', function() {
			var optionsJson = this.getAttribute('data-options') || '{}';
			var options = JSON.parse(optionsJson);
			var id = this.getAttribute('id');
			var picker = new $.DtPicker(options);
			picker.show(function(rs) {
				vm[id] = rs.text;
				picker.dispose();
			});
		}, false);
	});
})(mui);

mui.init();
mui.plusReady(function(){
	plusReady();
});

// ------------ @since liujun 重写下拉加载 2019.06.28 start --------------------
window.onscroll = function() { 
	var scrollTop = $(window).scrollTop();    //滚动条距离顶部的高度
	var scrollHeight = $(document).height();   //当前页面的总高度
	var clientHeight = $(window).height();  //当前可视的页面高度
	if(scrollTop + clientHeight >= scrollHeight-10){   //距离顶部+当前高度 >=文档总高度 即代表滑动到底部 count++;         //每次滑动count加1
		// 向上拉
      	doPull(false);
    }else if(scrollTop<=0){
    	// 滚动条距离顶部的高度小于等于0
    	// 向下拉
    }
}

var zmaListUrl = upre + "/app/memb/about_lock!findzmaList.action"; 
function doPull(down){
	if (!vm.appid) {
		if(conf.debug){
			console.log("没有应用ID");
		}
		return;
	}
	
	if (down) {
		vm.pageNo = 0;
		vm.count = -1;
		vm.items = [];
		vm.showNullData = false;
	}
	
	if(conf.debug){console.log("vm items length is " + vm.items.length + ", vm count is " + vm.count);}
	if (vm.items.length == vm.count) { // 判断还有没有数据
		return;
	}
	
	vm.pageNo++;
	plus.nativeUI.showWaiting("");
	// select MCL code list @since liujun 2019.06.28
	mui.ajax(zmaListUrl, {
		type: "GET",
		data: {
			appid: vm.appid,
			zcode: vm.zmaCode,
			startTime: vm.startTime,
			endTime: vm.endTime,
			pageNum: vm.pageNo,
		},
		dataType: "json",
		async: true,
		cache: false,
		success: function(res) {
			if(conf.debug){console.log(JSON.stringify(res));}
			plus.nativeUI.closeWaiting();
			if(res.ret == 0){
				var arr = vm.items;
				vm.items = arr.concat(res.mpgeZcodes);
				vm.count = res.count;
				if (vm.items.length == vm.count) { // 判断还有没有数据
					vm.showNullData = true;
				}
				return;
			}
			
			showMsg(res.msg);
		},
		error : function(xhr, type, cause) {
			plus.nativeUI.closeWaiting();
			ajaxerror(xhr, type, cause);
		}
	});
}

//弹框
function showMsg(msg) {
	$.dialog({
		content : msg,
		ok : tanOkText
	});
}

// --------------写甄码到锁中的操作--------------------
// lockService: 用于甄码锁访问（开关锁、读写码等）
var lockService = null, blelock, xmlData, lockStatus;

// 检查蓝牙是否连接
function checkCnxn() {
	var service = lockService;
	if (service == null || !service.open) {
		showMsg(operateTimeoutText);
		return true;
	}
	return false;
}

function writeCode(newCode){
	if (vm.lockAddr == "") {
		showMsg(macAddressError);
		return;
	}
	
	plus.nativeUI.showWaiting("");
	// 开始连接甄码锁 @since liujun 2018-03-15
	plus.blelock.connect({
		request: {
			address: vm.lockAddr
		},
		timeout: 0,
		success: function(result) {
			console.log("connect success : result=" + JSON.stringify(result));
			lockService = result.lockService;
			handshake(); // 连接成功进行握手操作
		},
		error: function(result) {
			console.log("connect error: result=" + JSON.stringify(result));
			plus.nativeUI.closeWaiting();
			showMsg(result.message);
		}
	});
	
	// 连接成功  --> 握手操作
	function handshake() {
		console.log("handshake() start");
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
			// 使用Ukey确认身份，服务器验签。
			plus.nativeUI.closeWaiting();
			// 判断甄码是否一样 @since liujun 2018-09-25
			if (result.zcode == newCode) {
				showMsg(zcodeExistText);
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
		plus.nativeUI.showWaiting(getDataText);
		mui.ajax(churl, {
			data : {
				appid : vm.appid,
				newZcode : newCode,
				zcode : result.zcode,
				seed : result.seed,
				address : vm.lockAddr
			},
			dataType: "json",
			type: "GET",
			success: function(res) {
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
			error: function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	// 通过终端序列号来连接Ukey
	function connectKey(cn, result) {
		plus.nativeUI.showWaiting(ukeyLoadingTxt);
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
	
	// 使用Ukey签名
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
		plus.nativeUI.showWaiting(verifysignText);
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
				appid : vm.appid,
				zcode : result.zcode,
				newZcode : newCode,
				lockStatus : lockStatus,
				address : vm.lockAddr,
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
		});
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
	
	// 保存日志
	function saveLog(type, content, dataSign) {
		if (!dataSign) {
			dataSign = "";
		}
		if (!xmlData) {
			xmlData = "";
		}
		console.log("saveLog(): type = " + type + ",content=" + content
				+ ",address=" + vm.lockAddr);
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
		console.log("newZcode = " + newCode + ", lockStatus=" + lockStatus
				+ ",address = " + vm.lockAddr + ",zcode=" + zcode);
		var updateUrl = upre + "/app/memb/zcode_lock!updateZclockStatus.action";
		mui.ajax(updateUrl, {
			type : "POST",
			dataType : "json",
			data : {
				newZcode : newCode,
				lockStatus : lockStatus,
				address : vm.lockAddr,
				zcode : zcode
			},
			success : function(res) {
				console.log("update lock status:" + JSON.stringify(res));
			},
			error : function(xhr, type, cause) {
				console.log("xhr=" + xhr + ",type=" + type + ",cause=" + cause);
			}
		});
	}
	
}
