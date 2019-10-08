function handleImg(img, Orientation, canvas, h, w) {
	if ("undefined" == typeof Orientation) {
		$(canvas).attr({
			width: h,
			height: w
		});
		rotateImg(img, 0, canvas); 	
	} else {
		switch (Orientation) {
			case 6: //需要顺时针（向左）90度旋转  
				console.info('需要顺时针（向左）90度旋转');
				$(canvas).attr({
					width: h,
					height: w
				});
				rotateImg(img, 1, canvas);
				break;
			case 8: //需要逆时针（向右）90度旋转  
				console.log('需要逆时针（向右）90度旋转  ');
				$(canvas).attr({
					width: h,
					height: w
				});
				rotateImg(img, 3, canvas);
				break;
			case 3: //需要180度旋转  
				console.log('需要180度旋转');
				$(canvas).attr({
					width: h,
					height: w
				});
				rotateImg(img, 2, canvas); //转两次  							
				break;
			default:
				$(canvas).attr({
					width: h,
					height: w
				});
				rotateImg(img, 0, canvas); //转两次  							
				break;
		}
	}
}
//对图片旋转处理 added by lzk  
function rotateImg(img, direction, canvas) {
	//最小与最大旋转方向，图片旋转4次后回到原方向    
	var min_step = 0;
	var max_step = 3;
	//var img = document.getElementById(pid);    
	if (img == null) return;
	//img的高度和宽度不能在img元素隐藏后获取，否则会出错    
	var height = img.height;
	var width = img.width;
	//var step = img.getAttribute('step');    
	var step = 2;
	step = direction;
	//旋转角度以弧度值为参数    
	var degree = step * 90 * Math.PI / 180;
	var ctx;
	ctx = canvas.getContext('2d');
	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate(degree);
	ctx.translate(-canvas.height / 2, -canvas.width / 2);
	ctx.drawImage(img, 0, 0, canvas.height, canvas.width);
	ctx.restore();
}