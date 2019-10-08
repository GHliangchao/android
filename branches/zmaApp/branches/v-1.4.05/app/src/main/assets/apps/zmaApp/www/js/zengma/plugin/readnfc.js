// read NFC plugin
// @since liujun 2019-03-18
(function(w, d){
	var conf = zengma_conf,
	upre  = conf.getUrlPrefix(),
	names = "readnfc";
	
	d.addEventListener("plusready", ready, true);
	
	function ready(){
		var plus = w.plus;
		plusb = plus.bridge;
		
		console.log("readnfc: init start");
		
		// factory
		function newReadnfc(){
			return new RealReadnfc();
		}
		
		// classes
		function RealReadnfc(){
			
		}
		
		RealReadnfc.prototype.init = function(params){
			// params: {success, error}
			var self = this;
			var cbid = newCbid.apply(self, [params.success, params.error]);
					
			plusb.exec(names, "init", [cbid]);
			return this;
		};
		RealReadnfc.prototype.destroy = function(params){
			// params: {success, error}
			var self = this;
			var cbid = newCbid.apply(self, [params.success, params.error]);
			
			plusb.exec(names, "destroy", [cbid]);
			return this;
		};
		
		function newCbid(scb, ecb, waiting){
    		var self= this, realWait = (waiting==undefined || waiting),
    		success = (typeof scb!=='function') ? completed : function(args){
				completed(args);
				scb(args);
			},
			error   = (typeof ecb!=='function') ? completed : function(args) {
				completed(args);
			}
			
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
		plus.readnfc = newReadnfc();
		console.log("readnfc: init ok");
	}
	
})(window, document);