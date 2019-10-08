var conf = zengma_conf;
var upre = conf.getUrlPrefix();
var scan = null,flash = false;

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
    conf.uiInit();
}

function onmarked( type, result) {
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
    
    //分析扫描结果
    var reg = /^https?:\/\//;
    if (reg.test(result)) {
    	plus.runtime.openURL(result);
    	muiback();
    } else {
    	if(scan){
    		scan.close();
    		scan = null;
    	}
    	var dpage = plus.webview.getWebviewById("scan_result.html");
    	if (dpage == null) {
    		dpage = mui.openWindow({
    			url: "scan_result.html",
    			extras:{
    				info:result
    			}
    		})
    	} else {
    		mui.fire(dpage, 'ppreload',{info:result});
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
				onmarked(type, result);
			},function(error){
				plus.nativeUI.closeWaiting();
				mui.toast(unrecognizedJs);
				console.log("scan after:" + (new Date().getTime() - ts) + "error:" + error.me);
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
