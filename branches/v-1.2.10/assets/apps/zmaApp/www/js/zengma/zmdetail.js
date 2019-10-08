var conf = zengma_conf, upre = conf.getUrlPrefix(), dpage = null, pageNo = 1;
var durl = 'zmchain.html', 
	aid  = null, 
	lcurl = upre + "/app/memb/membca!zmdetaillist.action",
	evurl = upre + "/app/memb/mpge_zcode!evidenceChain.action", 
	tabv = null, 
	pullr = null;

var name, startTime, endTime, write, address, 
	lockName, appType, baseZcode;

window.retains = {
	'zmchain.html' : true
};

// i18n国际化资源 @since liujun 2018-02-26
// ------------------start--------------------
var platformJs, cBaseZcodeJs, okJs, connectUkeyJs, verifysignJs, 
	loadingJs, onContentJs, showCodeJs, hideCodeJs, startTimeJs, 
	endTimeJs, waitingJs, zmCreateTimeJs, zmNameJs, zmTitleJs, 
	zmCodeJs, contentdownJs;
i18n.readyI18n(function() {
	$("#zmdetailText").html($.i18n.prop("zmdetail_titleText"));
	$("#nullmessage").html($.i18n.prop("zmdetail_null_message"));
	$("#zcodeText").html($.i18n.prop("zmdetail_zcodeText"));
	$("#a").html($.i18n.prop("zmdetail_hideCodeText"));
	$("#effectDateText").html($.i18n.prop("zmdetail_effectDateText"));
	$("#cnText").html($.i18n.prop("zmdetail_cnText"));
	$("#buznoText").html($.i18n.prop("zmdetail_buznoText"));
	$("#caIdText").html($.i18n.prop("zmdetail_caIdText"));
	$("#calidityDateText").html($.i18n.prop("zmdetail_calidityDateText"));
	$("#certAuthorityText").html($.i18n.prop("zmdetail_certAuthorityText"));
	$("#caStatusText").html($.i18n.prop("zmdetail_caStatusText"));
	$("#renewText").html($.i18n.prop("zmdetail_renewText"));
	$("#fingerprintText").html($.i18n.prop("zmdetail_fingerprintText"));
	$("#qrcodeText").html($.i18n.prop("zmdetail_qrcodeText"));
	$("#searchText").html($.i18n.prop("zmdetail_searchText"));
	$("#searchText1").html($.i18n.prop("zmdetail_searchText"));
	// placeholder
	$("#name").attr("placeholder", $.i18n.prop("zmdetail_placeholder_name"));
	$("#startTime").attr("placeholder",$.i18n.prop("zmdetail_placeholder_startTime"));
	$("#endTime").attr("placeholder",$.i18n.prop("zmdetail_placeholder_endTime"));
	// javaScript
	platformJs = $.i18n.prop("zmdetail_showWait_platformInfo");
	cBaseZcodeJs = $.i18n.prop("zmdetail_showWait_cBaseZcode");
	okJs = $.i18n.prop("tan_ok");
	connectUkeyJs = $.i18n.prop("zmdetail_showWait_connectUkey");
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
// ------------------ end --------------------

function plusReady() {
	var webv = plus.webview.currentWebview(), 
		curl = upre + "/app/memb/membca!appdetail.action";
	
	aid = webv.aid;
	write = webv.write || "N"; 
	address = webv.address;
	lockName = webv.lockName;
	appType  = webv.appType;
	
	// 生成基础甄码需要的信息 2017-12-25 liujun
	var time = null, timeSign = null;
	// 2017-11-27 liujun
	// --获取甄码信息 START--
	var zmCode1, zmCode2, caId, certAuthority, validityDate, 
		cn, buzno, status, fingerprint, effectDate, message, 
		nullmessage, zcodeIn, qrcode;

	cn = $("#cn");
	caId = $("#caId");
	buzno = $("#buzno");
	status = $("#status");
	qrcode = $("#qrcode");
	zmCode1 = $("#zmCode1");
	zmCode2 = $("#zmCode2");
	message = $("#message");
	zcodeIn = $("#zcodeIn");

	var mgca = plus.mgca;

	certAuthority = $("#certAuthority");
	validityDate = $("#validityDate");
	fingerprint = $("#fingerprint");
	effectDate = $("#effectDate");
	nullmessage = $("#nullmessage");
	// --END--

	window.addEventListener('ppreload', webinit, false);
	nullmessage[0].addEventListener('tap', genBaseZcode, false);
	mui.currentWebview.addEventListener("close", closeHandler, false);
	function closeHandler() {
		var service = lockService, w = window;
		console.log("closing");

		if (w.stabilityTest != null) {
			w.stabilityTest.stop(null, "", true);
			w.stabilityTest = null;
			console.log("close stability test");
		}

		if (service) {
			lockService = null;
			service.close();
		}
		return true;
	}
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras : {
			redirect : "zmdetail.html"
		}
	});

	webinit();
	function webinit(e) {
		if (e) {
			var detail = e.detail; // 带参数的话通过detail获取
			if (detail.aid != undefined) {
				aid = detail.aid;
			}
			if (detail.write) {
				write = detail.write, 
				address = detail.address,
				lockName = detail.lockName;
			}
			if (detail.appType) {
				appType = detail.appType;
			}
		}
		setTimeout(function() {
			$("#pullrefresh").hide();
			infoinit();
			initList();
		}, 50);
		webv.show("slide-in-right");
	}

	function initList() {
		mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
		$('#name').val('');
		$('#startTime').val('');
		$('#endTime').val('');
		name = '';
		startTime = '';
		endTime = '';
		doPull(true); // 查询到第一次
	}

	function infoinit() {
		mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
		nullmessage.hide();
		message.hide();
		zcodeIn.hide();
		plus.nativeUI.showWaiting(platformJs);
		try {
			mui.ajax(curl, {
				type : "GET",
				dataType : "json",
				data : {
					applicationId : aid
				},
				success : successHandler,
				error : function(xhr, type, cause) {
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		} catch (e) {
			plus.nativeUI.closeWaiting();
			console.error(e.message);
		}
	}
	
	function judgeAppType() {
		console.log("appType is "+appType+", write is" +write);
		if (appType == 'Y' || write == 'Y') {
			$("#searchText").show();
			$("#searchText1").hide();
			$("#create").hide();
			$("#right").hide();
		} else {
			$("#searchText1").show();
			$("#searchText").hide();
			$("#create").show();
			$("#right").show();
		}
		$("#pullrefresh").show();
	}

	function successHandler(e) {
		plus.nativeUI.closeWaiting();
		var item = e;
		if (typeof e.detail === "object") {
			item = e.detail.item;
		}
		if (item.ret == 0) {
			judgeAppType();
			// 判断角色是个人还是企业
			if ('B' == item.role) { // 企业
				baseZcode = item.zmCode;
				busZcode(item);
				zcodeIn.show();
				message.show();
				return;
			}
			// 个人
			if (!item.zmCode) { // 没有生成基础甄码
				showMsg("该应用还没有基础甄码");
				return;
			}
			baseZcode = item.zmCode;
			zcodeIn.hide();
			message.show();
			return;
		}
		mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
		// @since liujun 2018-01-15
		// 是企业用户，但是甄码不存在
		if (item.ret == 2) {
			nullmessage.show();
			return;
		}
		mui.toast(item.msg);
	}

	// 企业：要显示基础甄码以及证书信息
	function busZcode(item) {
		// 显示基础甄码的信息 @since 2017-11-28 liujun
		cn.html(item.companyName);
		caId.html(item.caid);
		buzno.html(item.buzno);
		status.html(item.status);
		zmCode1.html(item.zmCode);
		zmCode1.show();
		qrcode.attr("src", item.qrCodeImge);
		certAuthority.html(item.certAuthority);
		validityDate.html(item.validityDate);
		fingerprint.html(item.fingerprint);
		effectDate.html(item.effectDate);
	}

	// 预签名，生成基础甄码
	function genBaseZcode() {
		nullmessage[0].removeEventListener("tap", genBaseZcode, false);
		plus.nativeUI.showWaiting(cBaseZcodeJs);
		var gurl = upre + "/app/memb/mpge_zcode!genBaseZcode.action";
		try {
			mui.ajax(gurl, {
				data : {
					appid : aid
				},
				dataType : "json",
				type : "POST",
				success : function(info) {
					nullmessage[0].addEventListener("tap",
							genBaseZcode, false);
					plus.nativeUI.closeWaiting();
					if (conf.debug) {
						console.log(JSON.stringify(info));
					}
					if (info.ret == 0) {
						// 预签名成功
						connectKey(info.msg, info.xmlinfo, info.zcode);
					} else {
						$.dialog({
							content : info.msg,
							ok : okJs
						});
					}
				},
				error : function(xhr, type, cause) {
					nullmessage[0].addEventListener("tap",
							genBaseZcode, false);
					plus.nativeUI.closeWaiting();
					ajaxerror(xhr, type, cause);
				}
			});
		} catch (e) {
			nullmessage[0].addEventListener("tap", genBaseZcode, false);
			plus.nativeUI.closeWaiting();
			if (conf.debug) {
				console.error(e.message);
			}
		}
	}

	function connectKey(cn, signText, zcode) {
		plus.nativeUI.showWaiting(connectUkeyJs);
		mgca.connect(cn, function(rep) {
			var message = rep.message;
			if (rep.result == 0) {
				plus.nativeUI.closeWaiting();
				signUp(signText, zcode);
			} else {
				plus.nativeUI.closeWaiting();
				mui.toast(message);
				return;
			}
		}, function(err) {
			plus.nativeUI.closeWaiting();
			mui.toast(err.message);
			return;
		});
	}

	function signUp(signText, zcode) {
		mgca.sign(signText, function(nrep) {
			var mes = nrep.message;
			if (nrep.result == 0) {
				verifysign(mes, zcode);
			} else {
				mui.toast(mes);
				return;
			}
		}, function(err) {
			mui.toast(err.message);
			return;
		});
	}

	// 验签名
	function verifysign(bizdatasign, zcode) {
		plus.nativeUI.showWaiting(verifysignJs);
		var vurl = upre + "/app/memb/mpge_zcode!verifyBaseZcode.action";
		mui.ajax(vurl, {
			data : {
				appid : aid,
				bizdatasign : bizdatasign,
				zcode : zcode
			},
			dataType : "json",
			type : "POST",
			success : function(info) {
				plus.nativeUI.closeWaiting();
				if (conf.debug) {
					console.log(JSON.stringify(info));
				}
				if (info.ret == 0) {
					// 预签名成功
					$.dialog({
						content : info.msg,
						ok : okJs,
						okCallback : infoinit
					});
				} else {
					$.dialog({
						content : info.msg,
						ok : okJs
					});
				}
			},
			error : function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}

}

// 整体滑动暂不支持android手机，因为两个页面的移动动画，无法保证同步性；
mui.init({
	pullRefresh : {
		container : '#pullrefresh',
		up : {
			contentinit : contentdownJs,
			contentdown : contentdownJs,
			contentrefresh : loadingJs,
			contentnomore : onContentJs,
			callback : pullupRefresh
		}
	}
});

function pulldownRefresh() {
	setTimeout(function() {
		doPull(true);
	}, 1500);
}

function pullupRefresh() {
	setTimeout(function() {
		doPull(false);
	}, 1500);
}

function doPull(down) {
	if (down) {
		pageNo = 1;
	}
	if (!aid) {
		endPull(false);
		return;
	}
	
	// 判断该APP的类型是否是第三方应用
	if (appType == 'Y') {
		zcodeChain();
	} else {
		evidenceChain();
	}

	function endPull(down) {
		var pullr = getPullr().pullRefresh();
		if (down) {
			pullr.endPulldownToRefresh();
		} else {
			pullr.endPullupToRefresh();
		}
	}
	// 查询证据链 @since liujun 2018-09-10 evurl
	function evidenceChain() {
		console.log("enter evidenceChain()");
		mui.ajax(evurl, {
			type : "GET",
			data : {
				appid : aid,
				name : name,
				startDate : startTime,
				endDate : endTime,
				pageNum : pageNo,
				write : write
			},
			dataType : "html",
			async : true,
			cache : false,
			success : function(res) {
				console.log("下拉加载的数据：" + res);
				var list, all;
				try {
					all = getTabv();
					if (down) {
						all.empty();
					}
					$("#content").append(res);
					mui('#pullrefresh').pullRefresh().endPullupToRefresh(
							(++pageNo > pageCount));
				} catch (e) {
					console.log(e);
				}
				plus.nativeUI.closeWaiting();
			},
			error : function(xhr, type, cause) {
				endPull(down);
				ajaxerror(xhr, type, cause);
			}
		});
	}
	// 查询甄码链 @since liujun 2018-09-10
	function zcodeChain() {
		console.log("enter zcodeChain()");
		mui.ajax(lcurl, {
			type : "GET",
			data : {
				applicationId : aid,
				name : name,
				startTime : startTime,
				endTime : endTime,
				pageNum : pageNo,
				write : write
			},
			dataType : "html",
			async : true,
			cache : false,
			success : function(res) {
				console.log("下拉加载的数据：" + res);
				var list, all;
				try {
					all = getTabv();
					if (down) {
						all.empty();
					}
					$("#content").append(res);
					mui('#pullrefresh').pullRefresh().endPullupToRefresh(
							(++pageNo > pageCount));
				} catch (e) {
					console.log(e);
				}
				plus.nativeUI.closeWaiting();
			},
			error : function(xhr, type, cause) {
				endPull(down);
				ajaxerror(xhr, type, cause);
			}
		});
	}
}

function showBtn(btn) {
	var cainfo = $("#caInfo");
	if ((cainfo.css("display")) == 'none') {
		cainfo.show();
		$(btn).html(hideCodeJs);
	} else {
		cainfo.hide();
		$(btn).html(showCodeJs);
	}
}
// 搜索第三方应用的甄码按钮
function findBtn() {
	name = $('#name').val();
	startTime = $('#startTime').val();
	endTime = $('#endTime').val();
	if (startTime.trim() != '') {
		if (!checkDateTime(startTime)) {
			$.dialog({
				content : startTimeJs,
				ok : okJs
			});
			return;
		}
	}
	if (endTime.trim() != '') {
		if (!checkDateTime(endTime)) {
			$.dialog({
				content : endTimeJs,
				ok : okJs
			});
			return;
		}
	}
	plus.nativeUI.showWaiting(waitingJs);
	mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
	doPull(true);
}

//搜索证据链按钮
function findEvidenceBtn() {
	name = $('#name').val();
	startTime = $('#startTime').val();
	endTime = $('#endTime').val();
	if (startTime.trim() != '') {
		if (!checkDateTime(startTime)) {
			$.dialog({
				content : startTimeJs,
				ok : okJs
			});
			return;
		}
	}
	if (endTime.trim() != '') {
		if (!checkDateTime(endTime)) {
			$.dialog({
				content : endTimeJs,
				ok : okJs
			});
			return;
		}
	}
	plus.nativeUI.showWaiting(waitingJs);
	mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
	doPull(true);
}

function getPullr() {
	if (pullr == null) {
		return pullr = mui('#pullrefresh');
	}
	return pullr;
}

function getTabv() {
	if (tabv == null) {
		return tabv = $("#content");
	}
	return tabv;
}

mui.plusReady(function() {
	plusReady();
	conf.uiInit();
});

function checkDateTime(date) {
	// var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})
	// (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
	var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/;
	var r = date.match(reg);
	if (r == null) {
		return false;
	} else {
		return true;
	}
}

// item -> content
function zmdeetail(id, zmid) {
	if(lockService){
		console.log("openWrite lockService close");
		lockService.close();
		lockService = null;
	}
	var self = plus.webview.currentWebview(), openid = self.id;
	if (dpage == null) {
		dpage = plus.webview.getWebviewById(durl);
		// re-preload: can't preload in autoShow: false page
		if (dpage == null) {
			mui.openWindow({
				url : durl,
				extras : {
					appid: id,
					openid: openid,
					zmid: zmid,
					appType: appType,
					write: write,
					address: address,
					lockName: lockName
				}
			});
			return;
		}
	}
	mui.fire(dpage, 'ppreload', {
		appid: id,
		openid: openid,
		zmid: zmid,
		appType: appType,
		write: write,
		address: address,
		lockName: lockName
	});
}
(function($) {
	var btns = $('.btnTime');
	btns.each(function(i, btn) {
		btn.addEventListener('tap', function() {
			var optionsJson = this.getAttribute('data-options') || '{}';
			var options = JSON.parse(optionsJson);
			var id = this.getAttribute('id');
			/*
			 * 首次显示时实例化组件 示例为了简洁，将 options 放在了按钮的 dom 上 也可以直接通过代码声明 optinos
			 * 用于实例化 DtPicker
			 */
			var picker = new $.DtPicker(options);
			picker.show(function(rs) {
				/*
				 * rs.value 拼合后的 value rs.text 拼合后的 text rs.y 年，可以通过 rs.y.vaue 和
				 * rs.y.text 获取值和文本 rs.m 月，用法同年 rs.d 日，用法同年 rs.h 时，用法同年 rs.i
				 * 分（minutes 的第二个字母），用法同年
				 */
				btn.value = rs.text;
				/*
				 * 返回 false 可以阻止选择框的关闭 return false;
				 */
				/*
				 * 释放组件资源，释放后将将不能再操作组件 通常情况下，不需要示放组件，new DtPicker(options)
				 * 后，可以一直使用。 当前示例，因为内容较多，如不进行资原释放，在某些设备上会较慢。 所以每次用完便立即调用 dispose
				 * 进行释放，下次用时再创建新实例。
				 */
				picker.dispose();
			});
		}, false);
	});
})(mui);

// --------------写甄码到锁中的操作--------------------
// lockService: 用于甄码锁访问（开关锁、读写码等）
var lockService = null, blelock, xmlData, lockStatus;

// 检查蓝牙是否连接
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

function writeCode(code) {
	console.log("writeCode() start : code=" + code + ", address=" + address);
	if (!address) {
		showMsg("甄码锁MAC地址错误");
		return;
	}
	// 开始连接甄码锁 @since liujun 2018-03-15
	plus.blelock.connect({
		request : {
			address : address
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
	})

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
			if (result.zcode == code) {
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
			data : {
				appid : aid,
				newZcode : code,
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
				newZcode : code,
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
		console.log("newZcode = " + code + ", lockStatus=" + lockStatus
				+ ",address = " + address + ",zcode=" + zcode);
		var updateUrl = upre + "/app/memb/zcode_lock!updateZclockStatus.action";
		mui.ajax(updateUrl, {
			type : "POST",
			dataType : "json",
			data : {
				newZcode : code,
				lockStatus : lockStatus,
				address : address,
				zcode : zcode
			},
			success : function(res) {
				console.log("update lock status:"
								+ JSON.stringify(res));
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

// 创建甄码 @since liujun 2018-09-10
function createZcode() {
	console.log("zmdetail --> createZcode: Params:[baseZcode: " + baseZcode + "]");
	mui.openWindow({url: "zcode_create.html",extras: {
		zcode: baseZcode, appid: aid, appType: appType, createBaseCode: 'Y'
	}});
}

// 合并甄码@since liujun 2018-10-25
function bindZcodes(){
	console.log("zmdetail --> bindZcodes:appid = "+aid);
	var page = plus.webview.getWebviewById("bind_list.html");
	if (page == null) {
		mui.openWindow({url: "bind_list.html", extras: {
			appid: aid
		}});
	} else {
		mui.fire(page, "ppreload", {appid, aid});
	}
}

// 拆分二维码 @since liujun 2018-09-25
function splitCode(zcodeId) {
	console.log("zmdetail --> splitCode: params:[rootId: "+ zcodeId +"]");
	var page = plus.webview.getWebviewById("split_code_list.html");
	if (page == null) {
		mui.openWindow({url:"split_code_list.html", extras: {
			zcodeId:zcodeId, appid: aid, appType: appType
		}});
	} else {
		mui.fire(page, "ppreload", {zcodeId:zcodeId, appid: aid, appType: appType});
	}
}

// 右边状态栏@since liujun 2018-10-31
function showRight(){
	$("#showRight").show();
}

function hideRight() {
	$("#showRight").hide();
}

