// blelock plugin, used to access ble lock.
// @since 2017-02-08 pzp
// 
(function(w, d){
	var conf = zengma_conf,
	upre  = conf.getUrlPrefix(),
	names = "blelock";

	var DEBUG = true, TAG = "blockjs";

	// args: method, a1, a2...
	function debug(){
		var log, args, size, i;
		if(DEBUG){
			args = Array.prototype.slice.apply(arguments);
			log = TAG + ".";
			for(i = 0, size = args.length; i < size; ++i){
				if(i === 0){
					log += args[i] + ":";
				}else{
					log += " " + args[i];
				}
			}
			console.log(log);
		}
	}
	
	d.addEventListener("plusready", ready, true);
	
	function ready(){
		var plus = w.plus,
		plusb = plus.bridge,
		consts= {};
		
		console.log("blelock: init start");
		// - error const
		consts.ER_ERROR  = {errno: -1,   message: "操作错误了"};
		consts.ER_PENDING= {errno: -2,   message: "上次操作未完成"};
		consts.ER_NONE  = {errno: 0x00, message: "命令操作成功"};
		consts.ER_SIGN  = {errno: 0x01, message: "命令签名错误"};
		consts.ER_CRC   = {errno: 0x02, message: "命令CRC错误"};
		consts.ER_FORMAT= {errno: 0x04, message: "命令格式错误"};
		consts.ER_NOCODE= {errno: 0x10, message: "锁未写入甄码"};
		// + NFC not supported since 2018-03-19 pzp
		consts.ER_NONFC   = {errno: 0xFA, message: "不支持NFC"};
		consts.ER_DISCON  = {errno: 0xFC, message: "连接已断开"};
		consts.ER_TIMEOUT = {errno: 0xFE, message: "操作已超时"};
		consts.ER_LOCKFLT = {errno: 0xFF, message: "锁出现故障"};

		// - status const
		consts.STATUS_REUSABLE   = {code: 0x01, text: "可重用"};
		consts.STATUS_AUTHORIZED = {code: 0x02, text: "授权状态"};
		consts.STATUS_FAULTED    = {code: 0x04, text: "故障状态"};
		consts.STATUS_VINCOMP    = {code: 0x08, text: "版本不兼容"};
		consts.STATUS_OPEN       = {code: 0x10, text: "开锁状态"};
		consts.STATUS_CLOSED     = {code: 0x20, text: "关锁状态"};
		consts.STATUS_ENCRYPTED  = {code: 0x40, text: "加密"};
				
		// factory
		function newBlelock(){
			return new RealBlelock();
		}

		// classes
		function RealBlelock(){
			
		}
		RealBlelock.prototype.scan = function(chandler){
			var h = chandler,
			cbid = newCbid.apply(this, [h.success, h.error, false]);

			debug("scan()", "begin");
			plusb.exec(names, "scan", [cbid]);
			return this;
		};
		RealBlelock.prototype.stopScan = function(){
			var cbid = newCbid.apply(this, [function(result){}, null, false]);
			
			plusb.exec(names, "stopScan", [cbid]);
			return this;
		};
		// + NFC access since 1.6.3-20180319 pzp
		RealBlelock.prototype.nfcCheck = function(params){
			// params: {success, error}
			var self = this;
			var cbid = newCbid.apply(self, [params.success, params.error]);
			
			plusb.exec(names, "nfcCheck", [cbid]);
			return this;
		};
		RealBlelock.prototype.nfcRead = function(params){
			// params: {options, success, error}
			// - options: {cardId: "", format: "txt"(default)|"hex"}
			var self = this;
			var cbid = newCbid.apply(self, [params.success, params.error]);
					
			plusb.exec(names, "nfcRead", [cbid, params.options]);
			return this;
		};
		RealBlelock.prototype.nfcWrite = function(params){
			// params: {options, success, error}
			// - options: {cardId: "", format: "txt"(default)|"hex", data: ""}
			var self = this;
			var cbid = newCbid.apply(self, [params.success, params.error]);
					
			plusb.exec(names, "nfcWrite", [cbid, params.options]);
			return this;
		};
		// + NFC access since 2018-07-31 liujun
		RealBlelock.prototype.scanQRcodeNfcWrite = function(params){
			// params: {options, success, error}
			// - options: {cardId: "", format: "txt"(default)|"hex", data: ""}
			var self = this;
			var cbid = newCbid.apply(self, [params.success, params.error]);
					
			plusb.exec(names, "scanQRcodeNfcWrite", [cbid, params.options]);
			return this;
		};
		// + NFC access since 2018-08-01 liujun
		RealBlelock.prototype.scanQRcodeNfcRead = function(params){
			// params: {options, success, error}
			// - options: {cardId: "", format: "txt"(default)|"hex"}
			var self = this;
			var cbid = newCbid.apply(self, [params.success, params.error]);
					
			plusb.exec(names, "scanQRcodeNfcRead", [cbid, params.options]);
			return this;
		};
		// + NFC access since 2019-02-27 liujun
		RealBlelock.prototype.scanSecretCodeNfcRead = function(params){
			// params: {options, success, error}
			// - options: {cardId: "", format: "txt"(default)|"hex"}
			var self = this;
			var cbid = newCbid.apply(self, [params.success, params.error]);
					
			plusb.exec(names, "scanSecretCodeNfcRead", [cbid, params.options]);
			return this;
		};
		// + NFC access since 1.6.3-20180319 pzp
		RealBlelock.prototype.connect = function(params){
			// params: {request, timeout, success, error}
			// - request: {address, companyId}
			var request = params.request, ble = this;
			
			function LockService(){
				this.address	= request.address;
				this.open		= true;
				this.method		= 0x00;
				this.pending	= false;
				this.logPoller= null;
			}
			LockService.prototype = {
				handshake: function(params){
					// params: {success, error, request}
					var cbid = newCbid.apply(this, [params.success, params.error]);

					plusb.exec(names, "handshake", [cbid, (params.request||0)]);
					return this;
				},
				readZcode: function(params){
					// params: {success, error}
					var cbid = newCbid.apply(this, [params.success, params.error]);

					plusb.exec(names, "readZcode", [cbid]);
					return this;
				},
				openLock: function(params){
					// params: {zcode, success, error}
					var cbid = newCbid.apply(this, [params.success, params.error]);

					plusb.exec(names, "openLock", [cbid, params.zcode]);
					return this;
				},
				closeLock: function(params){
					// params: {timeout, success, error}
					var cbid = newCbid.apply(this, [params.success, params.error]);

					plusb.exec(names, "closeLock", [cbid, (params.timeout||0)]);
					return this;
				},
				wzcode: function(params){
					// params: {zcode, success, error}
					var cbid = newCbid.apply(this, [params.success, params.error]);

					plusb.exec(names, "wzcode", [cbid, params.zcode]);
					return this;
				},
				resetLock: function(params){
					// params: {zcode, success, error}
					var cbid = newCbid.apply(this, [params.success, params.error]);

					plusb.exec(names, "resetLock", [cbid, params.zcode]);
					return this;
				},
				locate: function(params){
					// params: {timeout, success, error}
					var cbid = newCbid.apply(this, [params.success, params.error]);

					plusb.exec(names, "locate", [cbid, (params.timeout||0)]);
					return this;
				},
				switchUpgrade: function(params){
					// params: {options, success, error}
					var self = this;
					var cbid = newCbid.apply(self, [ok, params.error]);
					
					plusb.exec(names, "switchUpgrade", [cbid, params.options]);
					return this;

					function ok(result){
						self.open = false;
						params.success(result);
					}

				},
				modifyKey: function(params){
					// params: {options, success, error}
					var self = this;
					var cbid = newCbid.apply(self, [params.success, params.error]);
					
					plusb.exec(names, "modifyKey", [cbid, params.options]);
					return this;
				},
				close: function(params){
					// params: {success}
					var self = this;
					var cbid = newCbid.apply(this, [closed, ehandler, false]);
					// fixbug: params null leads to error in closed().
					// @since 2017-09-14 pzp
					params = params || {};
					plusb.exec(names, "disconnect", [cbid]);
					return this;

					function closed(result){
						self.open = false;
						if(typeof params.success === "function"){
							params.success(result);
						}
					}

					function ehandler(result){
						if(typeof params.error === "function"){
							params.error(result);
						}
					}
				}
			};

			doConnect();
			return this;

			function doConnect(){
				var cbid = newCbid.apply(ble, [ok, fail]);
				plusb.exec(names, "connect", [cbid, request, (params.timeout||0)]);

				function ok(res){
					// res: {lockService: {...,open}, message}
					var lockService = new LockService(), icbid,
						service = res.lockService;
					
					$.extend(lockService, service);
					params.success({lockService: lockService, attach: request});

					function icmp(res){
						plus.nativeUI.alert(res.message);
					}
						
					function ierr(res){
						plus.nativeUI.alert(res.message);
					}
						
				}
					
				function fail(res){
					res.attach = request;
					params.error(res);
				}
			}

		};
		
		function newCbid(scb, ecb, waiting){
    		var self= this, realWait = (waiting==undefined || waiting),
    		success = (typeof scb!=='function') ? completed : function(args){
				completed(args);
				scb(args);
			},
			error   = (typeof ecb!=='function') ? completed : function(args) {
				completed(args);
				// general error handler
				switch(args.error){
				case consts.ER_DISCON.errno:
					if(self){
						self.open = false;
					}
					break;
				case consts.ER_TIMEOUT.errno:
					if(!args.message){
						args.message = consts.ER_TIMEOUT.message;
					}
					// since 1.6.0
					if(self){
						self.open = false;
					}
					break;
				}
				// call error handler.
				// no ecb() call when last operation pending since 1.6.0
				// -- pzp
				if(consts.ER_PENDING.errno != args.error){
					ecb(args);
				}
			};
			
			if(realWait){
				self.pending = true;
				plus.nativeUI.showWaiting();
			}
			
			function completed(args){
				if(realWait){
					try{
						plus.nativeUI.closeWaiting();
					}catch(e){}
					self.pending = false;
				}
			}

			return (plusb.callbackId(success, error));
    }
		
		// exports
		plus.blelock = newBlelock();
		plus.blelock.consts = consts;
		
		console.log("blelock: init ok");
	}
	
})(window, document);
