// mgca plugin,used to access ble key
// @since 2017-12-20 liujun
(function(w,d){
	var names = "mgca",
		conf  = zengma_conf,
		prefix= conf.getUrlPrefix();
	
	d.addEventListener("plusready", ready, true);
	
	function ready(){
		B = plus.bridge;
		console.log("mgca: init start");
		function mgca(){};
		 
		mgca.prototype = {
			connect: function(Argus1,successCallback, errorCallback){
				console.log("mgca --> conect()");
				var success = typeof successCallback !== 'function' ? null : function(args) {
					successCallback(args);
				},
				fail = typeof errorCallback !== 'function' ? null : function(code) {
					errorCallback(code);
				};
				callbackID = B.callbackId(success, fail);
				//  得到当前的浏览器语言环境 @since liujun 2018-03-02
				var lang = (jQuery.i18n.browserLang().substring(0, 2));
				if(lang != "zh" && lang != "en"){
					lang = "en";
				}
				return B.exec(names, "connect", [callbackID, Argus1, lang]);
			},
			sign: function(Argus, successCallback, errorCallback) {
				console.log("mgca --> sign()");
				var success = typeof successCallback !== 'function' ? null : function(args) {
					successCallback(args);
				},
				fail = typeof errorCallback !== 'function' ? null : function(code) {
					errorCallback(code);
				};
				callbackID = B.callbackId(success, fail);
				//  得到当前的浏览器语言环境 @since liujun 2018-03-02
				var lang = (jQuery.i18n.browserLang().substring(0, 2));
				if(lang != "zh" && lang != "en"){
					lang = "en";
				}
				return B.exec(names, "sign", [callbackID, Argus, lang]);
			}
		};
		
		// exports
		w.plus.mgca = new mgca();
	}
	
})(window, document);