var conf = letpro_conf;
var upre = conf.getUrlPrefix();
var devs = {};
var stateall = "全部甄码锁";

function plusReady() {
	var lockList = plus.webview.currentWebview();

	conf.uiInit();
	// comment: only test usage
	//lockList.addEventListener("show", showHandler);
	lockList.show();

	function showHandler(e) {
		var name = plus.storage.getItem("sessionName");
		var pass = plus.storage.getItem("sessionPass");
		//解决登录页面刷新
		plus.webview.close("login.html");
		if(name && pass) {
			checkLogin(name, pass);
		} else {
			console.log("login: no once");
			mui.openWindow({
				url: "login.html"
			});
		}
	}
	
}

function checkLogin(name, pass) {
	var password = plus.storage.getItem("passWord");
	
	console.log("login: check");
	if(!name || !pass){
		console.log("login: no name or pass");
		mui.openWindow({
			url: "login.html"
		});
		return;
	}
	plus.nativeUI.showWaiting();
	$.ajax({
		type: "get",
		url: upre + "/app/pro/beforeLogin.htm",
		success: function(data) {
			var MD5Signature = name + password + data.timestamp + data.randomNumber;
			// md5加密
			var md5 = hex_md5(MD5Signature);
			
			console.log("login: prepared");
			$.ajax({
				type: "get",
				url: upre + "/app/pro/checkLogin.htm",
				data: {
					username: name,
					password: pass,
					signature: md5,
					randomnumber: data.randomNumber
				},
				success: function(data) {
					plus.nativeUI.closeWaiting();
					if(data.success){
						console.log("login: online");
						return;
					}
					// 自动登录失败
					console.log("login: fail");
					mui.openWindow({
						url: "login.html"
					});
				},
				error: function(xhr, textstatus, errorthrown) {
					plus.nativeUI.closeWaiting();
					if(conf.debug){
						console.log(xhr.readyState);
						console.log(textstatus);
						console.log(errorthrown);
					}
					if(xhr.readyState !== 4) {
						plus.nativeUI.alert("请连接网络");
						return;
					}
					plus.nativeUI.alert("出错啦");
				}
			});
		},
		error: function(xhr) {
			plus.nativeUI.closeWaiting();
			if(xhr.readyState !== 4) {
				plus.nativeUI.alert("请连接网络");
				return;
			}
			plus.nativeUI.alert("出错啦");
		}
	});
}

// 退出的按钮
function exit() {
	plus.storage.clear();
	mui("#topPopover").popover("hide");
	mui.openWindow({
		url: "login.html"
	});
}

//扫描的函数
function scanClick() {
	var three, TAG = "scanClick(): ";
	var scanState = $("#bottom").text().trim(),
		three = $("#three"), a;

	console.log(TAG + "start");
	if(scanState === "扫描甄码锁") {
		//点击扫描甄码锁的时候扫描甄码锁
		$("#lockList").empty();
		devs = {};
		$("#bottom").html("停止扫描");
		three.html('甄码锁扫描中...')
			.addClass("lock_black").removeClass("nolock");

		// 启动扫描
		// @since 2017-02-09 pzp
		plus.blelock.scan({
			success: select,
			error: function(e) {
				console.log(TAG + "error = " + JSON.stringify(e));
				$("#bottom").html("扫描甄码锁");
				three.removeClass("lock_black");
				for(a in devs) {
					three.html('')
					return;
				}
				three
					.html(':&nbsp;(&nbsp;没有甄码锁！要不<a href="#" onclick="scanClick()">扫描一下</a>？')
					.addClass("nolock");
			}
		});
		return;
	}
	if(scanState === "停止扫描") {
		// 停止扫描
		// @since 2017-02-09 pzp
		plus.blelock.stopScan();

		$("#bottom").html("扫描甄码锁");
		three.removeClass("lock_black");
		for(a in devs) {
			three.html('')
			return;
		}
		three
			.html(':&nbsp;(&nbsp;没有甄码锁！要不<a href="#" onclick="scanClick()">扫描一下</a>？')
			.addClass("nolock");
	}
}

//根据状态扫描   
//    stateSelect(data) 根据遍历并将数组添加到**中
// 1.根据传过来的状态state来得到有关的div对象
// 2.对传入过来的状态进行判断要选择哪一个class
function stateClick(state) {
	stateall = state;
	mui("#topPopover1").popover("hide");
	mui("#topPopover").popover("hide");
	$("#titleCenter").html("甄码锁列表-" + state);
	$("#three").html('').removeClass("nolock");
	//调用循环查询的函数
	selectState(state, devs);
}

