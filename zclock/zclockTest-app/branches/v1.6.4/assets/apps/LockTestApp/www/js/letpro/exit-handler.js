function newExitHandler(inHome){
	var i = 0;
	var date = 0;
	
	return function(){
		var login, sum;
		
		if(inHome){
			login = plus.webview.getWebviewById("login.html");
			if(login === null){
				console.log("没有登录页面");
				return true;
			}
		}
		if(i===0){
			date = new Date().getTime();
			plus.nativeUI.toast("连续点击两下退出");
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
