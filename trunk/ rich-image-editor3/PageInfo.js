/************************************************************************/
/* CrimShield.com - ImageEditor 		                                */
/* ==========================================                           */
/*  PageInfo.js  verison 2.20     		                                */
/*                                                                      */
/* Written by Peter Frueh (http://www.ajaxprogrammer.com/)              */
/* Copyright (C) 2004-2006 under GNU Lesser General Public         		*/
/*	Modified by Richie Bartlett Jr 										*/
/*                                                                      */
/************************************************************************/
try{
PageInfo = {
	getResolutionWidth  : function() { return self.screen.width; },
	getResolutionHeight : function() { return self.screen.height; },
	getColorDepth       : function() { return self.screen.colorDepth; },

	getScrollLeft       : function() { var scrollLeft = 0; if (document.documentElement && document.documentElement.scrollLeft && document.documentElement.scrollLeft != 0) { scrollLeft = document.documentElement.scrollLeft; } if (document.body && document.body.scrollLeft && document.body.scrollLeft != 0) { scrollLeft = document.body.scrollLeft; } if (window.pageXOffset && window.pageXOffset != 0) { scrollLeft = window.pageXOffset; } return scrollLeft; },

	getScrollTop        : function() { 
			var scrollTop = 0;
			if (document.documentElement && document.documentElement.scrollTop && document.documentElement.scrollTop != 0) {
				scrollTop = document.documentElement.scrollTop;
			}
			if (document.body && document.body.scrollTop && document.body.scrollTop != 0) {
				scrollTop = document.body.scrollTop; 
			}
			if (window.pageYOffset && window.pageYOffset != 0) {
				scrollTop = window.pageYOffset;
			} return scrollTop;
		},

	getDocumentWidth    : function() { var documentWidth = 0; var w1 = document.body.scrollWidth; var w2 = document.body.offsetWidth; if (w1 > w2) { documentWidth = document.body.scrollWidth; } else { documentWidth = document.body.offsetWidth; } return documentWidth; },

	getDocumentHeight   : function() { var documentHeight = 0; var h1 = document.body.scrollHeight; var h2 = document.body.offsetHeight; if (h1 > h2) { documentHeight = document.body.scrollHeight; } else { documentHeight = document.body.offsetHeight; } return documentHeight; },

	getVisibleWidth     : function() { var visibleWidth = 0; if (self.innerWidth) { visibleWidth = self.innerWidth; } else if (document.documentElement && document.documentElement.clientWidth) { visibleWidth = document.documentElement.clientWidth; } else if (document.body) { visibleWidth = document.body.clientWidth; } return visibleWidth; },

	getVisibleHeight    : function() { var visibleHeight = 0; if (self.innerHeight) { visibleHeight = self.innerHeight; } else if (document.documentElement && document.documentElement.clientHeight) { visibleHeight = document.documentElement.clientHeight; } else if (document.body) { visibleHeight = document.body.clientHeight; } return visibleHeight; },

	getElementLeft      : function(element) { var element = (typeof element == "string") ? document.getElementById(element) : element; var left = element.offsetLeft; var oParent = element.offsetParent; while (oParent != null) { left+= oParent.offsetLeft; oParent = oParent.offsetParent; } return left; },

	getElementTop       : function(element) { var element = (typeof element == "string") ? document.getElementById(element) : element; var top = element.offsetTop; var oParent = element.offsetParent; while (oParent != null) { top+= oParent.offsetTop; oParent = oParent.offsetParent; } return top; },

	getElementWidth     : function(element) { var element = (typeof element == "string") ? document.getElementById(element) : element; return element.offsetWidth; },

	getElementHeight    : function(element) { var element = (typeof element == "string") ? document.getElementById(element) : element; return element.offsetHeight; },

	getMouseX           : function() { return PageInfo.mouseX; },
	getMouseY           : function() { return PageInfo.mouseY; },


	// HELPER CODE FOR TRACKING MOUSE POSITION
	mouseX: 0,
	mouseY: 0,
	onMouseMove: function(e) { e = (!e) ? window.event : e; PageInfo.mouseX = e.clientX+PageInfo.getScrollLeft(); PageInfo.mouseY = e.clientY+PageInfo.getScrollTop(); },
	objTarget:		null,
	isLeftClick:	false,
	isMiddleClick:	false,
	isRightClick: 	false,
	isCtrlKey:		false,
	isAltKey:		false,
	isShiftKey:		false,
	pressedKeyCode:	0,
	isMouseDown:	false,
	mouseTrack:	function(e){
			var isMSIE=(navigator.appName.toUpperCase()=="MICROSOFT INTERNET EXPLORER");
			e = (!e)? window.event : e;
			PageInfo.isMouseDown = true;
			PageInfo.objTarget=(e.target)? e.target:e.srcElement;
			//defeat Safari bug
			PageInfo.objTarget=(PageInfo.objTarget.nodeType==3)? PageInfo.objTarget.parentNode:PageInfo.objTarget;
			PageInfo.isRightClick=(e.which)? (e.which == 3):(e.button)? (e.button == 2):false;
			PageInfo.isLeftClick =e.button==(isMSIE?1:0);
			PageInfo.isMiddleClick=e.button==(isMSIE?4:1);
			if(isMSIE){
				PageInfo.isCtrlKey=e.ctrlKey;
				PageInfo.isAltKey=e.altKey||e.metaKey;
				PageInfo.isShiftKey=e.shiftKey;
				e.cancelBubble=true;//free up memory
				//e.returnValue=false;
			}else{
				PageInfo.isCtrlKey=typeof(e.modifiers)=="undefined" ? e.ctrlKey : e.modifiers & Event.CONTROL_MASK;
				PageInfo.isAltKey=typeof(e.modifiers)=="undefined" ? e.altKey : e.modifiers & Event.ALT_MASK;
				PageInfo.isShiftKey=typeof(e.modifiers)=="undefined" ? e.shiftKey : e.modifiers & Event.SHIFT_MASK;
				e.stopPropagation();//free up memory
				e.preventDefault();
			}//end if MSIE
		},
	keyTrack:	function(e){
			e = (!e) ? window.event : e;
			pressedKeyCode = (e.keyCode) ? e.keyCode : (e.which) ? e.which : null;
			if(isMSIE){
				PageInfo.isCtrlKey=e.ctrlKey;
				PageInfo.isAltKey=e.altKey||e.metaKey;
				PageInfo.isShiftKey=e.shiftKey;
				e.cancelBubble=true;//free up memory
				//e.returnValue=false;
			}else{
				PageInfo.isCtrlKey=typeof(e.modifiers)=="undefined" ? e.ctrlKey : e.modifiers & Event.CONTROL_MASK;
				PageInfo.isAltKey=typeof(e.modifiers)=="undefined" ? e.altKey : e.modifiers & Event.ALT_MASK;
				PageInfo.isShiftKey=typeof(e.modifiers)=="undefined" ? e.shiftKey : e.modifiers & Event.SHIFT_MASK;
				e.stopPropagation();//free up memory
				e.preventDefault();
			}//end if MSIE
		}
};
if(document.addEventListener){
	document.addEventListener("mousemove", PageInfo.onMouseMove, false);
	document.addEventListener("mousedown", PageInfo.mouseTrack, false);
	document.addEventListener("mouseup", function(){ PageInfo.isMouseDown = false; }, false);
	document.addEventListener("keyup", PageInfo.keyTrack, false);
}else if(document.attachEvent){
	document.attachEvent("onmousemove", PageInfo.onMouseMove);
	document.attachEvent("onmousedown", PageInfo.mouseTrack);
	document.attachEvent("onmouseup", function(){ PageInfo.isMouseDown = false; });
	document.attachEvent("keyup", PageInfo.keyTrack);
}//end if event handle
}catch(e){
	var ErrorMSG="";
	ErrorMSG+="\nPageInfo data strut failed.";
	ErrorMSG+="\n\nReason:  "+ e.message;
	ErrorMSG+="\nNumber:  "+ (e.number & 0xFFFF);
	ErrorMSG+="\n\n Click OK to continue... ";
	alert(ErrorMSG);
}//end try
