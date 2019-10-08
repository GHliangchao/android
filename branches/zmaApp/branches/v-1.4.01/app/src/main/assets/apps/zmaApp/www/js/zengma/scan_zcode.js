var conf = zengma_conf,
	upre = conf.getUrlPrefix(),
	scan = null,
	flash = false,
	urlLength = "https://stest.idcode.org.cn/?code=i.86.330104.1001/10.46101000.zcode-01/".length;

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var unknownJs, noDeviceJs, connectKeyJs, loadingJs,openBluetoothJs,
	openFlashJs, closeFlashJs, operatingJs, readInfoJs;
i18n.readyI18n(function(){
	$("#cancelText").html($.i18n.prop("scanzcode_cancelText"));
	$("#flash").html($.i18n.prop("scanzcode_openFlash"));
	// javaScript
	unknownJs    = $.i18n.prop("scanzocde_js_unknown");
	noDeviceJs   = $.i18n.prop("scanzocde_js_noDevice");
	connectKeyJs = $.i18n.prop("scanzocde_js_connectKey");
	loadingJs	 = $.i18n.prop("scanzocde_js_loading");
	openFlashJs	 = $.i18n.prop("scanzcode_openFlash");
	closeFlashJs = $.i18n.prop("scanzcode_closeFlash");
	operatingJs  = $.i18n.prop("scanzcode_operating");
	readInfoJs   = $.i18n.prop("scanzcode_readyInfo");
	openBluetoothJs = $.i18n.prop("public_ukey_openBluetooth");
});
//------------------ end --------------------

function plusReady(){
	/*if(ws||!window.plus||!domready){
		return;
	}*/
	var surl = upre + "/app/memb/mpge_zcode!checkZcode.action";
	var qurl = upre + "/app/memb/membca!selcaterminal.action";
	var mgca = plus.mgca;
	// liujun 2017-11-13
	// Android处理返回键
	plus.key.addEventListener('backbutton', function(){
		if(scan !== null){
			scan.cancel();
			scan = null;
		}
	},false);
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "scan_zcode.html"}
	});
	// 获取窗口对象
	var ws = plus.webview.currentWebview();
	// 开始扫描
	ws.addEventListener('show', start, false);
	window.addEventListener('ppreload', start, false);
   	window.addEventListener('getnewlist', start, false);
   	$("#cancelText")[0].addEventListener("tap", function(){mui.back();}, false);
   	
    function start(){
    	if(conf.debug){console.log("show start()");}
    	if(scan != null){
    	    if(conf.debug){console.log("scan is not null");}
    		scan.start();
    		return;
    	}
    	scan = new plus.barcode.Barcode('bcid',[plus.barcode.QR,plus.barcode.EAN8,plus.barcode.EAN13],{frameColor:'green',scanbarColor:'green'});
	    scan.onmarked=onmarked;
	    scan.start();
    }
    
    function onmarked(type, result) {
	    var text = unknownJs;
	    switch(type){
	        case plus.barcode.QR:
	        text = 'QR: ';
	        break;
	        case plus.barcode.EAN13:
	        text = 'EAN13: ';
	        break;
	        case plus.barcode.EAN8:
	        text = 'EAN8: ';
	        break;
	    }
	    result = result.replace(/\n/g, '');
	    if (conf.debug) {
	    	console.log("result: " + result);
	    }
	    var urlLength = result.length;
	    result = result.substring((urlLength - 13));
	    console.log("scan zcode is "+ result+", result length is "+ urlLength);
	    // 读取证书终端序列号 --> 连接U Key --> 输入U Key密码 --> 密码正确，显示甄码链
	    openBluetooth(function(){queryCaTerminal(result)});
	}
    
    function queryCaTerminal(result){
    	try{
    		mui.ajax(qurl, {
    			dataType: "json",
    			type:"GET",
    			success: function(info){
    				if (conf.debug) {
	    				console.log(JSON.stringify(info));
	    			}
    				if(info.ret == 0){
    					connectKey(info.msg, result);
    					return;
    				}
    				scan.start();
    				mui.toast(noDeviceJs);
    			}, 
    			error: function(xhr, type, cause){
	    			scan.cancel();
	    			ajaxerror(xhr, type, cause);
	    		}
    		});
    	}catch (e) {
    		scan.start();
    		console.error(e.message);
    	}
    }
    
    // cn = "650279901000121"
    function connectKey(cn, result){
    	plus.nativeUI.showWaiting(connectKeyJs);
		mgca.connect(cn,
		function(rep){
		    if(conf.debug){console.log(JSON.stringify(rep));}
			var message=rep.message;
			if(rep.result==0){
				plus.nativeUI.closeWaiting();
				signUp(result);
			}else{
				plus.nativeUI.closeWaiting();
				scan.start();
				mui.toast(message);
				return;
			}
		}, function(err){
			plus.nativeUI.closeWaiting();
			scan.start();
			mui.toast(err);
			return;
		});
    }
    
    function signUp(result){
    	var data = "<?xml version=\"1.0\" encoding=\"utf-8\"?><T><D><M><k>"+operatingJs+"：</k><v>"+readInfoJs+"</v></M></D></T>";
		mgca.sign(data,
			function(nrep){
			    if(conf.debug){console.log(JSON.stringify(nrep));}
				var mes=nrep.message;
				if(nrep.result==0){
					plus.nativeUI.closeWaiting();
					checkZcode(result);
				}else{
					plus.nativeUI.closeWaiting();
					mui.toast(mes);
					scan.start();
					return;
				}
			}, function(err){
			    if(conf.debug){console.log(JSON.stringify(err));}
				plus.nativeUI.closeWaiting();
				scan.start();
				mui.toast(err);
				return;
			}
		);
	}
    
    function checkZcode(result){
    	plus.nativeUI.showWaiting(loadingJs);
    	try{
    		mui.ajax(surl,{
	    		data: {
	    			result: result
	    		},
	    		dataType: "json",
	    		type: "POST",
	    		success: function(info){
	    			if (conf.debug) {
	    				console.log(JSON.stringify(info));
	    			}
	    			if (info.ret == 2) {
	    				plus.nativeUI.closeWaiting();
	    				mui.toast(info.msg);
	    				setTimeout(function(){
	    					scan.start();
	    				}, 1000);
	    			} else {
	    				plus.nativeUI.closeWaiting();
	    				var dpage = plus.webview.getWebviewById("zmchain.html");
	    				console.log("open id is "+ ws.id);
	    				if (dpage == null) {
	    					mui.preload({
	    						url: "zmchain.html",
	    						extras: {
	    							appid: info.appid,
	    							zmid: info.zcodeid,
	    							openid: ws.id
	    						},
	    						styles: {
					                popGesture: 'none' 
					            }
	    					});
	    				} else {
	    					mui.fire(dpage, "ppreload", {appid:info.appid, zmid:info.zcodeid, openid:ws.id});
	    				}
	    				setTimeout(function(){
	    					scan.cancel();
	    				}, 500);
	    			}
	    		},
	    		error: function(xhr, type, cause){
	    			plus.nativeUI.closeWaiting();
	    			scan.cancel();
	    			ajaxerror(xhr, type, cause);
	    		}
	    	});
    	} catch (e) {
    		plus.nativeUI.closeWaiting();
    		scan.start();
    		console.error(e.message);
    	}
    	
    }
}

