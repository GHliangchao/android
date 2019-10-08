var conf = letpro_conf;

var enter_time = 0; //完成蓝牙测试的计数
var ud_time1 = 0; //完成升降锁测试的计数 *升降
var ud_time2 = 0; //                  *升降遇阻
var ud_time3 = 0; //                  *有车状态

var testShow =$("#testShow");//设置实现检测中..等待时的效果对象
var upre = conf.getUrlPrefix();
var logPullTimer = null; // 日志读取定时器

// lockService: 用于甄码锁访问（开关锁、读写码等）
var lockService = null, blelock;

// 甄码链测试 since 2018-03-10 pzp
var zcodes = [
	{"zcode":"11iZuHLHi8J4=", "zcTime": 1520672118, "caName":"GFA", "certSn": "1234567890abcdf0", 
		"zcUsername":"test001", "zcTitle":"装载确认", 
		"zcKey": "182EA09A38F1141B2D7916812BD097D51167C3E4"/*product*/, "zcSign":""/*product*/, 
		"plainLength": "", "packetBody": ""/*product when encrypted in server*/,
		"zcPlainKey":"a123456"/*only test*/, "id": 0/*only test*/
	},
	{"zcode":"8id4nUGszqlM=", "zcTime": 1520682118, "caName":"GFA", "certSn": "01234567890abcdf", 
		"zcUsername":"test002", "zcTitle":"到货确认",
		"zcKey": "F5E89E7F1EFB63A14F5715F77CD07444107E4314"/*product*/, "zcSign":""/*product*/,
		"plainLength": "", "packetBody": ""/*product when encrypted in server*/,
		"zcPlainKey":"b234567"/*only test*/, "id": 1/*only test*/
	}
];

// --- init ------------------------------------------------------------------
mui.plusReady(function() {
	blelock = plus.blelock;
	conf.uiInit();
	plusReady();
	mui.init({preloadPages:[{
		id:'test_list.html',
		url:'test_list.html'}]
  	});
});

function plusReady() {
	var letproData = $("#lock_info");
	var self = plus.webview.currentWebview();
	var addr = self.address, 
		btName = self.btName,
		code = self.code;

	$zcode().text(code); //适用于一条数据的替换
	var address = $("#address");
	address.text(addr);
	var btname = $("#btname");
	btname.text(btName);

	// close handler
	// @since 2017-02-17 pzp
	mui.currentWebview
	.addEventListener("close", closeHandler, false);
	
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
			console.log("webview closed: close lock service");
		}
		return true;
	}

}

function backPage(){
	if(lockService!=null){
		lockService.close();
	}
	mui.back();
}

var zcode = null;
function $zcode(){
	if(zcode == null){
		zcode = $("#zcode");
	}
	return zcode;
}

function zclockInfo(result){
	var version = $("#version");
	var statusInfo = $("#status");
	var zcode = $zcode();
		
	zcode.text(result.zcode);
	version.text("锁版本" + result.zclockVersions+" 协议版本"+result.protoVersions);
	statusInfo.text(result.statusText+" 电量"+result.battery+"%");
}

// --- Some auxiliary functions --------------------------------------------------
function exit(){
	mui("#topPopover").popover("hide");
	plus.storage.clear();
	mui.openWindow({
		url:"login.html"
	});
}

// 刘军写（关于右上角的弹框的显示问题）
// 进入到甄码锁列表
function lockList(){
	var launch, self = plus.webview.currentWebview();
	mui("#topPopover").popover("hide");
	launch = plus.webview.getLaunchWebview();
	launch.show("slide-in-right", 300, function(){
		self.close();
	});
}

function startHelp(){
	mui("#topPopover").popover("hide");
	mui.openWindow({url:'help.html'});
}

function isSameValidCnxn(){
	var service = lockService;
	return (service != null && service.open);
}

function checkCnxn(){
	var service = lockService;
	if(service == null || !service.open) {
		plus.nativeUI.alert("请先进行连接");
		return true;
	}
	return false;
}

//格式化日期
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "H+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

function statusOK(btn, status){
	status.text("成功");
	status.css("color", "green")
	btn.addClass("green");
}

