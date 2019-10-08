var apptop = new Vue({
	el: "#apptop",
	data:{
		opType: 'M', // M - 管理， S - 选择
		opAddr: 'A', // A - 添加， U - 修改
		addrId: ""
	},
	methods:{
		confirmDropAddress: function(){
			$.dialog({
				content: "你确定要删除该地址吗？",
				ok: "确定",
				cancel:"取消",
				modal:true,
				okCallback: function(){
					apptop.dorpAddress();
				}
			});
		},
		dorpAddress: function(){
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/member_address!dropAddress.action",
				type:"POST",
				dataType:"json",
				data:{
					id: apptop.addrId
				},
				success: function(res) {
					plus.nativeUI.closeWaiting();
					if(res.ret == 0){
						$.dialog({
							content: "操作成功",
							ok: "确定",
							modal:true,
							okCallback: function(){
								var url = "/address_list.html";
								var dpage = plus.webview.getWebviewById(url);
								
								if (dpage == null) {
									mui.preload({url: url, extras:{opType: apptop.opType}});
								} else {
									mui.fire(dpage, "preloading", {opType: apptop.opType});
								}
							}
						});
						return;
					}
					showMsg(res.msg);
				},
				error: function(xhr, type, cause){
					ajaxerror(xhr, type, cause);
				}
			});
		}
	}
});

var vm = new Vue({
	el: "#content",
	data:{
		opAddr: "A",   // A - 添加， U - 修改
		regionId: "",  // 地址id
		province: "",  // 省
		cityName: "",  // 城市名称
		countyName: "",// 县名称
		address : "",  // 地址
		contactName: "",
		contactPhone:"",
		detailAddress: "",
		defaultAddress: false,
	},
	methods:{
		saveAddress: function(){
			if(!this.checkParam()){
				return;
			}
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/member_address!saveAddress.action",
				type:"POST",
				dataType:"json",
				data:{
					"memberAddress.contactName": this.contactName,
					"memberAddress.contactPhone": this.contactPhone,
					"memberAddress.provinceName":this.province,
					"memberAddress.cityName": this.cityName,
					"memberAddress.countyName": this.countyName,
					"memberAddress.detailAddress": this.detailAddress,
					"memberAddress.defaultAddress": this.defaultAddress,
					regionId: this.regionId
				},
				success: function(res) {
					plus.nativeUI.closeWaiting();
					if(res.ret == 0){
						$.dialog({
							content: "操作成功",
							ok: "确定",
							modal:true,
							okCallback: function(){
								var url = "/address_list.html";
								var dpage = plus.webview.getWebviewById(url);
								
								if (dpage == null) {
									mui.preload({url: url, extras:{opType: apptop.opType}});
								} else {
									mui.fire(dpage, "preloading", {opType: apptop.opType});
								}
							}
						});
						return;
					}
					showMsg(res.msg);
				},
				error: function(xhr, type, cause){
					ajaxerror(xhr, type, cause);
				}
			});
		},
		editAddress: function(){
			if(!this.checkParam()){
				return;
			}
			plus.nativeUI.showWaiting("");
			$.ajax({
				url: upre + "/app/memb/member_address!editAddress.action",
				type:"POST",
				dataType:"json",
				data:{
					"memberAddress.contactName": this.contactName,
					"memberAddress.contactPhone": this.contactPhone,
					"memberAddress.provinceName":this.province,
					"memberAddress.cityName": this.cityName,
					"memberAddress.countyName": this.countyName,
					"memberAddress.detailAddress": this.detailAddress,
					"memberAddress.defaultAddress": this.defaultAddress,
					regionId: this.regionId,
					"memberAddress.id": apptop.addrId
				},
				success: function(res) {
					plus.nativeUI.closeWaiting();
					if(res.ret == 0){
						$.dialog({
							content: "操作成功",
							ok: "确定",
							modal:true,
							okCallback: function(){
								var url = "/address_list.html";
								var dpage = plus.webview.getWebviewById(url);
								
								if (dpage == null) {
									mui.preload({url: url, extras:{opType: apptop.opType}});
								} else {
									mui.fire(dpage, "preloading", {opType: apptop.opType});
								}
							}
						});
						return;
					}
					showMsg(res.msg);
				},
				error: function(xhr, type, cause){
					ajaxerror(xhr, type, cause);
				}
			});
		},
		checkParam: function(){
			if(this.contactName == ""){
				showMsg("请输入联系人姓名");
				return false;
			}
			if(this.contactPhone == ""){
				showMsg("请输入联系人手机号码");
				return false;
			}
			if(this.detailAddress == ""){
				showMsg("请输入详细地址");
				return false;
			}
			return true;
		}
	}
});