// 使用帮助的跳转
function clickHelp() {
	mui("#topPopover").popover("hide");
	mui.openWindow({
		url: 'help.html'
	});
}

//查询所有状态
function select(disco) {
	var lockList = $("#lockList"), dev = disco.device;

	// dev: {address, name}
	// 1. 已添加到设备列表，直接返回，否则执行2；
	// 2. 查询后台设备状态、编号，加入设备列表；
	if(devs[dev.address]) {
		return;
	}
	devs[dev.address] = dev;
	// display
	lockList.append(
		'<div class="lock_list_in" onclick="mui.openWindow({url:\'test_list.html\', extras:{address:\''+dev.address+
			'\',btName:\''+dev.name+'\',code:\''+dev.code+'\'}})">' +
		'甄码：' + dev.code + 
		'<br /> MAC：' + dev.address +
		'<br /> 蓝牙：' + dev.name +
		'<br /> 信号：<font color="green">' + dev.rssi + '</font>' +
		'<br /> 状态：' + statusText(dev) +
		'</div>'
	);

	function statusText(dev){
		var text = "";
		if(dev.status != -1){
			text = dev.status.toString(16);
			if(text.length === 1){
				text = "0" + text;
			}
			text = "0x" + text;
		}
		return text;
	}

}

function displayedCode(code){
	var C_MAX_LEN = 14, clen;
	if(!code){
		return "";
	}
	clen = code.length;
	if(clen > C_MAX_LEN){
		code = code.slice(clen - C_MAX_LEN);
	}
	return code;
}

//查询单个状态
// 根据存在集合中的数据进行判断
function selectState(state, devs) {
	var lockList = $("#lockList");
	var inner = "", j = 0;

	three = $("#three");
	if(state === "全部甄码锁") {
		$.each(devs, function(i, d) {
			var code = displayedCode(d.code);
			inner += '<div class="lock_list_in ' + d.checkCss + '" onclick="mui.openWindow({url:\'test_list.html\', extras:{address:\''+d.address+'\',btName:\''+d.name+'\'}})">' +
				'编号：' + code + '<br /> MAC：' + d.address +
				'<br /> 蓝牙：' + d.name +
				'<br /> 信号：<font color="green">' + d.rssi + '</font>' +
				'<br /> 状态：<strong>' + d.checkStatus + '</strong>' +
				'</div>';
			j++;
		});
	}else{
		$.each(devs, function(i, d) {
			var code = displayedCode(d.code);
			if(d.checkStatus === "发现问题" && state === d.checkStatus) {
				inner += '<div class="lock_list_in red "  onclick="mui.openWindow({url:\'test_list.html\', extras:{address:\''+d.address+'\',btName:\''+d.name+'\'}})">' +
					'编号：' + code + '<br /> MAC：' + d.address +
					'<br /> 蓝牙：' + d.name +
					'<br /> 信号：<font color="green">' + d.rssi + '</font>' +
					'<br /> 状态：<strong>' + d.checkStatus + '</strong>' +
					'</div>';
				j++;
			} else if(d.checkStatus === "通过检测" && state === d.checkStatus) {
				inner += '<div class="lock_list_in green "  onclick="mui.openWindow({url:\'test_list.html\', extras:{address:\''+d.address+'\',btName:\''+d.name+'\'}})">' +
					'编号：' + code + '<br /> MAC：' + d.address +
					'<br /> 蓝牙：' + d.name +
					'<br /> 信号：<font color="green">' + d.rssi + '</font>' +
					'<br /> 状态：<strong>' + d.checkStatus + '</strong>' +
					'</div>';
					j++;
			} else if(d.checkStatus === "未检验" && state === d.checkStatus) {
				inner += '<div class="lock_list_in "  onclick="mui.openWindow({url:\'test_list.html\', extras:{address:\''+d.address+'\',btName:\''+d.name+'\'}})">' +
					'编号：' + code + '<br /> MAC：' + d.address +
					'<br /> 蓝牙：' + d.name +
					'<br /> 信号：<font color="green">' + d.rssi + '</font>' +
					'<br /> 状态：<strong>' + d.checkStatus + '</strong>' +
					'</div>';
					j++;
			}
		});
	}
	lockList.html(inner);
	if(j <= 0) {
		three.html(':&nbsp;(&nbsp;没有相应的甄码锁！').addClass("nolock").removeClass("lock_black");
	}
}

mui.plusReady(function() {
	var exit = newExitHandler(true);
	plusReady();
	mui.init({
		beforeback: exit,
	});
});