function statusER(btn, status){
	status.text("失败");
	status.css("color", "red");
	btn.removeClass();
	btn.addClass("btn redbtn");
}

// --- Test func list --------------------------------------------------------------
function btConnect() {
	var btc_status = $("#btc_status");
	var btn_btc = $("#btn_btc");
	var addr = mui.currentWebview.address;

	if(!addr) {
		plus.nativeUI.alert("甄码锁地址错误");
		return;
	}
	// 连接甄码锁 - 甄码锁接口
	// @since 2017-02-09 pzp
	plus.blelock.connect({
		request: {
			address: addr
		},
		timeout: 0,
		success: function(result) {
			lockService = result.lockService;
			statusOK(btn_btc, btc_status);
		},
		error: function(result) {
			statusER(btn_btc, btc_status);
			plus.nativeUI.alert(result.message);
		}
	});
}

// Handshake handler.
// @since 2018-03-08 pzp
function handshake(self){
	var status = $("#hands_status");
	var btn = $(self);
	var consts = plus.blelock.consts;

	if(checkCnxn()) {
		return;
	}
	lockService.handshake({
		success: success,
		error: error,
		request: 0 // 0x01 加密
	});

	function success(result) {
		zclockInfo(result);
		statusOK(btn, status);
	}

	function error(result) {
		var errno = result.result;
		if(errno > consts.ER_NONE.code && errno < consts.ER_NOCODE.code){
			zclockInfo(result);
		}
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}

}

function readZcode(self){
	var btn = $(self);
	var status = $("#rzcode_status");

	if(checkCnxn()) {
		return;
	}
	lockService.readZcode({
		success: success,
		error: error
	});


	function success(result){
		var message = "";
		statusOK(btn, status);
		if(result.zcode === ""){
			plus.nativeUI.alert("锁未写入甄码");
			return;
		}
		message += "甄码编码：" + result.zcode + "\n";
		message += "甄码时间：" + result.zcTimeText + "\n";
		message += "CA名称：" + result.caName + "\n";
		message += "证书序号：" + result.certSn + "\n";
		message += "甄码用户名：" + result.zcUsername + "\n";
		message += "甄码标题：" + result.zcTitle + "\n";
		plus.nativeUI.alert(message);
	}

	function error(result){
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}

}

function openLock(self){
	var btn = $(self);
	var status = $("#lock_status");

	if(checkCnxn()) {
		return;
	}

	// 开锁流程：
	// 1. 握手 获取甄码编码、随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色         -- 测试省略
	// 注：UKEY的作用是验身，控制访问甄码密钥。
	// 3. 签名 服务器检查甄码、用户关系，使用甄码密钥签名随机串（16进制串表示） -- 测试时APP端签名
	// 4. 开锁 给甄码锁发送开锁指令
	lockService.handshake({
		success: handsOK,
		error: handsER,
		request: 0 // 0x01 加密
	});

	function handsER(result){
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}

	function handsOK(result){
		var consts = blelock.consts;
		var zcode  = null;
		var i = 0, encrypted = false, item;

		zclockInfo(result);
		if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
			encrypted = true;
		}
		if((consts.STATUS_REUSABLE.code  & result.status) != 0){
			// a. 锁可重用
			plus.nativeUI.alert("锁未写入甄码");
			statusER(btn, status);
			return;
		}else if((consts.STATUS_AUTHORIZED.code & result.status) != 0){
			// b. 锁授权状态
			for(i = 0; i < zcodes.length; i++){
				item = zcodes[i];
				if(item.zcode === result.zcode){
					zcode = $.extend({}, item);
					// 测试时用于生成zcSign，实际从服务器获取zcSign -->
					zcode.seed = result.seed;
					// <--
					break;
				}
			}
			if(zcode == null){
				plus.nativeUI.alert("当前甄码不是测试码");
				statusER(btn, status);
				return;
			}
		}else{
			plus.nativeUI.alert("甄码锁状态错误");
			statusER(btn, status);
			return;
		}
		zcode.encrypted = encrypted;
		// 开始写码
		lockService.openLock({
			success: success,
			error: error,
			zcode: zcode
		});

		function success(result){
			statusOK(btn, status);
			$zcode().text(zcode.zcode);
		}

		function error(result){
			statusER(btn, status);
			plus.nativeUI.alert(result.message);
		}
	}

}

