// Lock mode.
// extnl deps: jQuery, mui, lockService, test_base.
// 
// @since 2017-04-17 pzp

(function(w, $, m){
	var MAX = 10, DEF = 1;
	
	function LockBeep(){
		
	}
	
	LockBeep.doBeep = function(settings){
		var ble = plus.blelock;
		var btn = $(settings.target);
		var service = settings.service;
		
		service.beep({
			effect:settings.effect,
			success: ok,
			error: fail
		});

		function ok(result){
			renderBtn(btn, true);
			settings.effect = settings.effect + 1;
			if(settings.effect > settings.effects){
				settings.effect = 1;
				return;
			}
			setTimeout(function(){
				settings.service= w.lockService;
				LockBeep.doBeep(settings);
			}, 2000);
		}
			
		function fail(result){
			renderBtn(btn, false);
			malert("失败");
		}

	};
	LockBeep.prototype = {
		constructor: LockBeep,
		beep: function(btn){
			var self = this;
			var service = w.lockService;
			var pbtns = ["取消", "确定"];
			
			if(!ensureLocksOpen(service)){
				return self;
			}
			mui.prompt("请输入音效种数：", "范围在1~"+MAX+"之间，默认"+DEF, 
			  "蜂鸣音效测试", pbtns, promptHandler, "div");
			return self;
			
			function promptHandler(e){
				var va = $.trim(e.value), ev = DEF;
				var df = (va === "");
				if(!df){
					ev = parseInt(va);
				}
				switch(e.index){
				case 1:
					if(!df){
						if(isNaN(ev) || ((ev+"") !== va && ("+"+ev) !== va)){
							malert("请输入整数");
							return;
						}
					}
					if(ev > MAX || ev < 1){
						malert("输入已超出范围");
						return;
					}
					LockBeep.doBeep({target:btn, service:service, effect: 1, effects: ev});
					break;
				default:
					break;
				}
			}
			
		}
	};
	
	// exports
	w.lockBeep = new LockBeep();

})(window, jQuery, mui);
