var conf = letpro_conf;
var upre = conf.getUrlPrefix();

mui.init({});

function malert(msg, tit){
	mui.alert(msg, (tit||''), '', null, 'div');
}

function errmsg(result){
	var msg = result.message ? "，错误消息：" + result.message : "";
	return ("错误代码：" + result.error + msg);
}

function renderBtn(btn, ok){
	if(ok){
		btn.removeClass("redbtn");
		btn.addClass("green");
		return btn;
	}
	btn.removeClass("green");
	btn.addClass("redbtn");
	return btn;
}

function ensureLocksOpen(service){
	var w = window;
	var s = (service || w.lockService || null);
			
	if(s == null || !s.open){
		malert("请先连接地锁");
		return false;
	}
	return true;
}
