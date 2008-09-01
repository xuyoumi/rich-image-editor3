/************************************************************************/
/* CrimShield.com - ImageEditor 		                                */
/* ==========================================                           */
/*  ImageEditor.js  verison 2.21     		                            */
/*                                                                      */
/*	Written by Richie Bartlett Jr 										*/
/*  This script handles the client-side actions: marquee & mouseDrag	*/
/*                                                                      */
/* 		Copyright 2007. ALL RIGHTS RESERVED. CrimShield.com				*/
/************************************************************************/
// PageInfo.js is required (loaded before this script)


/*************
ImageEditor.imageName 			= string; name of the image
ImageEditor.w					= int; width of image
ImageEditor.h					= int; height of image
ImageEditor.X					= int; x co-ord of marquee
ImageEditor.Y					= int; y co-ord of marquee
ImageEditor.startX				= int; x-start position of Cursor
ImageEditor.startY				= int; y-start position of Cursor
ImageEditor.canvasX				= int; x co-ord of imageCanvas
ImageEditor.canvasY				= int; y co-ord of imageCanvas
ImageEditor.mouseIsdown			= boolean state of mouse click
ImageEditor.loadingTextInterval	= int; "loading..." msg timer (in milliseconds)
ImageEditor.loaderImage			= object; holder for image
ImageEditor.imgSize_orig		= float; size of orig image file (in KB)
ImageEditor.imgSize_edit		= float; size of edit image file (in KB)
ImageEditor.max_imageH 			= max px height allowed
ImageEditor.max_imageW 			= max px width allowed
ImageEditor.imageWH_tolerance	= allowed tolerance to exceed max w & h
**************/

IEW_interfaceType=null;  //null=test; basic=(forces 1 save only); cspro=(no force; different presentation and wording)

ImageEditor ={
	imageName: "",
	w: 0,
	h: 0,
	X: 0,
	Y: 0,
	startX: 0,
	startY: 0,
	imageX: 0,
	imageY: 0,
	mouseIsDown: false,
	loadingTextInterval: 0,
	loaderImage: document.createElement("img"),
	validDimension: /^\d{1,4}$/,
	imgSize_orig: 0,
	imgSize_edit: 0,
	max_imageH : 450,
	max_imageW : 450,
	imageWH_tolerance:0.15
};


ImageEditor.processImage = function(args){
	if(ImageEditor.marqueeSquare){
		ImageEditor.marqueeSquare.style.display = "none";
		ImageEditor.hideInfo_Marquee();
	}
	ImageEditor.showLoading();
	var request = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	var requestString="";
	if(IEW_interfaceType=="test" || IEW_interfaceType==null){
		requestString="processImage.php";
	}else if(IEW_interfaceType=="cspro" || IEW_interfaceType=="basic"){
		requestString="ImageEditor/processImage.php";
	}//end if IEW_interfaceType
	request.open("POST", requestString, true);
	request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	request.onreadystatechange = function(){
		if(request.readyState == 4 && request.status==200){
			var imgEd_pi_response = request.responseText;
//alert("ImageEditor.processImage::imgEd_pi_response="+imgEd_pi_response);
			if(imgEd_pi_response!="" && imgEd_pi_response.substring(0,1)=="{"){
				imgEd_pi_response = eval("("+imgEd_pi_response+")");
				if(imgEd_pi_response.imageFound){
					ImageEditor.imageName = imgEd_pi_response.imageName;
					ImageEditor.w = imgEd_pi_response.w;
					ImageEditor.h = imgEd_pi_response.h;
					ImageEditor.imgSize_orig = imgEd_pi_response.imgSize_orig;
					ImageEditor.imgSize_edit = imgEd_pi_response.imgSize_edit;
					ImageEditor.max_imageH =imgEd_pi_response.maxHeight;
					ImageEditor.max_imageW =imgEd_pi_response.maxWidth;
					ImageEditor.imageWH_tolerance =imgEd_pi_response.tolerance;
					ImageEditor.loadImage();
				}else{
					document.getElementById("ImageEditorCanvas").innerHTML = '<span style="font-size:16px;font-weight: bold;color:red;">Image was not found.</span>';
				}//end if imageFound
			}else{
				document.getElementById("ImageEditorCanvas").innerHTML = '<span style="font-size:16px;font-weight: bold;color:red;">ERROR: processImage.php didn\'t pass the image data...'+imgEd_pi_response+'</span>';
			}//end if imgEd_pi_response
		}//end if readyState
	};//end func onreadystatechange
	request.send("imageName="+ImageEditor.imageName+ ((args)? "&"+args:""));
};//end function ImageEditor.processImage


ImageEditor.loadImage = function(){
	var requestString="";
	if(IEW_interfaceType=="cspro" || IEW_interfaceType=="basic"){
		requestString="ImageEditor/";
	}//end if IEW_interfaceType
	ImageEditor.loaderImage.setAttribute("src", requestString+"getImage.php?imageName="+ImageEditor.imageName+"&t="+(new Date).getTime());
	ImageEditor.hideMarquee();
};


