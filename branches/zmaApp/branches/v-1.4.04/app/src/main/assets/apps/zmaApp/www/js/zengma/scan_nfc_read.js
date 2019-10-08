var conf = zengma_conf;
var upre = conf.getUrlPrefix();
var scan = null,flash = false;
var curl = upre + "/app/memb/mpge_goods_verify!authCode.action";
var cacurl = upre + "/app/memb/mpge_goods_verify!checkAuthCode.action";
var onmark = null;

//i18n国际化资源 @since liujun 2018-02-26
//------------------start--------------------
var unknownJs, openFlashJs, closeFlashJs, discernJs, unrecognizedJs;
i18n.readyI18n(function(){
	$("#openPicText").html($.i18n.prop("scan_openPicture"));
	$("#cancelText").html($.i18n.prop("scan_cancelText"));
	$("#flash").html($.i18n.prop("scan_openFlash"));
	unknownJs   = $.i18n.prop("scan_js_unknown");
	openFlashJs = $.i18n.prop("scan_openFlash");
	closeFlashJs= $.i18n.prop("scan_closeFlash");
	discernJs	= $.i18n.prop("scan_js_discern");
	unrecognizedJs = $.i18n.prop("scan_js_unrecognized");
});
//------------------ end --------------------

function plusReady(){
	if(ws||!window.plus||!domready){
		return;
	}
	// liujun 2017-11-13
	// Android处理返回键
	plus.key.addEventListener('backbutton',function(){
		if(scan !== null){
			scan.close();
		}
	},false);
	
	ws=plus.webview.currentWebview();
	// 开始扫描
	ws.addEventListener('show', start, false);
	
	window.addEventListener('ppreload', start);
	window.addEventListener('getnewlist', start);
   
    function start(){
    	scan = new plus.barcode.Barcode('bcid',[plus.barcode.QR,plus.barcode.EAN8,plus.barcode.EAN13],{frameColor:'green',scanbarColor:'green'});
	    scan.onmarked=onmarked;
	    scan.start();
    }
    
    function restart(){
    	start();
    }
    
    onmark = onmarked;
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
        
    	if(scan){
    		scan.close();
    		scan = null;
    	}
    	
    	checkAuthCode(result);
    }
    
    function checkAuthCode(data){
    	plus.nativeUI.showWaiting();
    	$.ajax({
    		url: cacurl,
    		type: "GET",
    		dataType: "JSON",
    		data: {
    			obviousCode: data
    		},
    		success:function(res){
    			plus.nativeUI.closeWaiting();
    			if(res.ret == 0){
    				// 通过扫描到的结果来得到暗码
    		    	// 开始读取数据
    		    	readNFC(data);
    		    	return;
    			}
    			$.dialog({
    				content: res.msg,
        			ok: "确定",
        			okCallback:restart
    			});
    		},
    		error: function(xhr, type, cause){
    			plus.nativeUI.closeWaiting();
    			$.dialog({
        			content: "出错了",
        			ok: "确定",
        			okCallback:restart
        		});
    		}
    	});
    }

    function authCode(obviousCode, hideCode){
    	plus.nativeUI.showWaiting("正在匹配防伪信息");
    	$.ajax({
    		url: curl,
    		type:"GET",
    		dataType:"JSON",
    		data:{
    			obviousCode: obviousCode,
    			hideCode:hideCode
    		},
    		success:function(res) {
    			plus.nativeUI.closeWaiting();
    			if (res.ret == 0) {
    				$.dialog({
            			content: res.msg,
            			ok: "确定",
            			cancel: "取消",
            			okCallback:function(){
            				enterGoodsDetails(res.boutId);
            			},
            			cancelCallback:restart,
            			modal:true
            		});
    				return;
    			}
    			$.dialog({
        			content: res.msg,
        			ok: "确定",
        			okCallback:restart
        		});
    		},
    		error:function(xhr, type, cause){
    			plus.nativeUI.closeWaiting();
    			$.dialog({
        			content: "出错了",
        			ok: "确定",
        			okCallback:restart
        		});
    		}
    	});
    }
    
    function enterGoodsDetails(boutId){
    	console.log("enter goods details page, bout id is " + boutId);
    	var page = plus.webview.getWebviewById("scan_verify_code_details.html");
    	if (page == null) {
    		mui.preload({
    			url: "scan_verify_code_details.html",
    			extras:{
    				boutId:boutId
    			}
    		});
    	} else {
    		mui.fire(page, "ppreload", {
    			boutId: boutId
    		});
    	}
    	
    }

    function readNFC(data){
    	console.log("read NFC data");
    	var options = {cardId:"", format: "txt"};
    	
    	plus.blelock.scanQRcodeNfcRead({
    		success: success,
    		error: error,
    		options: options
    	});
    	
    	function success(res){
    		console.log("读取NFC成功："+JSON.stringify(res));
    		if (res.message == "backclick") {
				console.log("click back botton");
				restart();
				return;
			}
    		// 对二维码里面的内容和NFC里面的内容到服务器认证
    		authCode(data, res.message);
    	}
    	
    	function error(res){
    		console.log("读取NFC失败："+JSON.stringify(res));
    		$.dialog({
    			content: res.message,
    			ok: "确定",
    			okCallback:restart
    		});
    	}
    }
    conf.uiInit();
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

function scanPicture(){
	plus.gallery.pick(function(path) {
		if (mui.os.ios) {
			var img2 = new Image();
			img2.src = path;
			EXIF.getData(img2, function() {
				EXIF.getAllTags(this);
				Orientation = EXIF.getTag(this, 'Orientation');
			});
		}
		plus.nativeUI.showWaiting(discernJs);
		var ts = new Date().getTime();
		plus.barcode.scan(path, function(type, result){
				console.log("scan after:" + (new Date().getTime() - ts));
				plus.nativeUI.closeWaiting();
				//安卓去除两端的双引号
				if(mui.os.android){
					result = result.substring(1, result.length - 1);
				}
				onmark(type, result);
			},function(error){
				plus.nativeUI.closeWaiting();
				mui.toast(unrecognizedJs);
				console.log("scan after:" + (new Date().getTime() - ts));
		})
	}, function(e){
		//mui.toast("获取相册图片失败~");
	})
}

function muiback(){
	if(scan !== null){
		scan.close();
	}
	mui.back();
}

// pzp
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
