// Stability testing.
// extnl deps: jQuery, mui, lockService.
// 
// @since 2017-02-21 pzp

(function(w, $, m){
	var stabilityTest = null;
	
	function getStabTest(){
		if(stabilityTest != null){
			return stabilityTest;
		}
		stabilityTest = new StabilityTest();
		return stabilityTest;
	}

	function StabilityTest(){
		this._intva = 10000;
		this._intvb = 30000;
		this._stop  = true;
		this._timera= null;
		this._timerb= null;
		this._times = 0;
		this._msg   = null;
	}
	StabilityTest.prototype = {
		constructor: StabilityTest,
		start: function(btn){
			var self = this, service = w.lockService;
			
			self._times = 0;
			self.onTimesChanged();
			if(!ensureLocksOpen(service)){
				return self;
			}
			if(self.isStop() === false){
				malert("请结束上次测试");
				saveOpLogger(18,-1,'U',"请结束上次测试");
				return self;
			}
			if(self._msg == null){
				self._msg = $("strong.msg", $(btn).parent());
			}
			self._timera = setInterval(taska, self._intva);
			self._timerb = setInterval(taskb, self._intvb);
			taska();
			setTimeout(taskb, 250);
			self._stop   = false;
			saveOpLogger(18,0,'N',"开始稳定性测试");
			return this;

			function taska(){
				var srv = w.lockService;

				if(!srv){
					self.stop(btn, "连接已断开");
					return;
				}
				
				execTaska(self, srv);
				self._times = self._times + 1;
				self.onTimesChanged();
			}
			
			function taskb(){
				var srv = w.lockService;

				if(!srv){
					self.stop(btn, "连接已断开");
					return;
				}
				
				execTaskb(self, srv);
				self._times = self._times + 1;
				self.onTimesChanged();
			}

		},
		stop: function(btn, message, slient){
			var self = this;

			if(self._timera != null){
				clearInterval(self._timera);
				self._timera = null;
			}
			if(self._timerb != null){
				clearInterval(self._timerb);
				self._timerb = null;
			}
			self._stop = true;
			if(slient === undefined || slient === false){
				var msg = "跑了"+self._times+"次"+(message?"，"+message:"");
				malert(msg);
				saveOpLogger(18,0,'N',"停止稳定性测试："+msg);
			}
			self._times = 0;

			return this;
		},
		isStop: function(){
			return this._stop;
		},
		onTimesChanged: function(){
			var self = this;
			if(self._msg != null){
				self._msg.text(self._times);
			}
			return this;
		}
	};

	function execTaska(test, srv){
		srv.queryStatus({success: ok, error: fail});

		function ok(result){
			// ignore
		}

		function fail(result){
			test.stop(null, errmsg(result));
		}

	}

	function execTaskb(test, srv){
		srv.queryVoltage({success: ok, error: fail});

		function ok(result){
			// ignore
		}

		function fail(result){
			test.stop(null, errmsg(result));
		}

	}

	function errmsg(result){
		var msg = result.message ? "，错误消息：" + result.message : "";
		return ("错误代码：" + result.error + msg);
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
	w.stabilityTest = getStabTest();

})(window, jQuery, mui);
