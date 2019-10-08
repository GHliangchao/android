// Lock mode.
// extnl deps: jQuery, mui, lockService, test_base.
// 
// @since 2017-04-17 pzp

(function(w, $, m){
	var period_def = 60, period_unit = 15, period_firstDef = 600, period_max = 3600;
	
	function LockMode(){
		
	}

	LockMode.config = function(settings){
		var ble = plus.blelock;
		var btn = $(settings.target);
		var service = settings.service;
		
		if(settings.period === undefined){
			settings.period = ble.consts.UNDEFINED.value;
		}
		service.setLockMode({
			mode: settings.mode,
			period: settings.period,
			success: ok,
			error: fail
		});

		function ok(result){
			renderBtn(btn, true);
			if(settings.mode === 0){
				saveOpLogger(12,result.result,'N',"关闭升锁延迟");
			}else if(settings.mode === 1){
				saveOpLogger(12,result.result,'N',"开启升锁延迟:设置为"+settings.period+"秒");
			}
			
		}
			
		function fail(result){
			renderBtn(btn, false);
			malert(errmsg(result));
			saveOpLogger(12,result.error,'U',result.message);
		}

	};
	LockMode.configSecond = function(settings){
		var ble = plus.blelock;
		var btn = $(settings.target);
		var service = settings.service;
		
		if(settings.period === undefined){
			settings.period = ble.consts.UNDEFINED.value;
		}
		service.setFirstAutoLockDelayPostManuUnlock({
			delay: settings.period,
			success: ok,
			error: fail
		});

		function ok(result){
			renderBtn(btn, true);
			saveOpLogger(13,result.result,'N',"手动降锁首次自动升锁延迟:设置为"+settings.period+"秒");
		}
			
		function fail(result){
			renderBtn(btn, false);
			malert(errmsg(result));
			saveOpLogger(13,result.error,'U',"首次自动升锁失败");
		}

	};

	LockMode.prototype = {
		constructor: LockMode,
		autolock: function(btn){
			var self = this;
			var service = w.lockService;
			var pbtns = ["取消", "确定"];
			
			if(!ensureLocksOpen(service)){
				return self;
			}
			
			mui.prompt("请输入自动升锁周期：", (period_unit+"秒倍数，默认"+period_def+"秒"),
			"升锁模式设置", pbtns, promptHandler, "div");
			return self;

			function promptHandler(e){
				var p;
				var ev = e.value;
				switch(e.index){
				case 1:
					if($.trim(e.value).length == 0){
						p = period_def;
					}else{
						p = parseInt(e.value);
						if(isNaN(ev)){
							malert("请输入"+period_unit+"秒的倍数");
							return;
						}
						if(ev > period_max){
							malert("输入的数已超出上限(上限为"+period_max+"s)");
							return;
						}
						if(p <= 0 || (p % period_unit) !== 0){
							malert("请输入"+period_unit+"秒的倍数");
							return;
						}
						if(String(ev).indexOf(".")>-1){
							malert("请输入整数");
							return;
						}
					}
					LockMode.config({target: btn, service:service, mode: 1, period: p});
					break;
				default:
					break;
				}
			}
			
		},
		firstAutolock: function(){
			var btn = $("#firstAutolock");
			var self = this;
			var service = w.lockService;
			var pbtns = ["取消", "确定"];
			
			if(!ensureLocksOpen(service)){
				return self;
			}
			mui.prompt("请输入手动降锁后自动升锁延迟：", (period_unit+"秒倍数，默认"+period_firstDef+"秒"),
			"首次自动升锁设置", pbtns, firstAutoHandler, "div");
			return self;
			
			function firstAutoHandler(e){
				var p;
				var ev = e.value;
				switch(e.index){
				case 1:
					if($.trim(e.value).length == 0){
						p = period_firstDef;
					}else{
						p = parseInt(e.value);
						if(isNaN(ev)){
							malert("请输入"+period_unit+"秒的倍数");
							return;
						}
						if(ev > period_max){
							malert("输入的数已超出上限(上限为"+period_max+"s)");
							return;
						}
						if(p <= 0 || (p % period_unit) !== 0){
							malert("请输入"+period_unit+"秒的倍数");
							return;
						}
						if(String(ev).indexOf(".")>-1){
							malert("请输入整数");
							return;
						}
					}
					LockMode.configSecond({target: btn, service:service, period: p});
					break;
				default:
					break;
				}
			}
			
		},
		manualock: function(btn){
			var self = this;
			var service = w.lockService;
			
			if(!ensureLocksOpen(service)){
				return self;
			}
			LockMode.config({target: btn, service:service, mode: 0});
			return self;
		}
	};
	
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
	w.lockMode = new LockMode();

})(window, jQuery, mui);