function closeLock(self){
	var btn = $(self);
	var status = $("#lock_status");

	if(checkCnxn()) {
		return;
	}
	plus.nativeUI.alert("请手动挂锁以完成关锁");
	lockService.closeLock({
		success: success,
		error: error,
		timeout: 10/*0: default 30s */
	});

	function success(result){
		statusOK(btn, status);
	}

	function error(result){
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}
}

function wzcode(self){
	var btn = $(self);
	var status = $("#wzcode_status");

	if(checkCnxn()) {
		return;
	}
	// 写码流程：
	// 1. 握手 获取甄码编码、随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色         -- 测试省略
	// 注：UKEY的作用是验身，控制访问甄码密钥。
	// 3. 签名 服务器检查甄码、用户关系，使用甄码密钥签名随机串（16进制串表示） -- 测试时APP端签名
	// 注：锁可重用时可省略服务器的甄码签名。
	// 4. 写码 写入用户的甄码，锁进入授权状态或覆盖旧码。
	lockService.handshake({
		success: handsOK,
		error: handsER,
		request: 0x01 // 0x01 加密
	});

	function handsER(result){
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}

	function handsOK(result){
		var consts = blelock.consts;
		var zcode  = null, i = 0;
		var item, encrypted = false;

		zclockInfo(result);
		if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
			encrypted = true;
		}
		if((consts.STATUS_REUSABLE.code  & result.status) != 0){
			// a. 锁可重用 - 这里测试写入第一条甄码，实际使用用户的甄码
			zcode = $.extend({}, zcodes[0]);
			// 此时填充0
			zcode.zcSign = "0000000000000000000000000000000000000000";
		}else if((consts.STATUS_AUTHORIZED.code & result.status) != 0){
			// b. 锁授权状态
			for(i = 0; i < zcodes.length; i++){
				item = zcodes[i];
				if(item.zcode === result.zcode){
					if((item.id + 1) === zcodes.length){
						plus.nativeUI.alert("当前甄码已是最后一个，请重置锁");
						statusER(btn, status);
						return;
					}
					// 写下一个甄码
					zcode = $.extend({}, zcodes[item.id + 1]);
					// 测试时用于生成zcSign，实际从服务器获取zcSign -->
					zcode.lastPlainKey = item.zcPlainKey;
					zcode.seed = result.seed;
					// <--
					break;
				}
			}
			if(zcode == null){
				plus.nativeUI.alert("当前甄码不是测试码");
				statusER(btn, status);
				return;
			}
		}else{
			plus.nativeUI.alert("甄码锁状态错误");
			statusER(btn, status);
			return;
		}
		zcode.encrypted = encrypted;
		// 开始写码
		lockService.wzcode({
			success: success,
			error: error,
			zcode: zcode
		});

		function success(result){
			statusOK(btn, status);
			$zcode().text(zcode.zcode);
		}

		function error(result){
			statusER(btn, status);
			plus.nativeUI.alert(result.message);
		}

	}

}

function resetLock(self){
	var btn = $(self);
	var status = $("#reset_status");

	if(checkCnxn()) {
		return;
	}
	// 重置流程：
	// 1. 握手 获取甄码编码、随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色         -- 测试省略
	// 注：UKEY的作用是验身，控制访问甄码密钥。
	// 3. 签名 服务器检查甄码、用户关系，使用甄码密钥签名随机串（16进制串表示） -- 测试时APP端签名
	// 4. 重置 给甄码锁发送重置指令，锁进入可重用状态。
	lockService.handshake({
		success: handsOK,
		error: handsER,
		request: 0 // 0x01 加密
	});

	function handsER(result){
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}

	function handsOK(result){
		var consts = blelock.consts;
		var zcode  = null, i = 0;
		var item, encrypted = false;

		zclockInfo(result);
		if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
			encrypted = true;
		}
		if((consts.STATUS_REUSABLE.code  & result.status) != 0){
			// a. 锁可重用
			plus.nativeUI.alert("甄码锁当前已可重用");
			success(result);
			return;
		}else if((consts.STATUS_AUTHORIZED.code & result.status) != 0){
			// b. 锁授权状态
			for(i = 0; i < zcodes.length; i++){
				item = zcodes[i];
				if(item.zcode === result.zcode){
					zcode = $.extend({}, item);
					// 测试时用于生成zcSign，实际从服务器获取zcSign -->
					zcode.seed = result.seed;
					// <--
					break;
				}
			}
			if(zcode == null){
				plus.nativeUI.alert("当前甄码不是测试码");
				statusER(btn, status);
				return;
			}
		}else{
			plus.nativeUI.alert("甄码锁状态错误");
			statusER(btn, status);
			return;
		}
		zcode.encrypted = encrypted;
		// 开始重置
		lockService.resetLock({
			success: success,
			error: error,
			zcode: zcode
		});

		function success(result){
			statusOK(btn, status);
			$zcode().text(zcode.zcode);
		}

		function error(result){
			statusER(btn, status);
			plus.nativeUI.alert(result.message);
		}
	}
}

