var conf = letpro_conf;
var upre = conf.getUrlPrefix();
var count = 1;
var pageUrl = upre+"/help.htm";
var pageCount = 0;
function plusReady(){

}

function test(obj){
	mui.openWindow({
		url:"help_in.html",
		extras:{
			helpurls:obj.id
		} 
	});
}


function ajaxAsk(url){
	$.ajax({
		type:"get",
		url:url,
		success:function(data){
			$("#helpList").append(data);
			pageCount = $(".pageCount").last().val();
			pageUrl = $(".pageUrl").last().val();
			
			if(++count > pageCount){
				mui('#pullrefresh').pullRefresh().endPullupToRefresh(true);
			}else{
				mui('#pullrefresh').pullRefresh().endPullupToRefresh(false);
			}
			 
			//(++count > pageCount)
		},
		error: function(xmlhttprequest, textstatus, errorthrown) {
			if(conf.debug){
	            console.log(xmlhttprequest.readyState);
	            console.log(textstatus);
	            console.log(errorthrown);
            }
            if(xmlhttprequest.status === 401) {
				// 自动登录的方法
				checkLogin();
			}
			if(xmlhttprequest.status === 403) {
				mui.openWindow({
					url: "login.html"
				});
			}
        }
	});
}

//下拉刷新
mui.init({
	pullRefresh: {
		container: '#pullrefresh',
		/*down: {
			callback: pulldownRefresh
		},*/
		up: {
			contentrefresh: '正在加载...',
			callback: pullupRefresh
		}
	}
});
function pullupRefresh() {
	setTimeout(function() {
		ajaxAsk(pageUrl);
	}, 1500);
}

if(mui.os.plus) {
	mui.plusReady(function() {
		setTimeout(function() {
			mui('#pullrefresh').pullRefresh().pullupLoading();
		}, 1000);

	});
} else {
	mui.ready(function() {
		mui('#pullrefresh').pullRefresh().pullupLoading();
	});
}

mui.plusReady(function(){
	plusReady();
	mui.init();
});