ImageEditor.displayImage = function(){
	clearInterval(ImageEditor.loadingTextInterval);
try{
	var editorImage = document.getElementById("ImageEditorCanvas");
	var editorWindow = document.getElementById("ImageEditorWindow");
	editorImage.innerHTML = "&nbsp;";
	editorImage.style.width = ImageEditor.w+"px";
	editorImage.style.height = ImageEditor.h+"px";
	ImageEditor.canvasX = PageInfo.getElementLeft(ImageEditor.editorImage);
	ImageEditor.canvasY = PageInfo.getElementTop(ImageEditor.editorImage);
	editorImage.style.backgroundImage = "url("+ImageEditor.loaderImage.getAttribute('src')+")";
	editorImage.style.cursor = "default";
	editorWindow.style.width=Math.round(ImageEditor.max_imageW+ImageEditor.max_imageW*ImageEditor.imageWH_tolerance)+15 +"px";
	editorWindow.style.height=Math.round(ImageEditor.max_imageH+ImageEditor.max_imageH*ImageEditor.imageWH_tolerance)+15 +"px";
	editorWindow.scrollLeft=0;
	editorWindow.scrollTop=0;
	if(ImageEditor.w>ImageEditor.max_imageH || ImageEditor.h>ImageEditor.max_imageW){
		editorWindow.style.overflow="scroll";
	}else{
		editorWindow.style.overflow="hidden";
	}//end if image bigger than view space

	ImageEditor.showInfo_file(ImageEditor.imgSize_orig, ImageEditor.imgSize_edit);
	document.getElementById("ImageEditorTxtWidth").value = ImageEditor.w;
	document.getElementById("ImageEditorTxtHeight").value = ImageEditor.h;
	document.getElementById("ImageEditorScalePercent").value=100;
}catch(e){
	var ErrorMSG="";
	ErrorMSG+="\nImageEditor.displayImage failed.";
	ErrorMSG+="\n\nReason:  "+ e.message;
	ErrorMSG+="\nNumber:  "+ (e.number & 0xFFFF);
	ErrorMSG+="\n\n Click OK to continue... ";
	alert(ErrorMSG);
}//end try
};


ImageEditor.showLoading = function(){
	var editorWindow = document.getElementById("ImageEditorWindow");
	var editorImage = document.getElementById("ImageEditorCanvas");
	editorWindow.scrollLeft=0;
	editorWindow.scrollTop=0;
	editorImage.style.backgroundImage = "none";
	ImageEditor.loaderImage.style.visibility="hidden";
	editorImage.style.cursor = "progress";
	editorImage.innerHTML =
		'<div id="ImageEditorLoadingText">Rendering Image<span id="ellipsis">...</span></div>';
	ImageEditor.loadingTextInterval = setInterval(function(){
		if(document.getElementById("ellipsis")){
			var dots = document.getElementById("ellipsis").innerHTML;
			document.getElementById("ellipsis").innerHTML = (dots != "...") ? dots+= "." : "";
		}
	}, 700);
};


ImageEditor.selectPercentKeyup = function(){
	var percent=parseInt(document.getElementById('ImageEditorScalePercent').value)/100;
	document.getElementById('ImageEditorTxtHeight').value=Math.round(ImageEditor.h *percent);
	document.getElementById('ImageEditorTxtWidth').value=Math.round(ImageEditor.w *percent);
	ImageEditor.txtWidthKeyup();
}//end function selectPercentKeyup


ImageEditor.txtWidthKeyup = function(){
	if(document.getElementById("ImageEditorChkConstrain").value!=1){ return; }
	var w = document.getElementById("ImageEditorTxtWidth").value;
	if(ImageEditor.validDimension.test(w)){
		document.getElementById("ImageEditorTxtWidth").value = parseInt(w);
		document.getElementById("ImageEditorTxtHeight").value = parseInt((w * ImageEditor.h)/ImageEditor.w);
	}else if(w == ""){
		document.getElementById("ImageEditorTxtHeight").value = "";	
	}else{
		document.getElementById("ImageEditorTxtWidth").value = w.replace(/[^0-9]/g, "");
	}
};


ImageEditor.txtHeightKeyup = function(){
	if(document.getElementById("ImageEditorChkConstrain").value!=1){ return; }
	var h = document.getElementById("ImageEditorTxtHeight").value;
	if(ImageEditor.validDimension.test(h)){
		document.getElementById("ImageEditorTxtHeight").value = parseInt(h);
		document.getElementById("ImageEditorTxtWidth").value = parseInt((h * ImageEditor.w)/ImageEditor.h);	
	}else if(h == ""){
		document.getElementById("ImageEditorTxtWidth").value = "";
	}else{
		document.getElementById("ImageEditorTxtHeight").value = h.replace(/[^0-9]/g, "");	
	}
};


ImageEditor.txtBlur = function(){
	var w = document.getElementById("ImageEditorTxtWidth").value;
	var h = document.getElementById("ImageEditorTxtHeight").value;
	if(!ImageEditor.validDimension.test(w) || !ImageEditor.validDimension.test(h)){
		document.getElementById("ImageEditorTxtWidth").value = ImageEditor.w;
		document.getElementById("ImageEditorTxtHeight").value = ImageEditor.h;	
	}
};


