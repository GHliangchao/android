function newExitHandler(){
	var i = 0;
	var date = 0;
	
	//i18n国际化资源 @since liujun 2018-02-27
	//------------------start--------------------
	var showWaitJs;
	i18n.readyI18n(function(){
		showWaitJs = $.i18n.prop("exit_handler_toastInfo");
	});
	//------------------ end --------------------

	return function(){
		var sum;
		if(i===0){
			date = new Date().getTime();
			plus.nativeUI.toast(showWaitJs);
		}
		i++;
		console.log("有登录页面");
		if(i === 2){
			sum = new Date().getTime() - date;
			if(sum <= 2000){
				plus.runtime.quit();
			}else{
				i=0;
			}
		}
		return false;
	};
}
