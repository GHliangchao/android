var conf = zengma_conf, upre = conf.getUrlPrefix();
var surl = upre + "/app/memb/zcode_sync_operate!saveRightBind.action";
var jurl = upre + "/app/memb/zcode_sync_operate!judgeRootId.action";
var aurl = upre + "/app/memb/zcode_sync_operate!addBindBout.action";

window.retains = {
	"choose_zcode.html": true
};

// extras parameter
var appid, boutName, boutCode, remark;

// select parameter
var name, startDate, endDate;

//select parameter
var pageNo, count;
var rootIds = new Array();

// i18n 国际化资源 @since liujun 2018-11-27
var pullDownInfoText, pullDownNomoreText, tanOkText, tanCancelText,
operateSuccessText, addBindBoutText;
i18n.readyI18n(function() {
	$("#titleText").html($.i18n.prop('choose_zcode_js_titleText'));
	$("#boutNameText").html($.i18n.prop('choose_zcode_js_boutNameText'));
	$("#boutCodeText").html($.i18n.prop('choose_zcode_js_boutCodeText'));
	$("#remarkText").html($.i18n.prop('choose_zcode_js_remarkText'));
	$("#saveBout").html($.i18n.prop('choose_zcode_js_saveBoutText'));
	$("#search").html($.i18n.prop('public_input_search_js_searchText'));
	
	// attr
	$("#name").attr('placeholder', $.i18n.prop('choose_zcode_search_name'));
	$("#startDate").attr('placeholder', $.i18n.prop('public_input_search_js_startDate'));
	$("#endDate").attr('placeholder', $.i18n.prop('public_input_search_js_endDate'));

	// 正在加载中...
	pullDownInfoText = $.i18n.prop("public_pull_down_infoText");
	// 没有更多数据了
	pullDownNomoreText = $.i18n.prop("public_pull_down_nomoreText");
	// 确&nbsp;&nbsp;定
	tanOkText = $.i18n.prop("tan_ok");
	// 取&nbsp;&nbsp;消
	tanCancelText = $.i18n.prop("tan_cancel");
	// 操作成功
	operateSuccessText = $.i18n.prop("bind_list_js_operate_success");
	// 请添加甄码链
	addBindBoutText = $.i18n.prop("choose_zcode_js_noAddZcodes");
});



function plusReady(){
	var webv = plus.webview.currentWebview();
	
	appid = webv.appid;
	boutName = webv.boutName;
	boutCode = webv.boutCode;
	remark = webv.remark;
	
	window.ajaxerror = Access.newAjaxErrorHandler({extras: {redirect: "choose_zcode.html"}});
	window.addEventListener('ppreload', webinit, false);
	$("#back")[0].addEventListener('tap', function(){mui.back();}, false);
	$("#search")[0].addEventListener('tap', function(){doPull(true)}, false);
	$("#saveBout")[0].addEventListener("tap", addBindBout, false);
	
	initList();
	
	function webinit(e) {
		if (e) {
			var detail = e.detail;
			if (detail.appid != undefined) {
				appid = detail.appid;
			}
			if (detail.boutName != undefined) {
				boutName = detail.boutName;
			}
			if (detail.boutCode != undefined) {
				boutCode = detail.boutCode;
			}
			if (detail.remark != undefined) {
				remark = detail.remark;
			}
		}
		initList();
	}
	
	function initList() {
		$("#boutName").html(boutName);
		$("#boutCode").html(boutCode);
		$("#remark").html(remark);
		
		// 进入页面的时候，需要刷新查询条件 @since liujun 2018-11-29
		$("#name").val("");
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
	if(scrollTop + clientHeight >= scrollHeight-10){   //距离顶部+当前高度 >=文档总高度 即代表滑动到底部 count++;         //每次滑动count加1
		
      	doPull(false);
    }else if(scrollTop<=0){
      //滚动条距离顶部的高度小于等于0
    }
}

//查询数据，分页查询@since liujun
function doPull(down) {
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
		rootIds = new Array();
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
		var name = $("#name").val();
		console.log("select code start date is "+ startDate +",end date is "+endDate);
		$.ajax({
			url: surl,
			data:{
				appid: appid,
				name: name,
				startDate: startDate,
				endDate: endDate,
				pageNum: pageNo
			},
			dataType: "html",
			type:"GET",
			success:function(res) {
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

function choose(obj, rootId){
	var divObj = $(obj);
	var prep = divObj.attr("choose");
	
	// 设置属性
	console.log("start-----> arr message is " + JSON.stringify(rootIds));
	if(prep == "choose"){
		judge(rootId);
	}
	if (prep == "choosed") {
		divObj.addClass("zcode_list2_choose").removeClass("zcode_list2_choosed");
		divObj.attr("choose","choose");
		// 删除数组中rootId
		var index = rootIds.indexOf(rootId);
		if (index > -1) {
			rootIds.splice(index, 1);
		}
		console.log("end <--- arr message is "+ JSON.stringify(arr));
	}

	function judge(rootId) {
		plus.nativeUI.showWaiting("");
		$.ajax({
			url: jurl,
			type: "GET",
			dataType: "JSON",
			data: {
				appid: appid,
				rootId: rootId
			},
			success: function(res) {
				plus.nativeUI.closeWaiting();
				if(res.ret == 0){
					divObj.addClass("zcode_list2_choosed").removeClass("zcode_list2_choose");
					divObj.attr("choose","choosed");
					rootIds.push(rootId);
					console.log("end <--- arr message is "+ JSON.stringify(rootIds));
					return;
				}
				showMsg(res.msg);
			},
			error: function(xhr, type, cause){
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		})
	}
}

function removeObj(_arr, obj){
	var length = _arr.length;
	var i = 0;
	
	for(; i < length; i++) {
		console.log(JSON.stringify(_arr[i])+"-----"+JSON.stringify(obj));
		if (JSON.stringify(_arr[i]) === JSON.stringify(obj)){
			console.log("删除");
			_arr.splice(i, 1);
		}
	}
}

//保存绑定批次
function addBindBout() {
	if (rootIds.length == 0) {
		showMsg(addBindBoutText);
		return;
	}
	plus.nativeUI.showWaiting("");
	$.ajax({
		url: aurl,
		type: "POST",
		dataType: "JSON",
		traditional: true,
		data: {
			boutName: boutName,
			boutCode: boutCode,
			remark: remark,
			rootIds: rootIds,
			appid: appid
		},
		success: function(res) {
			plus.nativeUI.closeWaiting();
			if (res.ret == 0) {
				$.dialog({
					content: operateSuccessText,
					ok: tanOkText,
					okCallback: callback
				})
			} else {
				showMsg(res.msg);
			}
		},
		error: function(xhr, type, cause) {
			plus.nativeUI.closeWaiting();
			ajaxerror(xhr, type, cause);
		}
	});
	
	function callback() {
		var page = plus.webview.getWebviewById("bind_list.html");
		if (page == null) {
			mui.openWindow({url: "bind_list.html", extras:{
				appid: appid
			}});
		} else {
			mui.fire(page, "ppreload", {
				appid:appid
			});
		}
	}
}

function showMsg(msg) {
	$.dialog({
		content: msg,
		ok: tanOkText
	});
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

mui.plusReady(function(){
	plusReady();
	conf.uiInit();
})