ImageEditor.resize = function(){
	var w = document.getElementById("ImageEditorTxtWidth").value;
	var h = document.getElementById("ImageEditorTxtHeight").value;
	if(w==ImageEditor.w || h==ImageEditor.h) return; //no change made
	
	if(!ImageEditor.validDimension.test(w) || !ImageEditor.validDimension.test(h)){
		alert("The image dimensions are not valid.");
		document.getElementById("ImageEditorTxtWidth").value = ImageEditor.w;
		document.getElementById("ImageEditorTxtHeight").value = ImageEditor.h;
		return;
	}
	var editorWindow = document.getElementById("ImageEditorWindow");
	if(w > parseInt(editorWindow.style.width) || h > parseInt(editorWindow.style.height)){
		alert("Width can't exceed "+
			  parseInt(editorWindow.style.width)+
			  " pixels and height can't exceed "+
			  parseInt(editorWindow.style.height)+
			  " pixels.\n\nPlease select a smaller size to resize your image..");
		document.getElementById("ImageEditorTxtWidth").value = ImageEditor.w;
		document.getElementById("ImageEditorTxtHeight").value = ImageEditor.h;
		document.getElementById("ImageEditorScalePercent").value=100;
		return;
	}

//alert('ImageEditor.processImage("action=resize&w='+w+'&h='+h);
	ImageEditor.processImage("action=resize&w="+w+"&h="+h);
	document.getElementById("ImageEditorScalePercent").value=100;
};


ImageEditor.mirror = function(direction){
	ImageEditor.processImage("action=mirror&direction="+direction);
};


ImageEditor.rotate = function(degrees){
	ImageEditor.processImage("action=rotate&degrees="+degrees);
};


ImageEditor.viewOriginal = function(){
	ImageEditor.processImage("action=viewOriginal");
};


ImageEditor.openImage = function(){
	if(IEW_interfaceType=="basic" || IEW_interfaceType=="cspro"){
		try{
			actionSelect("yes");
		}catch(e){}
	}//end if IEW_interfaceType
	if(IEW_interfaceType=="test" || IEW_interfaceType==null){
		try{
			alert("ImageEditor.openImage function(){//...}");
		}catch(e){}
	}//end if IEW_interfaceType
};


ImageEditor.cleanUpFiles = function(){
	ImageEditor.processImage("action=cleanUp");
	ImageEditor.hideMarquee();
	ImageEditor.hideInfo_mouseXY();
};


ImageEditor.save = function(){
	ImageEditor.processImage("action=save");
	ImageEditor.hideMarquee();
	ImageEditor.hideInfo_mouseXY();
	if(IEW_interfaceType=="basic"){
		//document.location.href='home.php?usePhoto=1&DOcrimPhoto=1';
		try{
			document.getElementById('changePhoto').value=(confirm("This photo will appear in your profile and in our verification process.  Do you accept?\n\nNOTE: your profile will remain \"Not Verified\" until you accept it for verification")? 1:'');
			document.getElementById('photoReSave').value=1;//force DB resave
			document.getElementById("editorz").submit();
		}catch(e){}
	}//end if IEW_interfaceType
	if(IEW_interfaceType=="cspro"){
		try{
			document.getElementById('photoReSave').value=(confirm("Are you finished editing this Photo?")? 1:0);
			document.getElementById('changePhoto').value=1;//verify photo
			if(document.getElementById('photoReSave').value==1) document.getElementById("editorz").submit();
		}catch(e){}
	}//end if IEW_interfaceType
};


ImageEditor.crop = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	if(ImageEditor.marqueeSquare.style.display == "none"){
		alert("You must select an area to crop before using this feature.");
		return;
	}//end if marquee visible
	ImageEditor.X = parseInt(ImageEditor.marqueeSquare.style.left);
	ImageEditor.Y = parseInt(ImageEditor.marqueeSquare.style.top);
	var editorWindow = document.getElementById("ImageEditorWindow");
	var x = ImageEditor.X - ImageEditor.canvasX;
	var y = ImageEditor.Y - ImageEditor.canvasY;
	var w = parseInt(ImageEditor.marqueeSquare.style.width);
	var h = parseInt(ImageEditor.marqueeSquare.style.height);

	//does marquee go outside canvas boundaries?
	if(x<=0 && y<=0 && ImageEditor.X+w>ImageEditor.canvasX+ImageEditor.w &&
		ImageEditor.Y+h>ImageEditor.canvasY+ImageEditor.h){
		ImageEditor.hideMarquee();
		return; //w&h didn't change...
	}//end if outside all corners
	if(ImageEditor.X+w>ImageEditor.canvasX+ImageEditor.w){
		w=ImageEditor.canvasX+ImageEditor.w-ImageEditor.X;
	}//end if w exceeds canvas area
	if(ImageEditor.Y+h>ImageEditor.canvasY+ImageEditor.h){
		h=ImageEditor.canvasY+ImageEditor.h-ImageEditor.Y;
	}//end if w exceeds canvas area
	if(x<0 && ImageEditor.X+w>ImageEditor.canvasX+ImageEditor.w){
		w = parseInt(ImageEditor.marqueeSquare.style.width);
	}//end if marquee is outside both Left & right sides
	if(y<0 && ImageEditor.Y+h>ImageEditor.canvasY+ImageEditor.h){
		h = parseInt(ImageEditor.marqueeSquare.style.height);
	}//end if marquee is outside both Top & Bottom sides

	//compensate for the scrollbar
	x+=editorWindow.scrollLeft;
	y+=editorWindow.scrollTop;

	if(x<0) x=0;
	if(y<0) y=0;

