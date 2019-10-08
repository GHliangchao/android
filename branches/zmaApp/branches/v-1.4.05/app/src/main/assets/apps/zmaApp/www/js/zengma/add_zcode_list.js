var conf = zengma_conf, upre = conf.getUrlPrefix();
var surl = upre + "/app/memb/zcode_sync_operate!addZcodelists.action";
var saveBindUrl = upre + "/app/memb/zcode_sync_operate!bindZcode.action";
window.retains = {
	"add_zcode_list.html" : true
};

// extras parameter
var appid, boutId;

// select parameter
var pageNo, count;

// i18n 国际化资源 @since liujun 2011-11-20
var pullDownInfoText, pullDownNomoreText, bindPromptText,
	bindSuccessText, tanOkText;
i18n.readyI18n(function(){
	$("#titleText").html($.i18n.prop("add_zcode_list_js_titleText"));
	$("#search").html($.i18n.prop("public_input_search_js_searchText"));
	$("#zcode").attr("placeholder", $.i18n.prop("public_input_search_js_zcode"));
	$("#startDate").attr("placeholder", $.i18n.prop("public_input_search_js_startDate"));
	$("#endDate").attr("placeholder", $.i18n.prop("public_input_search_js_endDate"));
	// 正在加载中...
	pullDownInfoText = $.i18n.prop("public_pull_down_infoText");
	// 没有更多数据了
	pullDownNomoreText = $.i18n.prop("public_pull_down_nomoreText");
	// 正在绑定...
	bindPromptText = $.i18n.prop("add_zcode_list_js_saveBindText");
	// 绑定成功
	bindSuccessText= $.i18n.prop("add_zcode_list_js_bindSuccess");
	// 确&nbsp;&nbsp;定
	tanOkText = $.i18n.prop("tan_ok");
});

function plusReady() {
	var webv = plus.webview.currentWebview();
	appid = webv.appid;
	boutId= webv.boutId;
	
	window.ajaxerror = Access.newAjaxErrorHandler({extras:{redirect:"add_zcode_list.html"}});
	window.addEventListener('ppreload', webinit, false);
	
	$("#back")[0].addEventListener('tap', function(){mui.back();}, false);
	$("#search")[0].addEventListener('tap', function(){doPull(true)}, false);
	
	initList();
	function webinit(e) {
		if (e) {
			var detail = e.detail; // 带参数的话通过detail获取
			if (detail.appid != undefined) {
				appid = detail.appid;
			}
			if (detail.boutId != undefined) {
				boutId = detail.boutId;
			}
		}
		initList();
	}
	
	function initList(){
		// 进入页面的时候，需要刷新查询条件 @since liujun 2018-11-29
		$("#zcode").val("");
		$("#startDate").val("");
		$("#endDate").val("");
		
		// 第一次加载数据
		doPull(true);
		webv.show("slide-in-right");
	}
	
}

window.onscroll = function() { 
	var scrollTop = $(window).scrollTop();    //滚动条距离顶部的高度
	var scrollHeight = $(document).height();   //当前页面的总高度
	var clientHeight = $(window).height();  //当前可视的页面高度
	console.log(scrollTop + "---"+ scrollHeight + "---" + clientHeight);
	if(scrollTop + clientHeight >= scrollHeight-10){   //距离顶部+当前高度 >=文档总高度 即代表滑动到底部 count++;         //每次滑动count加1
      	console.log('上拉');
		
      	doPull(false);
    }else if(scrollTop<=0){
      //滚动条距离顶部的高度小于等于0
      console.log('下拉');
    }
}

//查询数据，分页查询@since liujun
function doPull(down) {
	console.log("开始查询数据");
	var nomore = $("#nomore");
	nomore.html(pullDownInfoText);
	nomore.show();
	
	// 清空“没有更多数据”的提示
	var nodata = $("#nodata");
	if (nodata) {
		nodata.parent().empty();
	}
	
	if (down) {
		pageNo = 0;
		count = null;
	}
	if (pageNo == count) { // 判断还有没有数据
		nomore.html(pullDownNomoreText);
		nomore.show();
		return;
	}
	pageNo++;
	selCode();
	
	function selCode() {
		var startDate = $("#startDate").val();
		var endDate = $("#endDate").val();
		var zcode = $("#zcode").val();
		console.log("select code start date is "+ startDate +",end date is "+endDate);
		$.ajax({
			url: surl,
			data:{
				appid: appid,
				zcode: zcode,
				startDate: startDate,
				endDate: endDate,
				pageNum: pageNo
			},
			dataType: "html",
			type:"GET",
			success:function(res) {
				console.log("返回成功："+res);
				if (down) {
					$("#more").empty();
				}
				$("#more").append(res);
				count = pageCount;
				nomore.hide();
			},
			error: function(xhr, type, cause) {
				ajaxerror(xhr, type, cause);
			}
		});
	}
}

function saveBind(rootId){
	plus.nativeUI.showWaiting(bindPromptText);
	$.ajax({
		url: saveBindUrl,
		data:{
			appid: appid,
			boutId: boutId,
			rootId: rootId,
		},
		dataType: "JSON",
		type: "POST",
		success: function(xhr) {
			plus.nativeUI.closeWaiting();
			if(xhr.ret == 0) {
				$.dialog({
					content: bindSuccessText,
					ok: tanOkText,
					okCallback: callback
				});
			} else {
				showMsg(xhr.msg);
			}
		},
		error: function(xhr, type, cause) {
			plus.nativeUI.closeWaiting();
			ajaxerror(xhr, type, cause);
		}
	});
	
	function callback(){
		console.log("enter bind zcode list-->");
		var page = plus.webview.getWebviewById("bind_zcode_list.html");
		if (null == page) {
			mui.preload({url: "bind_zcode_list.html", extras:{
				appid: appid, boutId: boutId
			}});
		} else {
			mui.fire(page, "ppreload", {
				appid: appid, boutId: boutId
			});
		}
		plus.webview.currentWebview().close();
	}
}

(function($) {
	var btns = $('.btnTime');
	btns.each(function(i, btn) {
		btn.addEventListener('tap', function() {
			var optionsJson = this.getAttribute('data-options') || '{}';
			var options = JSON.parse(optionsJson);
			var id = this.getAttribute('id');
			/*
			 * 首次显示时实例化组件 示例为了简洁，将 options 放在了按钮的 dom 上 也可以直接通过代码声明 optinos
			 * 用于实例化 DtPicker
			 */
			var picker = new $.DtPicker(options);
			picker.show(function(rs) {
				/*
				 * rs.value 拼合后的 value rs.text 拼合后的 text rs.y 年，可以通过 rs.y.vaue 和
				 * rs.y.text 获取值和文本 rs.m 月，用法同年 rs.d 日，用法同年 rs.h 时，用法同年 rs.i
				 * 分（minutes 的第二个字母），用法同年
				 */
				btn.value = rs.text;
				/*
				 * 返回 false 可以阻止选择框的关闭 return false;
				 */
				/*
				 * 释放组件资源，释放后将将不能再操作组件 通常情况下，不需要示放组件，new DtPicker(options)
				 * 后，可以一直使用。 当前示例，因为内容较多，如不进行资原释放，在某些设备上会较慢。 所以每次用完便立即调用 dispose
				 * 进行释放，下次用时再创建新实例。
				 */
				picker.dispose();
			});
		}, false);
	});
})(mui);

function showMsg(msg){
	$.dialog({
		content: msg,
		ok: tanOkText
	})
}

mui.plusReady(function() {
	plusReady();
	conf.uiInit();
})