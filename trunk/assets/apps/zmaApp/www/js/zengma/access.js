// access control module
// @since 2016-05
(function(wnd, doc, mui){
	var conf = zengma_conf,
	loginURL = 'login.html', LOG_KEY  = 'logged',
	SID_KEY  = 'sid', SPS_KEY  = 'spword',SLOAD_KEY='oload';
	
	//i18n国际化资源 @since liujun 2018-02-27
	//------------------start--------------------
	var errorMsgJs, okJs, networkErJs;
	i18n.readyI18n(function(){
		errorMsgJs = $.i18n.prop("access_js_error");
		okJs	   = $.i18n.prop("tan_ok");
		networkErJs= $.i18n.prop("assess_js_connectNetwork");
	});
	//------------------ end --------------------
	
	function Access(settings){
		var extras = {}, url = loginURL;
		if(typeof settings === "object"){
			if(settings.extras){
				mui.extend(extras, settings.extras, true);
				delete settings.extras;
			}
			if(settings.redirect){
				extras.redirect = settings.redirect;
				delete settings.redirect;
			}
			if(settings.url){
				url = settings.url;
				delete settings.url;
			}
		}
		this.options = mui.extend({
			errmsg: errorMsgJs,
			closeWaiting: true,
			loginOptions: {url: url, extras: extras}
		}, settings, true);
	}
	
	Access.getMember= getMember;
	Access.isLogged = isLogged;
	Access.setLogged= setLogged;
	Access.clrLogged= clrLogged;
	Access.initLogin= function(user){
		var menu, webv = plus.webview;
		// init-storage
		Access.setLogged(user.loginname, user.spassword,user.load);
		// init-menu
//		menu = webv.getWebviewById(conf.menuId);
//		if(menu != null){
//			mui.fire(menu, "showUser");
//		}
	};
	
	Access.noop = function(){
		// noop
	};
	
	Access.newAjaxErrorHandler = function(settings){
		var access = new Access(settings || {unauthHandler: Access.noop});
		return function(xhr, type, cause){
			access.ajaxErrorHandler(xhr, type, cause);
		}
	};
	
	Access.open = function(options){
		var extras;
		if(typeof options === "string"){
			options = {url: options};
		}
		if(isLogged() == false){
			extras = options.extras || {};
			mui.extend(extras, {redirect: options.url}, true);
			options.extras = extras;
			options.url    = loginURL;
		}
		mui.openWindow(options);
	};
	
	Access.prototype = {
		constructor: Access,
		
		errorHandler: function(){
			$.dialog({content: this.options.errmsg, ok: okJs, modal:true});
		},
		
		unauthHandler: function(){
			var options = this.options;
			mui.openWindow(options.loginOptions);
		},
		
		ajaxErrorHandler: function(xhr, type, cause){
			var options = this.options,
			unauth = options.unauthHandler || this.unauthHandler,
			error  = options.errorHandler  || this.errorHandler;
			
			if(options.closeWaiting){
				plus.nativeUI.closeWaiting();
			}
			if(conf.debug){
				console.error(type + ": " + xhr.status);
			}
			switch(xhr.readyState){
				case 4:
					switch(xhr.status){
						case 0:
							// 网络未打开
							$.dialog({
								content: networkErJs,
								ok : okJs,
								modal: true
							})
							break;
						case 401:
						    window.retains = window.retains || {};
						    window.retains["login_choose.html"] = "login_choose.html";
						    var dpage = plus.webview.getWebviewById("login_choose.html");
						    if (dpage == null) {
								mui.openWindow({url: "login_choose.html",
									extras: {redirect: plus.webview.currentWebview().id,
											isfresh :false}
								});
						    } else {
								mui.fire(dpage, "ppreload", {redirect: plus.webview.currentWebview().id,
									isfresh :false});
						    }
							//unauth.call(this);
							break;
						case 503:
							var dpage= null;
							dpage = plus.webview.getWebviewById("xtwh.html");
							if(dpage==null){
								mui.openWindow({url: "xtwh.html"});
							}else{
								dpage.show();
							}
//							mui.alert("服务器维护中");
							break;
						default:
							error.call(this);
							break;
					}
					break;
				default:
					error.call(this);
					break;
			}
		}
	};
	
	Access.ajaxErrorHandler = Access.newAjaxErrorHandler();
	
	function isLogged(){
		var member = getMember(true);
		return (member!=null&&member!="");
	}
	
	function setLogged(sid, spass,loads){
		var store = plus.storage;
		store.setItem(LOG_KEY, "1");
		if(sid && spass){
			store.setItem(SID_KEY, sid);
			store.setItem(SPS_KEY, spass);
		}
		store.setItem(SLOAD_KEY, loads);
		console.log("login: Ok~");
		return true;
	}
	
	function clrLogged(fsid){
		var store;
		if(plus){
			store = plus.storage;
			store.removeItem(LOG_KEY);
			store.setItem(SLOAD_KEY,"");
			if(true === fsid){
				store.removeItem(SID_KEY);
				store.removeItem(SPS_KEY);
			}
		}
	}
	
	function getMember(flog){
		var store, sid, log;
		if(plus){
			store = plus.storage;
			sid = store.getItem(SID_KEY);
			if(sid != null && true===flog){
				log = store.getItem(LOG_KEY);
				if(log == null){
					return (null);
				}
			}
			return sid;
		}
		return (null);
	}
	
	// exports
	wnd.Access = Access;
	
})(window, document, mui);