var conf = zengma_conf, upre = conf.getUrlPrefix();
function plusReady(){
	var curr = plus.webview.currentWebview();
	apptop.opType = curr.opType;
	apptop.opAddr = curr.opAddr;
	apptop.addrId = curr.addrId;
	vm.opAddr = curr.opAddr;
	
	window.ajaxerror = Access.newAjaxErrorHandler({
		extras: {redirect: "/address_list.html"}
	});
	
	window.addEventListener("preloading", webinit, false);
	initPage();
	
	function webinit(e) {
		var detail = e.detail;
		if(detail){
			apptop.opType = detail.opType;
			apptop.opAddr = detail.opAddr;
			apptop.addrId = detail.addrId;
			vm.opAddr = detail.opAddr;
		}
		initPage();
	}
	
	function initPage(){
		curr.show("slide-in-right");
		initInfo();
	}
	
	function initInfo() {
		plus.nativeUI.showWaiting("");
		initCityPicker();
		if(apptop.opAddr == 'U') {
			initEdit();
		}
		
	}
	
	function initEdit(){
		$.ajax({
			url: upre + "/app/memb/member_address!findAddress.action",
			type:"GET",
			dataType:"json",
			data:{
				id: apptop.addrId
			},
			success: function(res){
				console.log("init edit : " + JSON.stringify(res));
				if(res.ret == 0) {
					var addressInfo = res.address;
					vm.regionId = addressInfo.region.id;
					vm.province	= addressInfo.provinceName;
					vm.cityName	= addressInfo.cityName;
					vm.address 	= addressInfo.shortAddressInfo;
					vm.countyName	  = addressInfo.countyName;
					vm.contactName	  = addressInfo.contactName;
					vm.contactPhone   = addressInfo.contactPhone;
					vm.detailAddress  = addressInfo.detailAddress;
					vm.defaultAddress = addressInfo.defaultAddress;
					$("#showCityPicker").val(addressInfo.shortAddressInfo);
					return;
				}
				showMsg(res.msg);
			},
			error:function(xhr, type, cause) {
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	function initCityPicker(){
		$.ajax({
			url: upre + "/app/memb/member_address!initCityPicker.action",
			type:"GET",
			dataType:"json",
			success: function(res){
				createCityPicker(JSON.parse(res.msg));
				plus.nativeUI.closeWaiting();
			},
			error:function(xhr, type, cause) {
				plus.nativeUI.closeWaiting();
				ajaxerror(xhr, type, cause);
			}
		});
	}
	
	function createCityPicker(cityData){
		var cityPicker = new mui.PopPicker({
				layer: 3
			});
		cityPicker.setData(cityData);
		var showCityPickerButton = document.getElementById('showCityPicker');
		var cityResult = document.getElementById('showCityPicker');
		showCityPickerButton.addEventListener('tap', function(event) {
			cityPicker.show(function(items) {
				vm.province = getParam(items[0], 'text');
				vm.cityName = getParam(items[1], 'text');
				vm.countyName = getParam(items[2], 'text');
				vm.regionId = items[2].value || items[1].value;
				vm.address  = vm.province + " " + vm.cityName + " " + vm.countyName;
				cityResult.value = vm.address;
			});
		}, false);
	}
	
	function getParam(obj, param) {
		return obj[param] || '';
	}
}

mui.init();
mui.plusReady(function(){
	plusReady();
});

function showMsg(msg){
	$.dialog({
		content: msg,
		ok: "确定"
	});
}

var unSelected = "#989898";
var selected = "#505050";
$(function () {
    $("select").css("color", unSelected);
    $("option").css("color", selected);
    $("select").change(function () {
        var selItem = $(this).val();
        if (selItem == $(this).find('option:first').val()) {
            $(this).css("color", unSelected);
        } else {
            $(this).css("color", selected);
        }
    });
})
