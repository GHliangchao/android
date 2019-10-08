// common advert-adpace
// exports: iface.aap.init/1
// @since 2016-08-29
(function(mui, win, doc){
	var conf = zengma_conf,
	upre = conf.getUrlPrefix();
	var ALST_URL =upre+ "/app/public!alist.action",
	INC_AURL = upre+"/app/public!incAclicks.action",
	INC_PURL = upre+"/app/public!incPclicks.action",
	PRIV_OPTS= {wrapId: "slider", slide: true,
		pageNo: 1, pageSize: 15, imgSel: "div.mui-slider-item img"}, 
	aap;
	
	if(win.iface == undefined){
		win.iface = {};
	}
	aap = win.iface.aap;
	if(aap == undefined){
		win.iface.aap = aap = {};
	}
	aap.init =  init;
	
	function init(options){
		var imgSel, wrapper, privOpts;
		privOpts= mui.extend(true, {}, PRIV_OPTS, options);
		imgSel  = privOpts.imgSel;
		wrapper = mui("#" + privOpts.wrapId);
		mui.ajax(conf.wrapURL(ALST_URL), {
			type: "GET",
			data: {alias: privOpts.alias, siteId: (privOpts.siteId||""), 
				pageNum: privOpts.pageNo, pageSize: privOpts.pageSize
			},
			dataType: "json",
			success: function(res){
				if (conf.debug) {
					console.debug(JSON.stringify(res));
				}
				var w = wrapper;
				wrapper.off("tap", imgSel);
				if (res.ret == 0) {
					var inner=createAdvert(res.adverts,res.isad);
					if(w[0]!=undefined){
						w[0].innerHTML= inner;
					}
				}	
				if(privOpts.slide === true && privOpts.pageSize > 1){
					w = mui(wrapper[0].querySelector(".mui-slider"));
					w.slider({interval: 5000});
				}
				wrapper.on("tap", imgSel, oaap);
			},
			error: function(xhr, type, cause) {
					if (conf.debug) {
						console.error(type + ": " + JSON.stringify(xhr));
					}
			}
		});

		function createAdvert(list,isad){
				if(typeof list === "undefined"){
					return;
				}
				var bf=list[0];
				var binner="",inner="";
				var length=list.length;
				 if(isad==1){
					var ad=list[length-1];
						inner+='<div class="mui-slider changepic_1250_300"><div class="mui-slider-group mui-slider-loop">';
						//额外增加的一个节点(循环轮播：第一个节点是最后一张轮播)
					    inner+='<div class="mui-slider-item mui-slider-item-duplicate"><a>';
					    inner+='<img src="'+ad.image+'" action="'+ad.action+'" style="height: 15rem;"';
					    inner+=' atype="'+ad.type+'" onclick="adClicks(' + ad.id + ',this)"/></a></div>';
					$.each(list, function(i, c) {
						inner += '<div class="mui-slider-item"><a>';
						inner+='<img src="'+c.image+'" action="'+c.action+'" style="height: 15rem;" atype="'+c.type+'" onclick="addClicks(' + c.id + ',this)"/></a></div>';
						if(i==0){
							binner+='<div class="mui-indicator mui-active"></div>';
						}else{
							binner+='<div class="mui-indicator"></div>';
						}
					});
					//额外增加的一个节点(循环轮播：最后一个节点是第一张轮播) 
					inner+='<div class="mui-slider-item mui-slider-item-duplicate"><a>';
					inner+='<img src="'+bf.image+'" action="'+bf.action+'" style="height: 15rem;" atype="'+bf.type+'" onclick="addClicks(' + bf.id +',this)" /></a></div></div>';
					inner+='<div class="mui-slider-indicator">';
					inner+=binner;
					inner+='</div></div>';
				}else{
					inner+='<img src="'+bf.image+'" atype="'+bf.type+'" action="'+bf.action+'"  aid="'+bf.id+'" >'
				}
				return inner;
			}
		
		function oaap(){
			var action = this.getAttribute("action"), incURL, id;
			if(action){
				if(this.getAttribute("atype") === "P"){
					incURL = conf.wrapURL(INC_PURL);
				}else{
					incURL = conf.wrapURL(INC_AURL);
				}
				id = this.getAttribute("aid");
				mui.ajax(incURL, {
					type: "POST",
					data: {id: id},
					dataType: "json",
					success: mui.noop,
					error: mui.noop
				});
				if(action!=""){
					var arr=action.split("(");
					console.log(arr[0]);
					if(typeof (eval(arr[0])) == "function"){
						var ext=arr[1].split(")")[0];
						window[arr[0]](ext);
					}else{
					}
				}
				return;
			}
		}
	}

})(mui, window, document);

// 创建并显示新窗口
function create(action){
	//var w = plus.webview.create( "http://200.msh186.com/active/app0519/index.php" );
	//plus.webview.show( w ); // 显示窗口
	//var w = plus.webview.open( "http://200.msh186.com/active/app0519/index.php" );
	var dpage= null;
	dpage = plus.webview.getWebviewById("b.html");
	if(dpage==null){
		mui.openWindow({
			url: "b.html",
				extras: {
					action: action
				}
			});
	}else{
		mui.fire(dpage, "getNew", {action:action});
	}
	//mui.openWindow({url:'b.html'});
	//var w = plus.webview.create( "http://200.msh186.com/active/app0519/index.php" );
	//w.show(); // 显示窗口
}
