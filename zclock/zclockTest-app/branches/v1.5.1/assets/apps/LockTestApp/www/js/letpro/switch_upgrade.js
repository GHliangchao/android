// switch to upgrade mode.
// extnl deps: postToUpgradeMode(result, btn) - optional
// @since 2017-02-21 pzp
// 
(function(w, $, m){

	function swtToUpgradeMode(btn){
		var s = lockService;

		if(!ensureLocksOpen(s)){
			return;
		}
		
		btn = $(btn);
		s.switchUpgrade({success: ok, error: fail});

		function ok(result){
			var swtResult = result.result;
			if(swtResult === 0x01){
				renderBtn(btn, true);
				complete(result);
				saveOpLogger(11,swtResult,'N',result.message);
			}else if(swtResult === 0x00){
				renderBtn(btn, false);
				complete(result);
				saveOpLogger(11,swtResult,'U',result.message);
			}
		}
		
		function fail(result){
			renderBtn(btn, false);
			complete(result);
			saveOpLogger(11,result.error,'U',"切换失败");
		}

		function complete(result){
			if(typeof w.postToUpgradeMode === "function"){
				w.postToUpgradeMode(result, btn);
			}
		}

	}
	
	//保存操作地锁的日志
	function saveOpLogger(type,content,fault,remarks){
		var saveOpLogger = upre + "/app/pro/saveLockLog.do",
			addr = mui.currentWebview.address;
		var myDate = new Date();
		mui.ajax(saveOpLogger,{
	  		type: "POST",
			dataType: "json",
			data: { 
				mac: addr,
				type: type,
				content: content,
				opTime: myDate.Format("yyyy-MM-dd HH:mm:ss"),
				fault: fault,
				remarks: remarks
			},
			success :function(data){
				if(data.saveLockOpLog){
				}
			},
			error : function(data){
			}
		});
	}

	// exports
	w.swtToUpgradeMode = swtToUpgradeMode;

})(window, jQuery, mui);