//alert('ImageEditor.processImage("action=crop&x='+x+'&y='+y+'&w='+w+'&h='+h);
	ImageEditor.hideMarquee();
	if(w<1 || h<1) return; //nothing to crop
	ImageEditor.processImage("action=crop&x="+x+"&y="+y+"&w="+w+"&h="+h);
};


ImageEditor.marqueeAnchor = function(){
	if(typeof ImageEditor == "undefined") return;
	if(ImageEditor.marqueeSquare.style.display == "none"){ ImageEditor.hideMarquee(); }
	var w = parseInt(ImageEditor.marqueeSquare.style.width);
	var h = parseInt(ImageEditor.marqueeSquare.style.height);
	ImageEditor.X=parseInt(ImageEditor.marqueeSquare.style.left);
	ImageEditor.Y=parseInt(ImageEditor.marqueeSquare.style.top);

	if(w<15 && h<15) return;//end if marquee is too small
	var anchorW =0;
	var anchorH =0;
	with(ImageEditor.marqueeAnchorNW.style){
		anchorW = parseInt(ImageEditor.marqueeAnchorNW.style.width);
		anchorH = parseInt(ImageEditor.marqueeAnchorNW.style.height);
		left = (ImageEditor.X-anchorW+2)+"px";
		top = (ImageEditor.Y-anchorH+2)+"px";
		display = "block";
	}
	with(ImageEditor.marqueeAnchorNE.style){
		anchorW = parseInt(ImageEditor.marqueeAnchorNE.style.width);
		anchorH = parseInt(ImageEditor.marqueeAnchorNE.style.height);
		left = (ImageEditor.X+w-2)+"px";
		top = (ImageEditor.Y-anchorH+2)+"px";
		display = "block";
	}
	with(ImageEditor.marqueeAnchorSW.style){
		anchorW = parseInt(ImageEditor.marqueeAnchorSW.style.width);
		anchorH = parseInt(ImageEditor.marqueeAnchorSW.style.height);
		left = (ImageEditor.X-anchorW+2)+"px";
		top = (ImageEditor.Y+h-2)+"px";
		display = "block";
	}
	with(ImageEditor.marqueeAnchorSE.style){
		anchorW = parseInt(ImageEditor.marqueeAnchorSE.style.width);
		anchorH = parseInt(ImageEditor.marqueeAnchorSE.style.height);
		left = (ImageEditor.X+w-2)+"px";
		top = (ImageEditor.Y+h-2)+"px";
		display = "block";
	}
	with(ImageEditor.marqueeAnchorCenter.style){
		width = w/2+"px";
		height = h/2+"px";
		left = ImageEditor.X +w/4+"px";
		top = ImageEditor.Y +h/4+"px";
		display = "block";
	}
	with(ImageEditor.marqueeAnchorCenterButton.style){
		anchorW = parseInt(ImageEditor.marqueeAnchorCenterButton.style.width);
		anchorH = parseInt(ImageEditor.marqueeAnchorCenterButton.style.height);
		left = (ImageEditor.X+(w/2)-anchorW)+"px";
		top = (ImageEditor.Y+(h/2)-anchorH)+"px";
		if(w>24 || h>24){//marquee needs to be big enough for center
			display = "block";
		}else{
			display = "none";
		}//end if w/h
	}
};


ImageEditor.dragMarqueeAnchorNW = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	if(!ImageEditor.mouseIsDown){ return; }
	if(ImageEditor.marqueeSquare.style.display == "none"){ return; }
	var w = parseInt(ImageEditor.marqueeSquare.style.width);
	var h = parseInt(ImageEditor.marqueeSquare.style.height);
	if(w<15 && h<15) return;//end if marquee is too small

	ImageEditor.X = parseInt(ImageEditor.marqueeSquare.style.left);
	ImageEditor.Y = parseInt(ImageEditor.marqueeSquare.style.top);
	ImageEditor.startX=ImageEditor.X+w;
	ImageEditor.startY=ImageEditor.Y+h;

	ImageEditor.dragMarquee();
};


ImageEditor.dragMarqueeAnchorNE = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	if(!ImageEditor.mouseIsDown){ return; }
	if(ImageEditor.marqueeSquare.style.display == "none"){ return; }
	var w = parseInt(ImageEditor.marqueeSquare.style.width);
	var h = parseInt(ImageEditor.marqueeSquare.style.height);
	if(w<15 && h<15) return;//end if marquee is too small

	ImageEditor.X = parseInt(ImageEditor.marqueeSquare.style.left);
	ImageEditor.Y = parseInt(ImageEditor.marqueeSquare.style.top);
	ImageEditor.startX=ImageEditor.X;
	ImageEditor.startY=ImageEditor.Y+h;

	ImageEditor.dragMarquee();
};


ImageEditor.dragMarqueeAnchorSW = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	if(!ImageEditor.mouseIsDown){ return; }
	if(ImageEditor.marqueeSquare.style.display == "none"){ return; }
	var w = parseInt(ImageEditor.marqueeSquare.style.width);
	var h = parseInt(ImageEditor.marqueeSquare.style.height);
	if(w<15 && h<15) return;//end if marquee is too small

	ImageEditor.X = parseInt(ImageEditor.marqueeSquare.style.left);
	ImageEditor.Y = parseInt(ImageEditor.marqueeSquare.style.top);
	ImageEditor.startX=ImageEditor.X+w;
	ImageEditor.startY=ImageEditor.Y;

	ImageEditor.dragMarquee();
};


