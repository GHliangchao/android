// popup module
// @since 2016-05
(function(window, mui){
	
	/* Create a Popup.
	 * 
	 * @param settings {title, content, cfmAction, cclAction}
	 */
	function Popup(settings){
		var wrapper = $(".black"), cfm, ccl,
		title, content, options, action, close,cfmt,cclt,
		btns, btn;
		
		close = this.close;
		this.options = options = mui.extend({
			title:     "注意",    content:   "", 
			cfmt:"",cclt:"",
			cfmAction: close, cclAction: close,
			extras:    {}
		}, settings, true);
		this.cweb    = plus.webview.currentWebview();
		this.mask    = $("#mask");
		
		title = $("div.title", wrapper);
		title.html(options.title);
		content= $("div.content", wrapper);
		content.html(options.content);
		if(options.cfmt!=""){
			cfmt=$("#tanchuconfirm", wrapper);
			cfmt.html(options.cfmt);
		}
		if(options.cclt!=""){
			cclt=$("#tanchucancle", wrapper);
			cclt.html(options.cclt);
		}
		btn = $("div.tan_action", wrapper);
		if(options.cclAction == close){
			this.cfm = $(".tan_action_1", btn);
			cfm = this.cfm[0];
			$("#tanchucancle").hide();
			$("#tanchuconfirm").hide();
		}else{
			$(".tan_action_1").hide();
			$("#tanchucancle").show();
			$("#tanchuconfirm").show();
			btns = $("div.tan_action", wrapper);
			this.ccl   = $("#tanchucancle", btns);
			this.cfm   = $("#tanchuconfirm", btns);
			btn.hide();
			btns.show();
			if(options.cclCap){
				this.ccl.html(options.cclCap);
			}
			cfm = this.cfm[0];
			ccl = this.ccl[0];
			action = this.wrap(options.cclAction);
			ccl.addEventListener("tap", action, false);
		}
		if(options.cfmCap){
			this.cfm.html(options.cfmCap);
		}
		action = this.wrap(options.cfmAction);
		cfm.addEventListener("tap", action, false);
	}
	Popup.prototype = {
		constructor: Popup,
		show: function(){
			var self = this;
			if(self.hasccl){
				self.ccl.show();
			}
			return self;
		},
		close: function(){
			this.cweb.close("none");
			return this;
		},
		wrap: function(action){
			var self = this, 
			cweb  = self.cweb,
			opener= cweb.opener();
			
			return (function(e){
				var fire, options = self.options;
				if(action != self.close){
					fire = (typeof action === "string");
					if(fire || $.isFunction(action)){
						console.log("popup-action: begin");
						if(fire){
							mui.fire(opener, action, 
								{extras: options.extras}
							);
						}else{
							action(e);
						}
						console.log("popup-action: end");
					}
				}
				self.close();
			});
		}
	}
	
	// exports
	window.Popup = Popup;

})(window, mui);
