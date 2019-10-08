$(function($){
	var $body;
	var dialogIdNumber	= 0;
	var dialogZIndex		= 100;
	var messageIdNumber = 0;
	var delayms					= 300;
	var conf = zengma_conf,
	upre = conf.getUrlPrefix();
	
	//i18n国际化资源 @since liujun 2018-02-27
	//------------------start--------------------
	var titlePromptJs;
	i18n.readyI18n(function(){
		titlePromptJs = $.i18n.prop("comm_dialog_titleText");
	});
	//------------------ end --------------------
	
	$.dialog = function (settings) {
		var dialogId, ts = new Date().getTime();
		
		if (settings.id != null) {
			dialogId = settings.id;
		} else {
			dialogId = "dialog" + dialogIdNumber;
			dialogIdNumber ++;
		}
		if (settings.title == null) {
			settings.title = titlePromptJs;
		}
		if (settings.content == null) {
			settings.content = "";
		}
		if (settings.width == null || settings.width == "auto") {
			settings.width = 320;
		}
		if (settings.height == null) {
			settings.height = "auto";
		}
		
		if ($body == null) {
			$body = $("body");
		}
		
		var dialogHtml = "";
		dialogHtml +='<div id="'+dialogId +'">';
		dialogHtml +='<div class="black"><div class="tan">';
		dialogHtml +='<div class="title"><b>'+settings.title+'</b></div>';
		dialogHtml +='<div class="content">'+settings.content+'</div>';
		if (settings.ok != null&&settings.cancel==null) {
			dialogHtml +='<div class="action"><div class="btn1 orange" id="dialogOk' + dialogId + '">'+settings.ok+'</div></div>';
		}
		if (settings.ok != null&&settings.cancel != null) {
			dialogHtml +='<div class="action"><div class="btn2 right_line orange" style="background: none;" id="dialogOk' + dialogId + '">'+settings.ok+'</div><div class="btn2 gray" id="dialogCancel' + dialogId + '">'+settings.cancel+'</div><div class="clear"></div></div>';
		}	
		dialogHtml+='<div class="clear"></div></div></div></div>';
		$body.prepend(dialogHtml);
	
		
		var $dialog = $("#" + dialogId);
		var $dialogOk = $("#dialogOk" + dialogId);
		var $dialogCancel = $("#dialogCancel" + dialogId);
		
		
		function dialogClose() {
			$dialog.remove();
		}
		
		if (settings.autoCloseTime != null) {
			setTimeout(dialogClose, settings.autoCloseTime);
		}
				
		$dialogOk.click( function() {
			var te = new Date().getTime();
			if(te - ts <= delayms){
				return false;
			}
			if ($.isFunction(settings.okCallback)) {
				if (settings.okCallback.apply() != false) {
					dialogClose();
				}
			} else {
				dialogClose();
			}
		});
		
		$dialogCancel.click( function() {
			var te = new Date().getTime();
			if(te - ts <= delayms){
				return false;
			}
			if ($.isFunction(settings.cancelCallback)) {
				if (settings.cancelCallback.apply() != false) {
					dialogClose();
				}
			} else {
				dialogClose();
			}
		});
			
		$dialog.keypress(function(event) {
			if(event.keyCode == 13) {
				if ($.isFunction(settings.okCallback)) {
					if (settings.okCallback.apply() != false) {
						dialogClose();
					}
				} else {
					dialogClose();
				}
			}  
		});
		
		return dialogId;
	}
	
	$.addDedialog = function (settings) {
		var dialogId, ts = new Date().getTime();
		
		if (settings.id != null) {
			dialogId = settings.id;
		} else {
			dialogId = "dialog" + dialogIdNumber;
			dialogIdNumber ++;
		}
		if (settings.content == null) {
			settings.content = "";
		}
		if (settings.width == null || settings.width == "auto") {
			settings.width = 320;
		}
		if (settings.height == null) {
			settings.height = "auto";
		}
		
		if ($body == null) {
			$body = $("body");
		}
		
		var dialogHtml = "";
		dialogHtml +='<div id="'+dialogId +'">';
		dialogHtml +='<div class="black"></div><div class="tanchu">';
	
		dialogHtml +='<div class="content">'+settings.content+'：<input type="text" id="numd" /></div> <div class="tan_action">';
		dialogHtml +='<div class="action"><div class="btn_a" id="dialogOk' + dialogId + '">'+settings.ok+'</div><div class="btn_b" style="color:#505050" id="dialogCancel' + dialogId + '">'+settings.cancel+'</div></div>';	
		dialogHtml+='</div></div>';
		$body.prepend(dialogHtml);
	
		
		var $dialog = $("#" + dialogId);
		var $dialogOk = $("#dialogOk" + dialogId);
		var $dialogCancel = $("#dialogCancel" + dialogId);
		
		
		function dialogClose() {
			$dialog.remove();
		}
		
				
		$dialogOk.click( function() {
			var te = new Date().getTime();
			if(te - ts <= delayms){
				return false;
			}
			var num=document.getElementById("numd").value;
			dialogClose();
			if($.trim(num)==""){
				$.dialog({content: "请输入快递单号", ok: "确定",modal:true});
			}else if(parseInt(num)!=num){
				$.message({content:"请输入正确的快递单号"});
			}else{
//				var oid=document.getElementById("orderId").value;
				var sid=document.getElementById("storeId").value;
				var oid=settings.orderId;
				$.ajax({
				url: upre+"/app/memb/store/order!checkSend.htm",
				data: {"id":oid,"storeId":sid,"trackno":num},
				type: "POST",
				dataType: "json",
				cache: false,
				success: function(data) {	
					if(data.ret == 0){
						var webv=plus.webview.currentWebview();
							mui.fire(webv,"getnewlist");
							//mui.preload({url:'store_order.html'});
						}else{
							$.dialog({content: data.msg, ok: "确定",modal:true});
						}
				},
				error:function(xhr,type, cause){
					$.dialog({content: "出错啦~", ok: "确定",modal:true});
				}
			});
			}
		});
		
		$dialogCancel.click( function() {
			var te = new Date().getTime();
			if(te - ts <= delayms){
				return false;
			}
			if ($.isFunction(settings.cancelCallback)) {
				if (settings.cancelCallback.apply() != false) {
					dialogClose();
				}
			} else {
				dialogClose();
			}
		});
		
		return dialogId;
	}
	
	$.addAgedialog = function (settings) {
		var dialogId, ts = new Date().getTime();
		
		if (settings.id != null) {
			dialogId = settings.id;
		} else {
			dialogId = "dialog" + dialogIdNumber;
			dialogIdNumber ++;
		}
		if (settings.content == null) {
			settings.content = "";
		}
		if (settings.width == null || settings.width == "auto") {
			settings.width = 320;
		}
		if (settings.height == null) {
			settings.height = "auto";
		}
		
		if ($body == null) {
			$body = $("body");
		}
		
		var dialogHtml = "";
		dialogHtml +='<div id="'+dialogId +'">';
		dialogHtml +='<div class="black"></div><div class="tanchu">';
	
		dialogHtml +='<div class="content" style="padding-bottom:1rem">'+settings.content+'：<input type="text" id="phone" placeholder="请输入手机号"/><div class="clear"></div>'+
		'<font style="color:#fff">三</font>代收人姓名：<input type="text" id="dpname" placeholder="请输入姓名"/><div class="clear"></div></div><div class="clear"></div><div class="tan_action">';
		dialogHtml +='<div class="action" style="position:relative"><div class="btn_a" id="dialogOk' + dialogId + '">'+settings.ok+'</div><div class="btn_b" style="color:#505050" id="dialogCancel' + dialogId + '">'+settings.cancel+'</div></div>';	
		dialogHtml+='</div></div>';
		$body.prepend(dialogHtml);
	
		
		var $dialog = $("#" + dialogId);
		var $dialogOk = $("#dialogOk" + dialogId);
		var $dialogCancel = $("#dialogCancel" + dialogId);
		
		
		function dialogClose() {
			$dialog.remove();
		}
		
				
		$dialogOk.click( function() {
			var te = new Date().getTime();
			if(te - ts <= delayms){
				return false;
			}
			var phone=document.getElementById("phone").value;
			var dpname=document.getElementById("dpname").value;
			var reg = /^0?1[3|4|5|7|8][0-9]\d{8}$/;
			dialogClose();
			if($.trim(phone)==""){
				$.dialog({content: "请输入代收人手机号码", ok: "确定",modal:true});
			}else if($.trim(dpname)==""){
				$.dialog({content: "请输入代收人姓名", ok: "确定",modal:true});
			}else if(!reg.test(phone)){
				$.dialog({content: "请输入正确的手机号码", ok: "确定",modal:true});
			}else{
				var oid=document.getElementById("orderId").value;
				$.ajax({
				url: upre+"/app/memb/order!checkAgentOrder.htm",
				data: {"id":oid,"agent":phone,"dpname":dpname},
				type: "POST",
				dataType: "json",
				cache: false,
				success: function(data) {	
					if (data.status == "success") {
						$.dialog({content: "<div style='width:17rem;margin-left:1rem;height:6rem'>提货号已发送到代收人手机上，注意查看。验货无异议平台将在24小时后自动向卖家付款</div>", ok: "确定",modal:true,okCallback: batchUp});
						function batchUp(){
							var webv=plus.webview.currentWebview();
							mui.fire(webv,"getnewlist");
							//var url=location.href;
							//window.location.href=url;	
						}
					}else{
						$.dialog({content: data.message, ok: "确定",modal:true});
					}
				},
				error:function(xhr,type, cause){
					$.dialog({content: "出错啦~", ok: "确定",modal:true});
				}
			});
			}
		});
		
		$dialogCancel.click( function() {
			var te = new Date().getTime();
			if(te - ts <= delayms){
				return false;
			}
			if ($.isFunction(settings.cancelCallback)) {
				if (settings.cancelCallback.apply() != false) {
					dialogClose();
				}
			} else {
				dialogClose();
			}
		});
		
		return dialogId;
	}
	
	$.addDesdialog = function (settings) {
		var dialogId, ts = new Date().getTime();
		
		if (settings.id != null) {
			dialogId = settings.id;
		} else {
			dialogId = "dialog" + dialogIdNumber;
			dialogIdNumber ++;
		}
		if (settings.content == null) {
			settings.content = "";
		}
		if (settings.width == null || settings.width == "auto") {
			settings.width = 320;
		}
		if (settings.height == null) {
			settings.height = "auto";
		}
		
		if ($body == null) {
			$body = $("body");
		}
		
		var dialogHtml = "";
		dialogHtml +='<div id="'+dialogId +'">';
		dialogHtml +='<div class="black"></div><div class="tanchu">';
	
		dialogHtml +='<div class="content">'+settings.content+'：<input type="text" id="numd" /></div><div class="clear"></div> <div class="tan_action">';
		dialogHtml +='<div class="action"><div class="btn_a" id="dialogOk' + dialogId + '">'+settings.ok+'</div><div class="btn_b" style="color:#505050" id="dialogCancel' + dialogId + '">'+settings.cancel+'</div></div>';	
		dialogHtml+='</div></div>';
		$body.prepend(dialogHtml);
	
		
		var $dialog = $("#" + dialogId);
		var $dialogOk = $("#dialogOk" + dialogId);
		var $dialogCancel = $("#dialogCancel" + dialogId);
		
		
		function dialogClose() {
			$dialog.remove();
		}
		
				
		$dialogOk.click( function() {
			var te = new Date().getTime();
			if(te - ts <= delayms){
				return false;
			}
			var num=document.getElementById("numd").value;
			dialogClose();
			if($.trim(num)==""){
				$.dialog({content: "请输入快递单号和快递公司", ok: "确定",modal:true});
			}else{
				var oid=document.getElementById("orderId").value;
				$.ajax({
				url: "/memb/dstore/dorder!checkSend.htm",
				data: {"id":oid,"trackno":num},
				type: "POST",
				dataType: "json",
				cache: false,
				success: function(data) {	
					if (data.status == "success") {
						var webv=plus.webview.currentWebview();
							mui.fire(webv,"getnewlist");
						//var url=location.href;
						//window.location.href=url;		
					}else{
						$.dialog({content: data.message, ok: "确定",modal:true});
					}
				},
				error:function(xhr,type, cause){
					$.dialog({content: "出错啦~", ok: "确定",modal:true});
				}
			});
			}
		});
		
		$dialogCancel.click( function() {
			var te = new Date().getTime();
			if(te - ts <= delayms){
				return false;
			}
			if ($.isFunction(settings.cancelCallback)) {
				if (settings.cancelCallback.apply() != false) {
					dialogClose();
				}
			} else {
				dialogClose();
			}
		});
		
		return dialogId;
	}
	
	$.closeDialog = function (dialogId) {
		var $dialog = $("#" + dialogId);
		$dialog.remove();
	}
});