ImageEditor.dragMarqueeAnchorSE = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	if(!ImageEditor.mouseIsDown){ return; }
	if(ImageEditor.marqueeSquare.style.display == "none"){ return; }
	var w = parseInt(ImageEditor.marqueeSquare.style.width);
	var h = parseInt(ImageEditor.marqueeSquare.style.height);
	if(w<15 && h<15) return;//end if marquee is too small

	ImageEditor.X = parseInt(ImageEditor.marqueeSquare.style.left);
	ImageEditor.Y = parseInt(ImageEditor.marqueeSquare.style.top);
	ImageEditor.startX=ImageEditor.X;
	ImageEditor.startY=ImageEditor.Y;

	ImageEditor.dragMarquee();
};


ImageEditor.dragMarqueeAnchorC = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	if(!ImageEditor.mouseIsDown){ return; }
	if(ImageEditor.marqueeSquare.style.display == "none"){ return; }
	var w = parseInt(ImageEditor.marqueeSquare.style.width);
	var h = parseInt(ImageEditor.marqueeSquare.style.height);
	if(w<15 && h<15) return;//end if marquee is too small

	//update marquee position...
	ImageEditor.marqueeSquare.style.left = PageInfo.getMouseX() - (w/2)+"px";
	ImageEditor.marqueeSquare.style.top = PageInfo.getMouseY() - (h/2)+"px";
	ImageEditor.X=parseInt(ImageEditor.marqueeSquare.style.left);
	ImageEditor.Y=parseInt(ImageEditor.marqueeSquare.style.top);

	//force the anchor to keep up with the mouse
	ImageEditor.marqueeAnchor();
};


ImageEditor.hideMarquee = function(){
	ImageEditor.marqueeSquare.style.display = "none";
	ImageEditor.marqueeAnchorNW.style.display = "none";
	ImageEditor.marqueeAnchorNE.style.display = "none";
	ImageEditor.marqueeAnchorSW.style.display = "none";
	ImageEditor.marqueeAnchorSE.style.display = "none";
	ImageEditor.marqueeAnchorCenterButton.style.display = "none";
	ImageEditor.marqueeAnchorCenter.style.display = "none";
	ImageEditor.hideInfo_Marquee();
};


ImageEditor.startMarquee = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	with(ImageEditor.marqueeSquare.style){
		left = PageInfo.getMouseX()+"px";
		top = PageInfo.getMouseY()+"px";
		width = "1px";
		height = "1px";
		display = "block";
	}
	ImageEditor.startX = PageInfo.getMouseX();
	ImageEditor.startY = PageInfo.getMouseY();
	ImageEditor.marqueeAnchor();
};


ImageEditor.dragMarquee = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	if(!ImageEditor.mouseIsDown){ return; }

	// mouse is to the right of starting point
	if(PageInfo.getMouseX() - ImageEditor.startX > 0){
		ImageEditor.marqueeSquare.style.width = PageInfo.getMouseX() - ImageEditor.startX+"px";
	} else{ // mouse is to the left of starting point
		ImageEditor.marqueeSquare.style.left = PageInfo.getMouseX()+"px";
		ImageEditor.marqueeSquare.style.width = ImageEditor.startX - PageInfo.getMouseX()+"px";
	}
	// mouse is below the starting point
	if(PageInfo.getMouseY() - ImageEditor.startY > 0){
		ImageEditor.marqueeSquare.style.height = PageInfo.getMouseY() - ImageEditor.startY+"px";
	} else { // mouse is above the starting point
		ImageEditor.marqueeSquare.style.top = PageInfo.getMouseY()+"px";
		ImageEditor.marqueeSquare.style.height = ImageEditor.startY - PageInfo.getMouseY()+"px";
	}
	ImageEditor.X=parseInt(ImageEditor.marqueeSquare.style.left);
	ImageEditor.Y=parseInt(ImageEditor.marqueeSquare.style.top);
	ImageEditor.showInfo_Marquee(parseInt(ImageEditor.marqueeSquare.style.width), parseInt(ImageEditor.marqueeSquare.style.height));
	ImageEditor.marqueeAnchor();
};


