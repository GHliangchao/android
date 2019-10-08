// RAM testing.
// extnl deps: jQuery, mui, lockService.
// 
// @since 2017-02-22 pzp
var upre = conf.getUrlPrefix();
(function(w, $, m){
	var ramTest = null;
	
	function getRamTest(){
		if(ramTest != null){
			return ramTest;
		}
		ramTest = new RAMTest();
		return ramTest;
	}

	function RAMTest(){

	}
	RAMTest.prototype = {
		constructor: RAMTest,
		read: function(btn){
			var self = this;
			var service = w.lockService;
			var addr, count;
			
			if(!ensureLocksOpen(service)){
				return self;
			}
			btn = $(btn);

			// test - angular sensor
			addr = 12;
			count= 3;
			service.readRAM({
				addr: addr,
				count: count,
				success: ok,
				error: fail
			});
			return self;
			
			function ok(result){
				renderBtn(btn, true);
				saveOpLogger(9,0,'N',result.message);
			}
			
			function fail(result){
				renderBtn(btn, false);
				malert(errmsg(result));
				saveOpLogger(9,-1,'U',result.message);
			}
			
		},
		write: function(btn){
			var self = this;
			var service = w.lockService;
			var addr, value;
			
			if(!ensureLocksOpen(service)){
				return self;
			}
			btn = $(btn);

			// test - angular sample cycle
			addr = 18;
			value= "FA000000";
			service.writeRAM({
				addr: addr,
				value: value,
				success: ok,
				error: fail
			});
			return self;
			
			function ok(result){
				renderBtn(btn, true);
				saveOpLogger(10,0,'N',result.message);
			}
			
			function fail(result){
				renderBtn(btn, false);
				malert(errmsg(result));
				saveOpLogger(10,result.value,'U',result.message);
			}
			
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
	w.ramTest = getRamTest();

})(window, jQuery, mui);
