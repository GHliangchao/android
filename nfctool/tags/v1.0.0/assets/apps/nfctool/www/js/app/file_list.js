// file_list.js
// The file selection list page.
// 
// @since 2019-02-25
//
(function(win, doc){
	mui.plusReady(plusReady);
	
	function plusReady(){
		var filetab = new Vue({
			el: "#filetab",
			data: {
				tag: "filetab",
				files: []
			},
			methods: {
				load: function(){
					var self = this;
					
					plus.nativeUI.showWaiting("正在获取列表");
					plus.nfcodeFile.getFiles({
						success: success,
						error: error
					});
					
					function success(args){
						var files = args.files;
						
						plus.nativeUI.closeWaiting();
						if(files.length == 0){
							plus.nativeUI.toast("没有文件");
							return;
						}
						
						self.files = self.files.concat(files);
					}
					
					function error(args){
						plus.nativeUI.closeWaiting();
						mui.alert(args.message);
					}
				},
				select: function(file, i){
					var self = this;
					var cur  = plus.webview.currentWebview();
					var opener = cur.opener();
					var fileName = file.name; 
					
					console.log(self.tag+": select "+fileName);
					mui.fire(opener, "openFile", {fileName: fileName});
					setTimeout(function(){
						mui.back();
					}, 250);
				}
			}
		});
		
		console.log(filetab.tag+": load");
		filetab.load();
	}
	
})(window, document);