function locate(self){
	var btn = $(self);
	var status = $("#locate_status");

	if(checkCnxn()) {
		return;
	}
	lockService.locate({
		success: success,
		error: error,
		timeout: 15/*0: default 30s */
	});

	function success(result){
		var message;

		statusOK(btn, status);
		message = "经度："+result.lng + "\n纬度：" + result.lat;
		plus.nativeUI.alert(message);
	}

	function error(result){
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}
}

function switchUpgrade(self){
	var btn = $(self);
	var status = $("#swtUpgrade_status");

	if(checkCnxn()) {
		return;
	}
	// 升级切换流程：
	// 1. 握手 获取随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色	-- 测试省略
	// 注：UKEY的作用是验身，控制访问锁密钥。
	// 3. 签名 服务器检查用户关系，使用锁密钥签名随机串（16进制串表示）	-- 测试时APP端签名
	// 4. 切换 给甄码锁发送切换指令，锁进入升级状态（使用nordic官方APP升级固件）。
	lockService.handshake({
		success: handsOK,
		error: handsER,
		request: 0 // 0x01 加密
	});

	function handsER(result){
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}

	function handsOK(result){
		var consts = blelock.consts;
		var options = {encrypted: false, lockSign:""/*given in product*/};

		zclockInfo(result);
		if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
			options.encrypted = true;
		}
		// 测试时用于生成lockSign，实际从服务器获取lockSign -->
		options.seed = result.seed;
		// <--

		lockService.switchUpgrade({
			success: success,
			error: error,
			options: options
		});

		function success(result){
			statusOK(btn, status);
			plus.nativeUI.toast("已断开连接");
		}

		function error(result){
			statusER(btn, status);
			plus.nativeUI.alert(result.message);
		}
	}

}

function modifyKey(self){
	var btn = $(self);
	var status = $("#mkey_status");

	if(checkCnxn()) {
		return;
	}
	// 修改密钥流程：
	// 1. 握手 获取随机串和锁状态信息
	// 2. 验身 使用UKEY签名（随机串+时间戳），服务器验签、检查用户角色	-- 测试省略
	// 注：UKEY的作用是验身，控制访问锁密钥。
	// 3. 签名 服务器检查用户关系，使用锁密钥签名随机串（16进制串表示）	-- 测试时APP端签名
	// 4. 改密 给甄码锁发送修改密钥指令。
	lockService.handshake({
		success: handsOK,
		error: handsER,
		request: 0x01 // 0x01 加密
	});

	function handsER(result){
		statusER(btn, status);
		plus.nativeUI.alert(result.message);
	}

	function handsOK(result){
		var consts = blelock.consts;
		var options = {encrypted: false, lockSign:""/*given in product*/, lockKey:""};

		zclockInfo(result);
		if((consts.STATUS_ENCRYPTED.code & result.status) != 0){
			options.encrypted = true;
		}
		// 测试时用于生成lockSign，实际从服务器获取lockSign -->
		options.seed = result.seed;
		// <--

		lockService.modifyKey({
			success: success,
			error: error,
			options: options
		});

		function success(result){
			statusOK(btn, status);
		}

		function error(result){
			statusER(btn, status);
			plus.nativeUI.alert(result.message);
		}
	}
}
