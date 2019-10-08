// index.js
// The index page.
// 
// @since 2019-02-25
//
(function(win, doc){
	mui.plusReady(plusReady);
	
	function plusReady(){
		var NO_SEL_FILE = "未选择文件";
		var ttt = document.getElementById("ttt");
		
		// 初始码表
		var codetab = new Vue({
			el: "#codetab",
			data: {
				tag: "codetab",
				fileName: NO_SEL_FILE,
				pageNo: 0,
				pageTotal: 0,
				selCode: null,
				codes: []
			}
		});
		var footer = new Vue({
			el: "#footer",
			data: {
				pageNo: 0,
				pageTotal: 0
			},
			methods: {
				selPage: function(){
					console.log("selPage()");
					pageSel.display = true;
					ttt.focus();
				},
				nextPage: function(){
					var self = this;
					var pageNo = self.pageNo + 1;
					
					if(pageNo > self.pageTotal){
						return;
					}
					
					getPage({fileName: codetab.fileName, pageNo: pageNo});
				},
				prevPage: function(){
					var self = this;
					var pageNo = self.pageNo - 1;
					
					if(pageNo < 1){
						return;
					}
					
					getPage({fileName: codetab.fileName, pageNo: pageNo});
				}
			}
		});
		var pageSel = new Vue({
			el: "#bbb",
			data: {
				pageTotal: 0,
				inPno: "",
				display: false,
				invalidPno: false
			},
			methods: {
				clsSel: function(){
					var self = this;
					ttt.blur();
					self.display = false;
				},
				ackSel: function(){
					var self = this;
					var pageNo = self.inPno;
					
					console.log("ackSel(): pageNo = " + pageNo);
					pageNo = parseInt(pageNo);
					if(!pageNo || pageNo < 1 || pageNo > self.pageTotal){
						self.invalidPno = true;
						return;
					}
					
					self.invalidPno = false;
					self.display    = false;
					getPage({fileName: codetab.fileName, pageNo: pageNo});
				}
			}
		});
		// 加载工作历史
		var workState = plus.nfcodeFile.loadState();
		if(!!workState){
			getPage(workState);
		}
		// 监听文件选择
		win.addEventListener("openFile", openFile, false);
		
		console.log(codetab.tag+": plusReady() begin");
		
		function getPage(args){
			var fileName = args.fileName;
		
			console.log("getPage(): fileName " + fileName);
			if(!fileName){
				plus.nativeUI.toast("未指定文件");
				return;
			}
			if(NO_SEL_FILE == fileName){
				console.log("getPage(): "+NO_SEL_FILE);
				return;
			}
		
			args.success = success;
			args.error   = errorDefault;
			plus.nfcodeFile.getPage(args);
			
			function success(args){
				var i, size, code, codes;
				
				codetab.fileName  = args.fileName;
				codetab.pageNo    = footer.pageNo = args.pageNo;
				codetab.pageTotal = footer.pageTotal = pageSel.pageTotal = args.pageTotal;
				codetab.codes = codes = args.codes;
				
				for(i = 0, size = codetab.codes.length; i < size; ++i){
					code = codetab.codes[i];
					code.getStatusText = getStatusText;
					code.write         = write;
					code.canOp         = canOp;
					code.getColor      = getColor;
				}
				plus.nfcodeFile.storeState({
					fileName: codetab.fileName,
					pageNo: codetab.pageNo
				});
				
				function getColor(){
					var code = this;
					switch(code.status){
						case plus.nfcodeFile.S_PASS:
							return "#0f0";
						case plus.nfcodeFile.S_CANCEL:
							return "#f00";
						default:
							return "#000";
					}
				}
				
				function canOp(){
					var code = this;
					return (plus.nfcodeFile.S_INIT == code.status);
				}
				
				function getStatusText(){
					var code = this;
					return plus.nfcodeFile.getStatusText(code.status);
				}
				
				function write(){
					var self = this;
					
					if(!self.canOp()){
						console.log("code.write(): can't write");
						return;
					}
					
					console.log("code.write()");
					plus.nfcodeFile.setStatus({
						fileName: codetab.fileName,
						linenum: self.linenum,
						id: self.id,
						status: plus.nfcodeFile.S_PASS,
						code: self.code,
						success: success,
						error: error
					});
					
					function success(args){
						// reload or skip to the specified page
						getPage({fileName: args.fileName, pageNo: args.pageNo});
					}
					
					function error(args){
						if(args.result == 2/*未写码*/){
							return;
						}
						errorDefault(args);
					}
				}// write()
				
			}// success() in getPage()
		}
		
		function openFile(e){
			var fileName = e.detail.fileName;
			
			console.log(codetab.tag+": openFile "+fileName);
			getPage({fileName: fileName});
		}
		
		function errorDefault(args){
			plus.nativeUI.closeWaiting();
			mui.alert(args.message);
		}
		
		console.log(codetab.tag+": plusReady() end");
	}// plusReady()
	
})(window, document);