function setFlash() {
	var buttom = $("#flash");
	if(flash){
		buttom.html(openFlashJs);
		scan.setFlash(false);
		flash = false;
	}else{
		buttom.html(closeFlashJs);
		scan.setFlash(true);
		flash = true;
	}
}

/*function muiback(){
	if(scan !== null){
		scan.cancel();
	}
	mui.back();
}*/

function openBluetooth(successCB, errorCB){
	if(!$.isFunction(successCB)){
		$.dialog({
			content:parameterErJs,
			ok:okJs
		});
		return;
	}
	if(mui.os.android){
		var main, BluetoothAdapter, BAdapter;
		main = plus.android.runtimeMainActivity();
		BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
		BAdapter = BluetoothAdapter.getDefaultAdapter();
		if(!BAdapter.isEnabled()){
			open();
			function open(){
				BAdapter.enable();
				plus.nativeUI.showWaiting(openBluetoothJs);
				setTimeout(function(){
					if(!BAdapter.isEnabled()){
						plus.nativeUI.closeWaiting();
						mui.toast(openBluErJs);
						if($.isFunction(errorCB)){
							errorCB();
						}
					} else {
						plus.nativeUI.closeWaiting();
						successCB();
					}
				},3000);
			}
		} else {
			successCB();
		}
	} else {
		successCB();
	}
}

mui.init({
	/*beforeback:function(){
		if(conf.debug){console.log("backbefore: sacn is " +scan);}
		if(scan !== null){
			scan.cancel();
		}
	}*/
});
mui.plusReady(function() {
	conf.uiInit();
	plusReady();
});

/*// pzp
var domready = false, ws=null;
if(window.plus){
	plusReady();
}else{
	document.addEventListener('plusready', plusReady, false);
}
//监听DOMContentLoaded事件
document.addEventListener('DOMContentLoaded', function(){
	domready=true;
	plusReady();
}, false);

mui.init();
*/