ImageEditor.slideMarquee = function(e){
	if(ImageEditor.marqueeSquare.style.display == "none"){ return; }
	e = e || event;
	var code = (e.keyCode) ? e.keyCode : (e.which) ? e.which : null;
	if(!code){ return };
	switch(code){
		case 37: //left
			if(PageInfo.getElementLeft(ImageEditor.marqueeSquare) > PageInfo.getElementLeft(ImageEditor.editorImage)){
				ImageEditor.marqueeSquare.style.left = PageInfo.getElementLeft(ImageEditor.marqueeSquare) - 1+"px";
			}
			break;
		case 38: //up
			if(PageInfo.getElementTop(ImageEditor.marqueeSquare) > PageInfo.getElementTop(ImageEditor.editorImage)){
				ImageEditor.marqueeSquare.style.top = PageInfo.getElementTop(ImageEditor.marqueeSquare) - 1+"px";
			}		
			break;
		case 39: //right
			if(PageInfo.getElementLeft(ImageEditor.marqueeSquare)+PageInfo.getElementWidth(ImageEditor.marqueeSquare) < PageInfo.getElementLeft(ImageEditor.editorImage)+PageInfo.getElementWidth(ImageEditor.editorImage)){
				ImageEditor.marqueeSquare.style.left = PageInfo.getElementLeft(ImageEditor.marqueeSquare)+1+"px";
			}
			break;
		case 40: //down
			if(PageInfo.getElementTop(ImageEditor.marqueeSquare)+PageInfo.getElementHeight(ImageEditor.marqueeSquare) < PageInfo.getElementTop(ImageEditor.editorImage)+PageInfo.getElementHeight(ImageEditor.editorImage)){
				ImageEditor.marqueeSquare.style.top = PageInfo.getElementTop(ImageEditor.marqueeSquare)+1+"px";
			}		
			break;
		case 27://Escape
			ImageEditor.hideMarquee();
			break;
    // 8 BackSpace 
    // 9 Tab 
	// 16 shift
	// 17 control
	// 20 capslock
    // 32 Space 
    // 45 Insert 
    // 46 Delete 
    // 35 End 
    // 36 Home 
    // 33 PageUp 
    // 34 PageDown 
	}//end switch code
	if(code>36 && code<41){
		ImageEditor.startX=parseInt(ImageEditor.marqueeSquare.style.left);
		ImageEditor.startY=parseInt(ImageEditor.marqueeSquare.style.top);
		ImageEditor.marqueeAnchor();
	}//end if arrow key
};


ImageEditor.showInfo_Marquee = function(w, h){
	document.getElementById("ImageEditorCropSize").innerHTML ="<span style='font-size: 10px;color:#000000;'>"+ w+"<br>"+h+"</span>";
};


ImageEditor.showInfo_file = function(IMGorig, IMGedit){
	document.getElementById("ImageEditorFileSize").innerHTML ="<span style='font-size: 10px;color:#000000;'>"+  IMGedit+"KB / "+IMGorig+ "KB</span>";
};


ImageEditor.showInfo_mouseXY = function(){
	if(typeof ImageEditor == "undefined"){ return; }
	var imageX=PageInfo.getMouseX()-(isNaN(ImageEditor.canvasX)? 0:ImageEditor.canvasX)-1;
	var imageY=PageInfo.getMouseY()-(isNaN(ImageEditor.canvasY)? 0:ImageEditor.canvasY)-1;
	var editorWindow = document.getElementById("ImageEditorWindow");
	if(imageX>=0 && imageX<parseInt(editorWindow.style.width) && imageY>=0 && imageY<parseInt(editorWindow.style.height)){//mouse inside canvas
		//compensate for the scrolling
		imageX+=editorWindow.scrollLeft;
		imageY+=editorWindow.scrollTop;
		if(!isNaN(ImageEditor.canvasX)){//show ruler tracer
			ImageEditor.rulerXpx.style.top=ImageEditor.canvasY-parseInt(ImageEditor.rulerXpx.style.height)+"px";
			if(imageX>=0 && imageX<parseInt(editorWindow.style.width)){
				ImageEditor.rulerXpx.style.left=ImageEditor.canvasX+imageX+"px";
				ImageEditor.rulerXpx.style.display="block";
			}else{
				ImageEditor.rulerXpx.style.display="none";
			}//end if imageX
		}//end if canvasX
		if(!isNaN(ImageEditor.canvasY)){//show ruler tracer
			ImageEditor.rulerYpx.style.left=ImageEditor.canvasX-parseInt(ImageEditor.rulerYpx.style.width)+"px";
			if(imageY>=0 && imageY<parseInt(editorWindow.style.height)){
				ImageEditor.rulerYpx.style.top=ImageEditor.canvasY+imageY+"px";
				ImageEditor.rulerYpx.style.display="block";
			}else{
				ImageEditor.rulerYpx.style.display="none";
			}//end if imageX
		}//end if canvasX
	}else{
		ImageEditor.rulerXpx.style.display="none";
		ImageEditor.rulerYpx.style.display="none";
	}//end if XY>=0
	document.getElementById("ImageEditorMouseXY").innerHTML="<span style='font-size: 10px;color:#000000;'>"+ imageX+"<br>" +imageY+"</span>";
};


ImageEditor.hideInfo_Marquee = function(){
	document.getElementById("ImageEditorCropSize").innerHTML = "";
};


ImageEditor.hideInfo_file = function(){
	document.getElementById("ImageEditorFileSize").innerHTML = "";
};


ImageEditor.hideInfo_mouseXY = function(){
	document.getElementById("ImageEditorMouseXY").innerHTML = "";
};


ImageEditor.addEvent = function(obj, evt, func){
try{
	if(/safari/i.test(navigator.userAgent) && evt == "dblclick"){
		obj.ondblclick = func;
	}else if(window.addEventListener){
		obj.addEventListener(evt, func, false);
	}else if(window.attachEvent){
		obj.attachEvent("on"+evt, func);
	}//end if safari
}catch(e){
	var ErrorMSG="";
	ErrorMSG+="\nUnable to add event["+evt+"] for obj["+obj+"]";
	ErrorMSG+="\n\nReason:  "+ e.message;
	ErrorMSG+="\nNumber:  "+ (e.number & 0xFFFF);
	ErrorMSG+="\n\n Click OK to continue... ";
	alert(ErrorMSG);
}//end try
};


