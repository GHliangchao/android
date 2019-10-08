// i18n 国际化资源 @since liujun 2018-02-24
(function(w,d){
	function i18n(){}
	
	i18n.prototype = {
		// 读取国际化资源
		readyI18n: function(callback){
			console.log("ready i18n");
			var lang = (jQuery.i18n.browserLang().substring(0, 2));
			if(lang != "zh" && lang != "en"){
				lang = "en";
			}
			jQuery.i18n.properties({
				name: "strings",
				path: "i18n/", //资源文件路径
				mode: "map", // 用Map的方式使用资源文件的值
				language: lang,
				callback: callback
			});
		}
	}
	
	// exports
	w.i18n = new i18n();
})(window, document);