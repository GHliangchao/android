var conf = zengma_conf,upre = conf.getUrlPrefix();
function selCountry(sel){
	var RURL = upre+"/app/region!proviceList.action",
		parentId = $(sel).val();
		if(parentId == -1||parentId==""){
			$("#provice").empty();
			$("#city").empty();
			$("#area").empty();
		}
	$.ajax({
		url: RURL,
		type: "get",
		data: {
			parentId:parentId
		},
		dataType: "json",
		cache: false,
		success: function(res){
			var str = createOption(res);
			$("#provice").empty();
			$("#provice").append(str);
			$("#provice").trigger("change");
		}
	});
}
function selCity(sel){
	var RURL = upre + "/app/region!areaList.action",
		next,
		parentId = $(sel).val();
	var nid=$(sel).attr("id");
	if(parentId == -1||parentId==""){
		if(nid=="provice"){
			$("#city").empty();
			$("#area").empty();
		}else if(nid=="city"){
			$("#area").empty();
		}
	}
	$.ajax({
		url: RURL,
		type: "get",
		data: {
			parentId:parentId
		},
		dataType: "json",
		cache: false,
		success: function(res){
			var str = createOption(res);
			if(nid=="provice"){
				$("#city").empty();
				$("#city").append(str);
				$("#city").trigger("change");
			}else if(nid=="city"){
				$("#area").empty();
				$("#area").append(str);
				$("#area").trigger("change");
			}
		}
	});
}

function chgRegion(rid,sel){
	var regionid = $(sel).val();
	console.log("当前id:"+regionid);
	if(regionid == null || regionid == ""|| regionid == "-1" || regionid == undefined){
		regionid = $("#city").val();
		console.log("城市："+regionid)
		if(regionid == null || regionid == "" || regionid == "-1"|| regionid == undefined){
			regionid = $("#provice").val();
			console.log("shengfen:"+regionid);
			if(regionid == null || regionid == "" || regionid == "-1"|| regionid == undefined){
				regionid="";
			}
		}
	}
	$("#" + rid).attr("value",regionid);
}

function createOption(res){
	var inner = "";
	$(res).each(function(i){
	   inner += "<option value='"+res[i].id+"'>"+res[i].areaname+"</option>"
	 });
	return inner;
	console.log(inner);
}