ImageEditor.init = function(imageName){
	ImageEditor.imageName = imageName || "";
	ImageEditor.processImage("action=viewActive"+(IEW_interfaceType=="basic" || IEW_interfaceType=="cspro" ? "&forceScaleSAVE=1":""));
	ImageEditor.loaderImage.onload = function(){ ImageEditor.displayImage(); };

	ImageEditor.editorImage = document.getElementById("ImageEditorCanvas");
	ImageEditor.canvasContainer = document.getElementById("IEW_canvasContainer");
	
	ImageEditor.marqueeSquare = document.createElement("div");
	with(ImageEditor.marqueeSquare.style){
		position = "absolute";
		zIndex = 12;
		border = "1px dotted #fff";
		display = "none";
	}//end with marqueeSquare.style
	
	ImageEditor.marqueeAnchorNW = document.createElement("div");
	with(ImageEditor.marqueeAnchorNW.style){
		position = "absolute";
		width = "8px";
		height = "8px";
		zIndex = 13;
		border = "3px solid #33F";
		borderTop = "none";
		borderLeft = "none";
		overflow = "hidden";
		display = "none";
	}//end with marqueeAnchorNW.style
	
	ImageEditor.marqueeAnchorNE = document.createElement("div");
	with(ImageEditor.marqueeAnchorNE.style){
		position = "absolute";
		width = "8px";
		height = "8px";
		zIndex = 14;
		border = "3px solid #33F";
		borderTop = "none";
		borderRight = "none";
		overflow = "hidden";
		display = "none";
	}//end with marqueeAnchorNE.style
	
	ImageEditor.marqueeAnchorSW = document.createElement("div");
	with(ImageEditor.marqueeAnchorSW.style){
		position = "absolute";
		width = "8px";
		height = "8px";
		zIndex = 15;
		border = "3px solid #33F";
		borderBottom = "none";
		borderLeft = "none";
		overflow = "hidden";
		display = "none";
	}//end with marqueeAnchorSW.style
	
	ImageEditor.marqueeAnchorSE = document.createElement("div");
	with(ImageEditor.marqueeAnchorSE.style){
		position = "absolute";
		width = "8px";
		height = "8px";
		zIndex = 16;
		border = "3px solid #33F";
		borderBottom = "none";
		borderRight = "none";
		overflow = "hidden";
		display = "none";
	}//end with marqueeAnchorSE.style
	
	ImageEditor.marqueeAnchorCenterButton = document.createElement("div");
	with(ImageEditor.marqueeAnchorCenterButton.style){//icon for grab&drag area
		position = "absolute";
		width = "10px";
		height = "10px";
		zIndex = 17;
		border = "4px groove #33F";
		overflow = "hidden";
		cursor = "move";
		display = "none";
	}//end with marqueeAnchorCenterButton.style

	ImageEditor.marqueeAnchorCenter = document.createElement("div");
	with(ImageEditor.marqueeAnchorCenter.style){//actual grab&drag area
		position = "absolute";
		width = "15px";
		height = "10px";
		zIndex = 18;
		border = "0px none #000";
		display = "none";
	}//end with marqueeAnchorCenter.style

	ImageEditor.rulerXpx = document.createElement("div");
	with(ImageEditor.rulerXpx.style){//icon for grab&drag area
		position = "absolute";
		width = "2px";
		height = "15px";
		zIndex = 30;
		backgroundColor="navy";
		overflow = "hidden";
		display = "none";
	}//end with rulerXpx.style

	ImageEditor.rulerYpx = document.createElement("div");
	with(ImageEditor.rulerYpx.style){//icon for grab&drag area
		position = "absolute";
		width = "15px";
		height = "2px";
		zIndex = 30;
		backgroundColor="navy";
		overflow = "hidden";
		display = "none";
	}//end with rulerYpx.style

	ImageEditor.balloonHelp = document.createElement("div");
	with(ImageEditor.balloonHelp.style){//textBox with Help info
		position: 'absolute';
		border: 'none';
		background: 'none';
		width: '300px';
		height: '240px';
		display: 'none';
	}//end with balloonHelp.style

	var bodyNode = document.getElementsByTagName("body").item(0);
	bodyNode.appendChild(ImageEditor.marqueeSquare);
	bodyNode.appendChild(ImageEditor.marqueeAnchorNW);
	bodyNode.appendChild(ImageEditor.marqueeAnchorNE);
	bodyNode.appendChild(ImageEditor.marqueeAnchorSW);
	bodyNode.appendChild(ImageEditor.marqueeAnchorSE);
	bodyNode.appendChild(ImageEditor.marqueeAnchorCenterButton);
	bodyNode.appendChild(ImageEditor.marqueeAnchorCenter);
	bodyNode.appendChild(ImageEditor.rulerXpx);
	bodyNode.appendChild(ImageEditor.rulerYpx);
	bodyNode.appendChild(ImageEditor.balloonHelp);
	ImageEditor.addEvent(document, "mousedown", function(){ if(PageInfo.isRightClick){return(false);}else{ImageEditor.mouseIsDown = true;}});
	ImageEditor.addEvent(document, "mouseup", function(){ ImageEditor.mouseIsDown = false; if(parseInt(ImageEditor.marqueeSquare.style.width)<10 && parseInt(ImageEditor.marqueeSquare.style.height)<10) ImageEditor.hideMarquee(); });
	ImageEditor.addEvent(document, "mousemove", ImageEditor.showInfo_mouseXY);
	ImageEditor.addEvent(ImageEditor.editorImage, "mouseover", function(){ ImageEditor.editorImage.style.cursor = "crosshair"; });
	ImageEditor.addEvent(ImageEditor.editorImage, "mousedown", ImageEditor.startMarquee);
	ImageEditor.addEvent(ImageEditor.editorImage, "mousemove", ImageEditor.dragMarquee);
	ImageEditor.addEvent(ImageEditor.canvasContainer, "mouseover", function(){ if(ImageEditor.imgSize_orig>0) ImageEditor.canvasContainer.style.cursor = "crosshair"; });
	ImageEditor.addEvent(ImageEditor.canvasContainer, "mousedown", function(){ if(ImageEditor.imgSize_orig>0) ImageEditor.startMarquee;});
	ImageEditor.addEvent(ImageEditor.canvasContainer, "mousemove", function(){ if(ImageEditor.imgSize_orig>0) ImageEditor.dragMarquee;});
	ImageEditor.addEvent(ImageEditor.marqueeSquare, "mousedown", ImageEditor.startMarquee);
	ImageEditor.addEvent(ImageEditor.marqueeSquare, "mousemove", ImageEditor.dragMarquee);


	ImageEditor.addEvent(ImageEditor.marqueeAnchorNW, "mouseover", function(){ImageEditor.marqueeAnchorNW.style.cursor = "nw-resize"; });
	ImageEditor.addEvent(ImageEditor.marqueeAnchorNW, "mousedown", ImageEditor.marqueeAnchor);
//	ImageEditor.addEvent(ImageEditor.marqueeAnchorNW, "mousemove", ImageEditor.dragMarqueeAnchorNW);
	ImageEditor.addEvent(ImageEditor.marqueeAnchorNE, "mouseover", function(){ImageEditor.marqueeAnchorNE.style.cursor = "ne-resize"; });
	ImageEditor.addEvent(ImageEditor.marqueeAnchorNE, "mousedown", ImageEditor.marqueeAnchor);
//	ImageEditor.addEvent(ImageEditor.marqueeAnchorNE, "mousemove", ImageEditor.dragMarqueeAnchorNE);
	ImageEditor.addEvent(ImageEditor.marqueeAnchorSW, "mouseover", function(){ImageEditor.marqueeAnchorSW.style.cursor = "sw-resize"; });
	ImageEditor.addEvent(ImageEditor.marqueeAnchorSW, "mousedown", ImageEditor.marqueeAnchor);
	ImageEditor.addEvent(ImageEditor.marqueeAnchorSW, "mousemove", ImageEditor.dragMarqueeAnchorSW);
	ImageEditor.addEvent(ImageEditor.marqueeAnchorSE, "mouseover", function(){ImageEditor.marqueeAnchorSE.style.cursor = "se-resize"; });
	ImageEditor.addEvent(ImageEditor.marqueeAnchorSE, "mousedown", ImageEditor.marqueeAnchor);
	ImageEditor.addEvent(ImageEditor.marqueeAnchorSE, "mousemove", ImageEditor.dragMarqueeAnchorSE);
	ImageEditor.addEvent(ImageEditor.marqueeAnchorCenter, "mouseover", function(){ImageEditor.marqueeAnchorCenter.style.cursor = "move"; });
	ImageEditor.addEvent(ImageEditor.marqueeAnchorCenter, "mousedown", ImageEditor.marqueeAnchor);
	ImageEditor.addEvent(ImageEditor.marqueeAnchorCenter, "mousemove", ImageEditor.dragMarqueeAnchorC);


	ImageEditor.addEvent(document, "dblclick", function(){ImageEditor.marqueeSquare.style.display = "none"; ImageEditor.hideMarquee();});
	ImageEditor.addEvent(document, "keydown", ImageEditor.slideMarquee);
//	ImageEditor.addEvent(document, "keydown", ImageEditor.marqueeAnchor);
	ImageEditor.addEvent(document.getElementById("ImageEditorTxtWidth"), "keyup", ImageEditor.txtWidthKeyup);
	ImageEditor.addEvent(document.getElementById("ImageEditorTxtWidth"), "blur", ImageEditor.txtBlur);
	ImageEditor.addEvent(document.getElementById("ImageEditorTxtHeight"), "keyup", ImageEditor.txtHeightKeyup);
	ImageEditor.addEvent(document.getElementById("ImageEditorTxtHeight"), "blur", ImageEditor.txtBlur);
	ImageEditor.addEvent(document.getElementById("ImageEditorScalePercent"), "keyup", ImageEditor.selectPercentKeyup);
	ImageEditor.addEvent(document.getElementById("ImageEditorScalePercent"), "blur", ImageEditor.selectPercentKeyup);
};//end function ImageEditor.init