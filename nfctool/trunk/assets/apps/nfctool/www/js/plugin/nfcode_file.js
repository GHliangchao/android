// nfc code file plugin module.
//
// @since 2019-02-25 pzp
//
(function(win, doc){
	var PAGE_NO_DEFAULT = 1, PAGE_SIZE_DEFAULT = 50;
	
	// init
	doc.addEventListener("plusready", plusready);
	
	function plusready(){
		var service = "nfcodeFile";
		var stateKey= "work.state";
		var storage = win.plus.storage;
		var B = win.plus.bridge;
		var nfcodeFile = {
			pageSize: PAGE_SIZE_DEFAULT,
			// list code file list
			// @result {result:0|1, files:[{name,size}...], message: "..."}
			getFiles: function(args){
				var cbid = gencbid(args.success, args.error);
				
				return B.exec(service, "getFiles", [cbid]);
			},
			// Get a code page
			// @result {result:0|1, fileName, pageNo, pageSize, pageTotal, codes:[]}
			getPage: function(args){
				var cbid = gencbid(args.success, args.error);
				var fileName = args.fileName;
				var pageNo = args.pageNo || PAGE_NO_DEFAULT;
				var pageSize = args.pageSize || PAGE_SIZE_DEFAULT;
				
				console.log(service+": call getPage()");
				return B.exec(service, "getPage", [cbid, fileName, pageNo, pageSize]);
			},
			// Code by code, set code status from specified args(fileName, linenum, id)
			// @result {result:0|1, filename, pageNo}
			setStatus: function(args){
				var cbid = gencbid(args.success, args.error);
				var fileName = args.fileName;
				var linenum  = args.linenum;
				var id = args.id;
				var status = args.status;
				var code = args.code;
				var pageSize = args.pageSize || PAGE_SIZE_DEFAULT;
				
				return B.exec(service, "setStatus", 
					[cbid, fileName, linenum, id, status, code, pageSize]);
			},
			// Load work state
			loadState: function(){
				var state = storage.getItem(stateKey);
				try{
					state = JSON.parse(state);
				}catch(e){}
				return state;
			},
			// Store work state
			storeState: function(args){
				args = typeof args !== "string"? JSON.stringify(args): args;
				storage.setItem(stateKey, args);
			},
			// Status management
			S_INIT: 0, S_PASS: 1, S_CANCEL: 2,
			getStatusText: function(status){
				var self = this;
				// 0初始，1通过，2作废
				switch(status){
					case self.S_INIT:
						return "初始";
					case self.S_PASS:
						return "通过";
					case self.S_CANCEL:
						return "作废";
					default:
						return "未知";
				}
			}
		};
		
		// exports
		win.plus.nfcodeFile = nfcodeFile;
		console.log(service+": ready");
		
		function gencbid(success, error){
			success = typeof success !== 'function' ? null : success; 
			error   = typeof error   !== 'function' ? null : error;  
			return B.callbackId(success, error);
		}
	}
	
})(window, document);
