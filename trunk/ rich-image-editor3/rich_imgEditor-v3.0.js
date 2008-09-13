Ext.namespace('Ext.QoDesk.rich_imgEditor');
/**
 * Image Editor 3.0
 *
 * @author   Richie Bartlett
 * @copyright (c) July 2008, by ZyraTech.com
 * @date      Sept 2008
 * @version   3.0.2008.09
 * @NOTES for the qWikiOffice platform(v0.7.1) powered by EXTjs.com framework.
 *
 * @license rich_imgEditor is licensed under the terms of the Open Source
 * LGPL 3.0 license. Commercial use is permitted to the extent that the 
 * code/component(s) do NOT become part of another Open Source or Commercially
 * licensed development library or toolkit without explicit permission.
 * 
 * License details: http://www.gnu.org/licenses/lgpl.html
 */



var  rich_ImageEditor = new Ext.data.Store({
		moduleType			:	'application',
		moduleId				:	'RIE',
		winTitle				:	'Image Editor 3.0',
		winId					:	'rich_imgEditor-win',
		winIcon				:	'RIE-Icon',
		shortcutIcon			:	'RIE-shortcut',
		quickStartIcon		:	'RIE-QuickStartIcon'	,
		tooltip :	'<b>(ProtoType) Image Editor 3.0</b><br />A window SHELL with a canvas, menu / toolbar, and status bar<br /><i>THIS IS THE Development VERSION ONLY</i>',
		textEmpty			:	'No image to display',
		connErrMsg			:	'An error occured while connecting to server.',
		err_msgTitle			:	'Image Editor :: Error',
		textLoading			:	'Loading...',
		defaultUrl				: 	'./system/modules/rich_imgEditor-v3.0/processImage.php',
		getImgUrl				: 	'./system/modules/rich_imgEditor-v3.0/getImage.php',
		imgNewDialogTitle	: 	'Image Editor :: New Image',
		imgOpDialogTitle	: 	'Image Editor :: Open Image',
		imgUpDialogTitle	: 	'Image Editor :: Upload New Image',
		imgPropDialogTitle	: 	'Image Editor :: Image Properties -  ',
		imgResizeDialogTitle	: 	'Image Editor :: Resize',
		imgZoomDialogTitle	: 	'Image Editor :: Zoom',
		aboutDialogTitle	: 	'About Image Editor 3.0',
		aboutDialogUrl		: 	'./system/modules/rich_imgEditor-v3.0/about.php',
		MAX_FILE_SIZE	: 8000000, 	//from php.ini
		origDir	: "/!Admin/system/modules/rich_imgEditor-v3.0/Saved/",		//Save / Restore directory
		editDir	: "/!Admin/system/modules/rich_imgEditor-v3.0/edit/",		//files kept here during editing
		func_mirrorDef 	: "flip",
		func_rotateDef		: 90,
		validDimension	: 	/^\d{1,4}$/,
		w: 0,		//canvas width
		h: 0,		//canvas height
		X: 0,		//cursor track
		Y: 0,
		startX: 0,	//cursor start pos
		startY: 0,
		colorBg: "FFFFFF",
		colorFt:  "000000",
		imgMAXh : 450,
		imgMAXw : 450,
		imgWH_tolerance:0.15,
		imgW_orig: 0,
		imgH_orig: 0,
		imgW_edit: 0,
		imgH_edit: 0,
		imgSize_orig: 0,
		imgSize_edit: 0,
		imgDATE: 0,
		imgRez: 72,
		imgName: '',
		imgURL: '',		//image pathway on server
		imgSize_editShowFlag: true,
		imgSize_origShowFlag: false,
		imgWH_editShowFlag: true,
		imgWH_origShowFlag: false,
		img_dateFlag: false,
		imgSaveFlag: false,
		imgZoom: 100, 			// image zoom percent
		imgAspectRatio: 1,		//edit img calculated ratio between W & H
		imgAspectFlag: true,	//maintain Aspect Ratio?
		//loaderImage: document.createElement("img"),
		keyBoardBuffer: '',		//used to store shortcut keys for listeners
		getDesktop: null,
		cursorStyle: "default",
		historyIndex:0,			//count of actions performed on image; used for undo/redo
		historyAction: new Array(""), //stores the name of last action; uses historyIndex for index
		imgChooser: null		//obj holder for open img dialog
}); //end DataStore for  rich_ImageEditor


////////////////////////////////////////////////////////////////////////
///////////   primary module  ///////////////////////////////
////////////////////////////////////////////////////////////////////////
QoDesk.rich_imgEditor = Ext.extend(Ext.app.Module, {

	moduleType : rich_ImageEditor.moduleType,
	moduleId : rich_ImageEditor.moduleId,
	StatusBar_Text1: new Ext.Toolbar.TextItem("Doc:  0KB"),
	StatusBar_Text2: new Ext.Toolbar.TextItem("WxH:  0x0"),
	StatusBar_Date: new Ext.Toolbar.TextItem(new Date().format('n/d/Y')),
	
	init : function(){
		this.launcher = {
			handler : this.createWindow,
            iconCls: rich_ImageEditor.quickStartIcon,//quickStartIcon
			scope: this,
			shortcutIconCls: rich_ImageEditor.shortcutIcon,
			text: rich_ImageEditor.winTitle,
			tooltip: rich_ImageEditor.tooltip
		};
		//Ext.BLANK_IMAGE_URL = "./images/spacer.gif";
	},//end function this.init

	createWindow : function(){
		var desktop = this.app.getDesktop();
		rich_ImageEditor.getDesktop = desktop;
		//var rImgEdwin = desktop.getWindow(rich_ImageEditor.winId);
		if(!desktop.getWindow(rich_ImageEditor.winId)){
			var winWidth = desktop.getViewWidth() / 1.1;
			var winHeight = desktop.getViewHeight() / 1.1;
			
			
			var imgView_Template = new Ext.XTemplate(
					'<tpl for=".">',
					'<DIV class="pref-view-thumb-wrap" id="{id}">',
					'<DIV class="pref-view-thumb"><img src="{pathtothumbnail}" TITLE="{name}" /></DIV>',
					'<SPAN>{shortName}</SPAN></DIV>',
					'</tpl>',
					'<DIV class="x-clear"></DIV>'
				);

			////////////////////////////////////////////////////////////
			/// General  createWindow.(functions)
			////////////////////////////////////////////////////////////

			function onClose(){
				if(rich_ImageEditor.imgName!= ""){
					this.processImage({'action': "cleanUp"});
				}//end if 
				rich_ImageEditor.imgName= "";
				rich_ImageEditor.imgURL= "";
				rich_ImageEditor.imgSize_orig= 0;
				rich_ImageEditor.imgSize_edit= 0;
				rich_ImageEditor.imgW_orig= 0;
				rich_ImageEditor.imgH_orig= 0;
				rich_ImageEditor.imgW_edit= 0;
				rich_ImageEditor.imgH_edit= 0;
				rich_ImageEditor.imgDATE= 0;
				rich_ImageEditor.img_dateFlag=false;
				rich_ImageEditor.imgSize_editShowFlag= true;
				rich_ImageEditor.imgSize_origShowFlag= false;
				rich_ImageEditor.imgWH_editShowFlag= true;
				rich_ImageEditor.imgWH_origShowFlag= false;
				rich_ImageEditor.cursorStyle= "default";
				rich_ImageEditor.historyIndex=0;
				rich_ImageEditor.historyAction= new Array("");
				Ext.getCmp('rich_imgEditor-win-menu_fileSave').disable();
				Ext.getCmp('rich_imgEditor-win-menu_fileProp').disable();
				Ext.getCmp('rich_imgEditor-win-menu_editRestore').disable();
				Ext.getCmp('rich_imgEditor-win-menu_editRefresh').disable();
				Ext.getCmp('rich_imgEditor-win-menu_editUndo').disable();
				Ext.getCmp('rich_imgEditor-win-menu_editRedo').disable();
				Ext.getCmp('rich_imgEditor-win-menu_filter').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Undo').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Redo').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Resize').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Hand').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Zoom').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Marquee').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Crop').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Rotate').disable();
				Ext.getCmp('rich_imgEditor-toolbar_Mirror').disable();
				Ext.fly(this.StatusBar_Text1.getEl()).update("Doc:  0KB");
				Ext.fly(this.StatusBar_Text2.getEl()).update("WxH:  0x0");
				Ext.fly(this.StatusBar_Date.getEl()).update("");
				rImgEdwin.close();
				if(rImgEdwin){
					rImgEdwin=null;
					delete rImgEdwin;//force object destruction
				}//end if  rImgEdwin
			}//end function onClose
		
			

			////////////////////////////////////////////////////////////
			/// Main (createWindow) Routine
			////////////////////////////////////////////////////////////
			var rie_statusMenu=new Ext.menu.Menu({
					hideOnClick: false,
					items: [{
								text: 'Show current Image FileSize',
								scope: this,
								checked: rich_ImageEditor.imgSize_editShowFlag,
								checkHandler: function(item,checked){
										rich_ImageEditor.imgSize_editShowFlag=checked;
										this.onStatusUpdate();
									}
							},{
								text: 'Show <i>Original</i> Image FileSize',
								scope: this,
								checked: rich_ImageEditor.imgSize_origShowFlag,
								checkHandler: function(item,checked){
										rich_ImageEditor.imgSize_origShowFlag=checked;
										this.onStatusUpdate();
									}
							},{
								text: 'Current Image Width & Height',
								scope: this,
								checked: rich_ImageEditor.imgWH_editShowFlag,
								checkHandler: function(item,checked){
										rich_ImageEditor.imgWH_editShowFlag=checked;
										this.onStatusUpdate();
									}
							},{
								text: '<i>Original</i> Image Width & Height',
								scope: this,
								checked: rich_ImageEditor.imgWH_origShowFlag,
								checkHandler: function(item,checked){
										rich_ImageEditor.imgWH_origShowFlag=checked;
										this.onStatusUpdate();
									}
							},{
								text: 'Show Image Date/Time',
								scope: this,
								checked: rich_ImageEditor.img_dateFlag,
								checkHandler: function(item,checked){
										rich_ImageEditor.img_dateFlag=checked;
										this.onStatusUpdate();
									}
						}]//end items
					});
			var rie_statusBar=new Ext.StatusBar({
					id: 'rich_imgEditor-win-statusbar',
					defaultText: 'Default status text',
					defaultIconCls: 'default-icon',
					hideOnClick: false,
					// values to set initially:
					text: 'Ready',
					iconCls: 'ready-icon',
					items: [
						this.StatusBar_Text1, ' ', 
						this.StatusBar_Text2, ' ',
						this.StatusBar_Date, 
						' ', '-', 
						{text:'Status Menu',
						menuAlign: 'br-tr?',
						menu: rie_statusMenu}
					]
				});

			var rImgEdwin = desktop.createWindow({
				id: rich_ImageEditor.winId,
				title: rich_ImageEditor.winTitle,
				width: parseFloat(winWidth*0.8) < 801 ? parseFloat(winWidth*0.8) : 800,
				height: parseFloat(winHeight*0.7) < 501 ? parseFloat(winHeight*0.7) : 500,
				minWidth: 560,
				minHeight: 460,
				x: parseFloat(winWidth*0.2) < desktop.getWinX(winWidth)+26 ? parseFloat(winWidth*0.2) : desktop.getWinX(winWidth)+25,
				y: parseFloat(winHeight*0.2) < desktop.getWinY(winHeight)+26 ? parseFloat(winHeight*0.2) : desktop.getWinY(winHeight)+25,
				iconCls: rich_ImageEditor.winIcon,
				shim:true,
				animCollapse:false,
				constrainHeader:true,
				minimizable:true,
				onEsc: Ext.emptyFn,
    			maximizable:true,
				//layout: 'box',
				tbar:[{
					  //TODO: add keys to the option list for the listeners to catch these shortcuts...
					text: '<u>F</u>ile',
					shadow: 'drop',
                	id: 'rich_imgEditor-win-menu_file',
                	scope: this,
					menu: { 
						items: [
							{//TODO: write function to create new image
								text: 'New Image',
								id: 'rich_imgEditor-win-menu_fileNew',
								iconCls:'RIE-newImg',
								scope: this,
								handler: null,
								disabled: true
							}, {
								text: 'Open Image',
								id: 'rich_imgEditor-win-menu_fileOpen',
								iconCls:'RIE-opImg',
								scope: this,
								handler: this.rie_openImageDialog
							}, {
								text: 'UpLoad New Image',
								//xtype:'browsebutton',
								id: 'rich_imgEditor-win-menu_fileUpLoad',
								iconCls:'RIE-upImg',
								scope: this,
								handler: this.rie_uploadImageDialog
							}, {
								text: 'Save Image...',
								id: 'rich_imgEditor-win-menu_fileSave',
								iconCls:'RIE-saveImg',
								menu: {        //TODO: write&attach save functions
									items: [
										{
											text: 'Save, but don\'t publish',
											scope: this,
											iconCls:'RIE-no'
										}, {
											text: 'Approved for publishing',
											scope: this,
											handler: function(){
												this.showErrorMsg("This function is disabled for the demo...");
											},
											iconCls:'RIE-yes'
										}, {
											text: 'DownLoad to local disk',
											scope: this,
											handler: function(){
												window.location.href=rich_ImageEditor.getImgUrl+"?dl=1&Hindex="+rich_ImageEditor.historyIndex+"&imageName="+rich_ImageEditor.imgName;
											},
											iconCls:'RIE-downLoad'
										}
									]
								},
								disabled: true
							}, {
								text: 'Image Properties',
								id: 'rich_imgEditor-win-menu_fileProp',
								iconCls:'RIE-imgProp',
								scope: this,
								handler: this.showIMGprop,
								disabled: true
							}, {
								text: 'Options',
								iconCls:'RIE-option',
								scope: this,
								handler: this.showDialog,
								disabled: true
							},  '-',{
								text: 'About '+rich_ImageEditor.winTitle,
								iconCls:'RIE-about',
								scope: this,
								handler: this.rie_AboutDialog
							}, '-', {
								text: 'Close',
								iconCls:'RIE-cancel',
								scope: this,
								handler: onClose
							}
						]
					}
				},{
                	disabled: false,
					//tooltip: 'This menu provides options to undo, redo, etc...',
                	id: 'rich_imgEditor-win-menu_edit',
                	scope: this,
                	text: '<u>E</u>dit',
					shadow: 'drop',
					menu: {
						items: [
							{
								text: 'Restore Original',
                				id: 'rich_imgEditor-win-menu_editRestore',
								iconCls:'RIE-restore',
								scope: this,
								handler: function(){
									this.processImage({'action': "restoreIMG"});
								},
								disabled: true
							}, {
								text: 'Reload Current',
                				id: 'rich_imgEditor-win-menu_editRefresh',
								iconCls:'RIE-refresh',
								scope: this,
								handler: function(){
									this.processImage({'action': "viewActive"});
								},
								disabled: true
							}, {
								text: 'Undo',
                				id: 'rich_imgEditor-win-menu_editUndo',
								tooltip: 'Undo last action',
								iconCls:'RIE-undo',
								handler: this.rie_Undo,
								scope: this,
								disabled: true
							}, {
								text: 'Redo',
                				id: 'rich_imgEditor-win-menu_editRedo',
								iconCls:'RIE-redo',
								handler: this.rie_Redo,
								scope: this,
								disabled: true
							}, {
								text: 'Choose Color...',
                				id: 'rich_imgEditor-win-menu_editetc',
								iconCls:'RIE-etc',
								disabled: true
							}
						]
					}
				},{
                	disabled: true,
                	id: 'rich_imgEditor-win-menu_filter',
                	scope: this,
                	text: 'Fil<u>t</u>er',
					shadow: 'drop',
					menu: { 
						items: [
							{
								text: 'Grayscale',
								scope: this,
								handler: function(){
									this.processImage({'action': "grayscale"});
								}
							}, {
								text: 'Sepia',
								scope: this,
								handler: function(){
									this.processImage({'action': "sepia"});
								}
							}, {
								text: 'Pencil',
								scope: this,
								handler: function(){
									this.processImage({'action': "pencil"});
								}
							}, {
								text: 'Emboss',
								scope: this,
								handler: function(){
									this.processImage({'action': "emboss"});
								}
							}, {
								text: 'Blur',
								scope: this,
								handler: function(){
									this.processImage({'action': "blur"});
								}
							}, {
								text: 'Smooth',
								scope: this,
								handler: function(){
									this.processImage({'action': "smooth"});
								}
							}, {
								text: 'Invert',
								scope: this,
								handler: function(){
									this.processImage({'action': "invert"});
								}
							}, {
								text: 'Brighten',
								scope: this,
								handler: function(){
									this.processImage({'action': "brighten", 'amt': 10});
								}
							}, {
								text: 'Darken',
								scope: this,
								handler: function(){
									this.processImage({'action': "brighten", 'amt': -10});
								}
							}
						]
					}
				}, ' ', '-', ' ', {
					//text: 'Undo',
					tooltip: 'Undo last action<br><b>Note:</b><i>  feature has history...</i><br><br><i>ShortCut Key:</i>  <b><CODE>CTRL + Z</CODE></b>',
					iconCls:'RIE-undo',
					id: 'rich_imgEditor-toolbar_Undo',
					handler: this.rie_Undo,
					scope: this,
					disabled: true
				}, ' ',{
					//text: 'Redo',
					tooltip: 'Redo last action<br><b>Note:</b><i>  feature has history...</i><br><br><i>ShortCut Key:</i>  <b><CODE>CTRL + Y</CODE></b>',
					iconCls:'RIE-redo',
					id: 'rich_imgEditor-toolbar_Redo',
					handler: this.rie_Redo,
					scope: this,
					disabled: true
				}, ' ', '-', ' ', {
					text: 'Resize',
					tooltip: 'Resize Tool<br><b>Note:</b><i>  Resize the image to desired dimensions. (Dialog box)</i><br><br><i>ShortCut Key:</i>  <b><CODE>R</CODE></b>',
					scope: this,
					handler: this.rie_resizeImageDialog,
					id: 'rich_imgEditor-toolbar_Resize',
					iconCls:'RIE-imgResize',
					disabled: true
				}, ' ', {
					text: 'Zoom',
					tooltip: 'Zoom Tool<br><b>Note:</b>  Zoom in / out of image area...<br><br><i>ShortCut Key:</i>  <b><CODE>Z</CODE></b>',
					id: 'rich_imgEditor-toolbar_Zoom',
					iconCls:'RIE-imgZoom',
					handler: this.showDialog, //TODO: write& attach Zoom function
					disabled: true
				}, ' ', '-', ' ', {
					text: 'Hand',
					tooltip: 'Hand Tool<br><b>Note:</b>  Drag image while zoomed in...<br><br><i>ShortCut Key:</i>  <b><CODE>H</CODE></b>',
					id: 'rich_imgEditor-toolbar_Hand',
					iconCls:'RIE-imgHand',
					enableToggle: true,
					toggleHandler: null, //TODO: write& attach Hand function
					pressed: false,
					disabled: true
				}, ' ', {
					text: 'Marquee',
					tooltip: 'Marquee Tool<br><b>Note:</b>  Creates a selection around an area dragged by the mouse...<br><br><i>ShortCut Key:</i>  <b><CODE>M</CODE></b>',
					id: 'rich_imgEditor-toolbar_Marquee',
					iconCls:'RIE-imgMarquee',
					enableToggle: true,
					toggleHandler: null, //TODO: write& attach marquee function
					pressed: false,
					disabled: true
				}, ' ', {
					text: 'Crop',
					tooltip: 'Crop Tool<br><b>Note:</b>  Reduces the image down the to selected area<br><br><i>ShortCut Key:</i>  <b><CODE>C</CODE></b>',
					id: 'rich_imgEditor-toolbar_Crop',
					iconCls:'RIE-imgCrop',
					enableToggle: true,
					toggleHandler: null, //TODO: write& attach crop function
					pressed: false,
					disabled: true
				}, ' ', '-', ' ', {
					text: 'Rotate',
					xtype:'tbsplit',
					shadow: 'drop',
					//menuAlign: 'tl-tl?',
					tooltip: 'Rotate Tool<br><b>Note:</b>  Rotates the image in 90&deg; increments',
					id: 'rich_imgEditor-toolbar_Rotate',
					iconCls:'RIE-imgRotate',
					disabled: true,
					scope: this,
					handler: function(){
						this.processImage({'action': "rotate", 'degrees': rich_ImageEditor.func_rotateDef});
					},
					menu: {
						items: [
							{
								text: ' 90&deg;',
								scope: this,
								handler: function(){
									rich_ImageEditor.func_rotateDef=90;
									this.processImage({'action': "rotate", 'degrees': 90});
								}
							}, {
								text: '180&deg;',
								scope: this,
								handler: function(){
									rich_ImageEditor.func_rotateDef=180;
									this.processImage({'action': "rotate", 'degrees': 180});
								}
							}, {
								text: '270&deg; (-90&deg;)',
								scope: this,
								handler: function(){
									rich_ImageEditor.func_rotateDef=270;
									this.processImage({'action': "rotate", 'degrees': 270});
								}
							}
						]
					}
				}, ' ', {
					text: 'Mirror',
					xtype:'tbsplit',
					shadow: 'drop',
					iconCls:'RIE-imgMirror',
					tooltip: 'Mirror Tool<br><b>Note:</b>  Flips the image horizontally or vertically',
					id: 'rich_imgEditor-toolbar_Mirror',
					disabled: true,
					scope: this,
					handler: function(){
						this.processImage({'action': "mirror", 'direction': rich_ImageEditor.func_mirrorDef});
					},
					menu: { 
						items: [
							{
								text: 'Vertical (Flop)',
								iconCls:'RIE-imgMirrorV',
								scope: this,
								handler: function(){
									rich_ImageEditor.func_mirrorDef="flop";
									this.processImage({'action': "mirror", 'direction': "flop"});
								}
							}, {
								text: 'Horizontal (Flip)',
								iconCls:'RIE-imgMirrorH',
								scope: this,
								handler: function(){
									rich_ImageEditor.func_mirrorDef="flip";
									this.processImage({'action': "mirror", 'direction': "flip"});
								}
							}
						]
					}
				}, ' ' //tb spacer
				],

				items: new QoDesk.rich_imgEditor.VIcontainer({owner: this, id: 'rich_imgEditor-win-VIcontainer'}),
				taskbuttonTooltip: rich_ImageEditor.tooltip,
				bbar: rie_statusBar
			});
		}else{ //already created...
			rImgEdwin=desktop.getWindow(rich_ImageEditor.winId);	
		}//end if rImgEdwin
		rImgEdwin.show();
		//listen events go here:
		//rImgEdwin.on("hide", onClose,  this);
		rImgEdwin.on("resize", this.updateCanvas,  this);
		this.updateCanvas();//recalc win size...
	},//end function this.createWindow

	showDialog : function(){
		if(!this.dialog){
			this.dialog = new Ext.Window({
				bodyStyle:'padding:10px',
				layout:'fit',
				width:500,
				height:300,
				closeAction:'hide',
				plain: true,
				html: 'Simple dialog window<br><BR><BR> Project details under development... <BR><BR> Stay tuned to see this project\'s progress... <BR><BR><BR>document.lastModified = '+document.lastModified,
				buttons: [{
					text:'Ok',
					disabled:true
				},{
					text: 'Cancel',
					handler: function(){
						this.dialog.hide();
					},
					scope: this
				}],
				iconCls: rich_ImageEditor.winIcon,
				modal: false
			});
		}
		this.dialog.show();
	},//end function this.showDialog

	showIMGprop : function(){
		var rie_imgPropForm;
		if(!rie_imgPropForm){
			rie_imgPropForm = new Ext.FormPanel({
				id: 'rich_imgEditor-imgPF',
				url: '',
				title: '',
				fileUpload: false,
				labelWidth: 150,
				border: false,
				frame:false,
				width: '100%',
				bodyStyle:'padding:5px 5px 0; overflow: auto',
				items: [{
					xtype:'fieldset',
					title: 'Original Image Details',
					collapsible: true,
					collapsed: true,
					autoHeight:true,
					defaultType: 'textfield',
					items :[{
							xtype: 'box',
							autoEl: {
								tag: 'img', 
								id:'imgProp_oIMG',
								name: 'imgProp_oIMG',
								style: "text-align: center;",
								src: rich_ImageEditor.origDir+rich_ImageEditor.imgName, 
								width: 80, 
								height: 80
							}
						},{
							fieldLabel: 'Width (in px)',
							id:'imgProp_oW',
							name: 'imgProp_oW'
						},{
							fieldLabel: 'Height (in px)',
							id:'imgProp_oH',
							name: 'imgProp_oH'
						}, {
							fieldLabel: 'Resolution',
							id:'imgProp_oRez',
							name: 'imgProp_oRez'
						}, {
							fieldLabel: 'Aspect Ratio (W\\H)',
							id:'imgProp_oA',
							name: 'imgProp_oA'
						}, {
							fieldLabel: 'File Size (in KB)',
							id:'imgProp_oFS',
							name: 'imgProp_oFS'
						}, {
							fieldLabel: 'File Last Modified',
							width: 300,
							id:'imgProp_oDate',
							name: 'imgProp_oDate'
						}
					]
				},{
					xtype:'fieldset',
					title: 'Current Image Details',
					collapsible: false,
					autoHeight:true,
					defaultType: 'textfield',
					items :[{
							xtype: 'box',
							autoEl: {
								tag: 'img', 
								id:'imgProp_eIMG',
								name: 'imgProp_eIMG',
								style: "text-align : center",
								src: rich_ImageEditor.editDir+rich_ImageEditor.imgName, 
								width: 80, 
								height: 80
							}
						},{
							fieldLabel: 'Width (in px)',
							id:'imgProp_eW',
							name: 'imgProp_eW'
						},{
							fieldLabel: 'Height (in px)',
							id:'imgProp_eH',
							name: 'imgProp_eH'
						}, {
							fieldLabel: 'Resolution',
							id:'imgProp_eRez',
							name: 'imgProp_eRez'
						}, {
							fieldLabel: 'Aspect Ratio (W\\H)',
							id:'imgProp_eA',
							name: 'imgProp_eA'
						}, {
							fieldLabel: 'File Size (in KB)',
							id:'imgProp_eFS',
							name: 'imgProp_eFS'
						}
					]
				}]
			});
		}//end if rie_imgPropForm
		if(!this.imgProp){
			this.imgProp = new Ext.Window({
				title: rich_ImageEditor.imgPropDialogTitle,
				id: 'rich_imgEditor-imgProperties',
				bodyStyle:'padding:10px',
				layout:'fit',
				width:550,
				height:350,
				plain: true,
				items: [rie_imgPropForm],
				buttons: [{
					text: 'OK',
					handler: function(){
						this.imgProp.hide();
					},
					scope: this
				}],
				iconCls: rich_ImageEditor.winIcon,
				modal: false
			});
		}
		this.imgProp.show();
		if(this.imgProp){
			var max_thumbWidth=100;
			var max_thumbHeight=100;
			this.imgProp.center();
			this.imgProp.setTitle(rich_ImageEditor.imgPropDialogTitle + rich_ImageEditor.imgName);
			params={
				w: rich_ImageEditor.imgW_orig
				,h: rich_ImageEditor.imgH_orig
				,max_thumbWidth: max_thumbWidth
				,max_thumbHeight: max_thumbHeight
			}
			params=rie_imgAspectCalc(params);
			Ext.get('imgProp_oIMG').dom.width = params.w;
			Ext.get('imgProp_oIMG').dom.height = params.h;
			Ext.get('imgProp_oIMG').dom.src = rich_ImageEditor.origDir+rich_ImageEditor.imgName+"?_dc="+new Date().format("ndYgi");
			Ext.get('imgProp_oW').dom.value = rich_ImageEditor.imgW_orig;
			Ext.get('imgProp_oH').dom.value = rich_ImageEditor.imgH_orig;
			Ext.get('imgProp_oRez').dom.value = rich_ImageEditor.imgRez;
			Ext.get('imgProp_oA').dom.value = params.myratio;
			Ext.get('imgProp_oFS').dom.value = rich_ImageEditor.imgSize_orig;
			Ext.get('imgProp_oDate').dom.value = rich_ImageEditor.imgDATE;
			Ext.get('imgProp_oW').dom.disabled = true;
			Ext.get('imgProp_oH').dom.disabled = true;
			Ext.get('imgProp_oRez').dom.disabled = true;
			Ext.get('imgProp_oA').dom.disabled = true;
			Ext.get('imgProp_oFS').dom.disabled = true;
			//Ext.get('imgProp_oDate').dom.disabled = true;
//alert(Ext.get('imgProp_oIMG').dom.src);
			Ext.get('imgProp_eW').dom.value = rich_ImageEditor.imgW_edit;
			Ext.get('imgProp_eH').dom.value = rich_ImageEditor.imgH_edit;
			Ext.get('imgProp_eRez').dom.value = rich_ImageEditor.imgRez;
			Ext.get('imgProp_eFS').dom.value = rich_ImageEditor.imgSize_edit;
			Ext.get('imgProp_eIMG').dom.src = rich_ImageEditor.getImgUrl+"?imageName="+rich_ImageEditor.imgName+"&Hindex="+rich_ImageEditor.historyIndex+"&_dc="+(new Date()).getTime();
			params={
				w: rich_ImageEditor.imgW_edit
				,h: rich_ImageEditor.imgH_edit
				,max_thumbWidth: max_thumbWidth
				,max_thumbHeight: max_thumbHeight
			}
			params=rie_imgAspectCalc(params);
			rich_ImageEditor.imgAspectRatio=params.myratio;
			Ext.get('imgProp_eA').dom.value = rich_ImageEditor.imgAspectRatio;
			Ext.get('imgProp_eIMG').dom.width = params.w;
			Ext.get('imgProp_eIMG').dom.height = params.h;
		}//end if this.imgProp
	},//end function this.showIMGprop

	rie_uploadImageDialog : function(){
			//initialize objects
			var rie_pb;
			var rie_uploadImageForm;
			//set var to resolve scope issues
			var errMSG=this.showErrorMsg;
		
			if(!rie_uploadImageForm) rie_uploadImageForm = new Ext.FormPanel({
				url: rich_ImageEditor.defaultUrl,
				autoHeight: true,
				border: false,
				formId: 'rie_upImgForm',
				title: '',
				bodyStyle: 'padding:5px 5px 0',
				width: '100%',
				defaults: {width: 185},
				defaultType: 'textfield',
				fileUpload: true,
				labelWidth: 110, 
				items: [
						//rie_upIMGtf,
						new Ext.form.TextField({
							fieldLabel: 'Upload Local Image',
							id:'rie_upFILE',
							name: 'rie_upFILE',
							inputType:'file'
						}),
                		new Ext.form.Hidden({id:'action',name: 'action',value: 'storeImage'}),
                		new Ext.form.Hidden({id:'MAX_FILE_SIZE',name: 'MAX_FILE_SIZE',value: rich_ImageEditor.MAX_FILE_SIZE})//limit the file upload size...
				],//end items
		
				buttons: [{
					text: 'Upload',
					id: 'rie_uploadFormButton_Upload',
					handler: function(){
						var imgName=Ext.get('rie_upFILE').dom.value.trim();
						if(imgName!=""){
							//remove local pathway from imgName (don't need it) --IE bug?
							imgName=imgName.substring(imgName.lastIndexOf("\\")+1,imgName.length);
							Ext.getCmp('rie_uploadFormButton_Upload').disable();
							this.uploadDialog.setHeight(140);
							if(rie_pb){
								rie_pb.show();
								rie_pb.updateText("Uploading Image: "+imgName);
								rie_pb.wait({
									interval:300,
									duration:600000,
									increment:12
									//scope: this
								});
							}//end if rie_pb

							rie_uploadImageForm.getForm().submit({
								scope: this,
								success: function(form, action){
									rie_pb.reset();
									this.processImage({'action': "cleanUp"});
									rich_ImageEditor.imgName=imgName;
									rie_pb.updateText(imgName+" Uploaded! ");
									this.uploadDialog.hide();
									this.processImage({'action': "viewActive"});
							} ,
								failure: 	function( form, action){
									var response = Ext.util.JSON.decode(action.response.responseText);
									rie_pb.reset();
									rie_pb.updateText("Upload Error! ");
									errMSG(response.error);
									this.uploadDialog.setHeight(105);
									rie_pb.updateText("Ready ");
									Ext.get('rie_upFILE').dom.value = "";
									Ext.get('rie_upFILE').dom.disabled=false;
									Ext.getCmp('rie_uploadFormButton_Upload').enable();
									//form.reset();
								}
							});       

						}else{//empty
							this.showErrorMsg("Please select an image to upload...");
						}//end if imgName
					},
					scope: this
				},{
					text: 'Cancel',
					id: 'rie_uploadFormButton_Cancel',
					handler: function(){
						this.uploadDialog.hide();
					},
					scope: this
				}]
			});
		if(!this.uploadDialog){
			this.uploadDialog = new Ext.Window({
				title: rich_ImageEditor.imgUpDialogTitle,
				iconCls: rich_ImageEditor.winIcon,
				bodyStyle:'padding:10px',
				layout:'form',
				width:370,
				height:105,
				closeAction: 'hide',
				//resizable: false,
				plain: true,
				items: [rie_uploadImageForm],
				modal: true
			});
			rie_pb = new Ext.ProgressBar({
				text:'Ready',
				id:'rie_upFileProgBar',
				cls:'left-align',
				autoWidth: true
			});
			this.uploadDialog.add(rie_pb);
		}else{//window & components already rendered
			this.uploadDialog.setHeight(105);
			//this.uploadDialog.setWidth(370);
			//clear out the old field values:
			Ext.get('rie_upFILE').dom.value = "";
			Ext.get('rie_upFILE').dom.disabled = false;
		}//end if this.uploadDialog
		this.uploadDialog.show();
		if(rie_pb){//hide progressBar on show
			rie_pb.updateText("Ready");
			rie_pb.hide();
		}
		Ext.getCmp('rie_uploadFormButton_Upload').enable();
		this.uploadDialog.toFront();//make sure it's on top
	},//end function this.rie_uploadImageDialog

	rie_openImageDialog : function(){
    	if(!rich_ImageEditor.imgChooser){
    		rich_ImageEditor.imgChooser = new QoDesk.rich_imgEditor.ImageViewer({
    			url: rich_ImageEditor.defaultUrl+'?action=exploreImages',
    			width:600, 
    			height:350
				,cb: this
    		});
    	};
		rich_ImageEditor.imgChooser.show();
		//rich_ImageEditor.imgChooser.reset();
	},//end function this.rie_openImageDialog

	rie_resizeImageDialog : function(){
		//initialize objects
		var rie_irTab;
		//set var to resolve scope issues
		var errMSG=this.showErrorMsg;

		if(!rie_irTab){
			rie_irTab = new Ext.FormPanel({
				url: '',
				title: '',
				fileUpload: false,
				labelWidth: 95,
				border: false,
				frame:false,
				width: '100%',
				bodyStyle:'padding:5px 5px 0; overflow: auto',
items: [{
	xtype:'fieldset',
	title: 'Current Image Details',
	collapsible: false,
	autoHeight:true,
	items :[{
		layout:'column',
		border:false,
		items:[{
			columnWidth:.25,
			layout: 'form',
			border:false,
			items: [{
				xtype: 'box',
				autoEl: {
					tag: 'img', 
					id:'imgProp_iIMG',
					name: 'imgProp_iIMG',
					src: rich_ImageEditor.editDir+rich_ImageEditor.imgName, 
					width: 80, 
					height: 80
				}}]
		},{
			columnWidth:.75,
			layout: 'form',
			border:false,
			items: [{
				xtype:'textfield',
				fieldLabel: 'Aspect Ratio (W\\H)',
				id:'imgProp_iA',
				name: 'imgProp_iA',
				width: 90
			},{
				xtype:'textfield',
				fieldLabel: 'File Size (in KB)',
				id:'imgProp_iFS',
				name: 'imgProp_iFS',
				width: 90
			}]
		}]
}]
	},{
		xtype:'tabpanel',
		activeTab: 0,
		defaults:{autoHeight:true, bodyStyle:'padding:10px', autoScroll: true}, 
		items:[{
			title:'Image',
			layout:'form',
			defaults: {width: 70},
			defaultType: 'textfield',
			items: [{
				fieldLabel: 'Width (in px)'
				,id: 'imgProp_iW'
				,name: 'imgProp_iW'
			},{
				fieldLabel: 'Height (in px)'
				,id: 'imgProp_iH'
				,name: 'imgProp_iH'
			},{
				fieldLabel: 'Resolution'
				,id:'imgProp_iRez'
				,name: 'imgProp_iRez'
			},{
				xtype: 'checkbox'
				,checked: rich_ImageEditor.imgAspectFlag
				,fieldLabel: ''
				,labelSeparator: ''
				,boxLabel: 'Constrain Proportions'
				,id:'imgProp_iConstrain'
				,name: 'imgProp_iConstrain'
				,width: 150
			}]
		},{
			title:'Canvas',
			listeners: {activate: function(){
				if(Ext.get('imgProp_cW').dom.value <=0) Ext.get('imgProp_cW').dom.value = rich_ImageEditor.w;
				if(Ext.get('imgProp_cH').dom.value <=0) Ext.get('imgProp_cH').dom.value = rich_ImageEditor.h;
						var ch=Ext.get('imgProp_cH').dom.value;
						var cw=Ext.get('imgProp_cW').dom.value;
						Ext.get('imgProp_cH').dom.value=(ch<rich_ImageEditor.imgH_edit? rich_ImageEditor.imgH_edit:ch);
						Ext.get('imgProp_cW').dom.value=(cw<rich_ImageEditor.imgW_edit? rich_ImageEditor.imgW_edit:cw);
				try{
					function txtcWidthKeyup(){
						if(Ext.get('imgProp_cConstrain').dom.checked==true){
							Ext.get('imgProp_cW').dom.value =parseInt(Ext.get('imgProp_cW').dom.value);//force int
							Ext.get('imgProp_cH').dom.value=parseInt((Ext.get('imgProp_cW').dom.value * rich_ImageEditor.imgH_edit)/rich_ImageEditor.imgW_edit);
						}//end if constrain =true
					}//end function txtWidthKeyup
					function txtcHeightKeyup(){
						if(Ext.get('imgProp_cConstrain').dom.checked==true){
							Ext.get('imgProp_cH').dom.value =parseInt(Ext.get('imgProp_cH').dom.value);//force int
							Ext.get('imgProp_cW').dom.value=parseInt((Ext.get('imgProp_cH').dom.value * rich_ImageEditor.imgW_edit)/rich_ImageEditor.imgH_edit);
						}//end if constrain =true
					}//end function txtHeightKeyup
					Ext.get('imgProp_cW').on('keyup', txtcWidthKeyup);
					Ext.get('imgProp_cW').on('blur', txtcWidthKeyup);
					Ext.get('imgProp_cH').on('keyup', txtcHeightKeyup);
					Ext.get('imgProp_cH').on('blur', txtcHeightKeyup);
				}catch(e){}//escape err
				}
			},
			layout:'form',
			defaults: {width: 70},
			defaultType: 'textfield',
			items: [{
				fieldLabel: 'Width (in px)'
				,id:'imgProp_cW'
				,name: 'imgProp_cW'
			},{
				fieldLabel: 'Height (in px)'
				,id:'imgProp_cH'
				,name: 'imgProp_cH'
			},{
				xtype: 'checkbox'
				,checked: rich_ImageEditor.imgAspectFlag
				,fieldLabel: ''
				,labelSeparator: ''
				,boxLabel: 'Constrain Proportions'
				,id:'imgProp_cConstrain'
				,name: 'imgProp_cConstrain'
				,width: 150
			}]
	}]
}],
				buttons: [{
					text: 'Apply',
					scope: this,
					handler: function(){
						//TODO: handle the canvas request too!
						var h=Ext.get('imgProp_iH').dom.value;
						var w=Ext.get('imgProp_iW').dom.value;
						if(h!= rich_ImageEditor.imgH_edit || w != rich_ImageEditor.imgW_edit){
							if(h<=0) h=rich_ImageEditor.imgH_edit;
							if(w<=0) w=rich_ImageEditor.imgW_edit;
							this.processImage({'action': "resize", 'w': w, 'h': h});
						}//end if dimen changed
						try{
						var ch=Ext.get('imgProp_cH').dom.value;
						var cw=Ext.get('imgProp_cW').dom.value;
						//update canvas dims
						rich_ImageEditor.h=(ch<h? h:ch);
						rich_ImageEditor.w=(cw<w? w:cw);
						}catch(e){}
						this.resizeDialog.hide();
					}
				},{
					text: 'Close',
					handler: function(){
						this.resizeDialog.hide();
					},
					scope: this
				}]
			});
		}//end if rie_irTab
		if(!this.resizeDialog){
			this.resizeDialog = new Ext.Window({
				title: rich_ImageEditor.imgResizeDialogTitle,
				id: 'rich_imgEditor-imgResizer',
				bodyStyle:'padding:10px',
				layout:'fit',
				width:500,
				height:400,
				plain: true,
				items: [rie_irTab],
				iconCls: rich_ImageEditor.winIcon,
				modal: false
			});
		}//end if this.resizeDialog
		this.resizeDialog.show();
		if(this.resizeDialog){
			var max_thumbWidth=100;
			var max_thumbHeight=100;
			this.resizeDialog.center();
			this.resizeDialog.toFront();
			Ext.get('imgProp_iIMG').dom.src = rich_ImageEditor.getImgUrl+"?imageName="+rich_ImageEditor.imgName+"&Hindex="+rich_ImageEditor.historyIndex+"&_dc="+(new Date()).getTime();
			params={
				w: rich_ImageEditor.imgW_edit
				,h: rich_ImageEditor.imgH_edit
				,max_thumbWidth: max_thumbWidth
				,max_thumbHeight: max_thumbHeight
			}
			params=rie_imgAspectCalc(params);
			rich_ImageEditor.imgAspectRatio=params.myratio;
			Ext.get('imgProp_iIMG').dom.width = params.w;
			Ext.get('imgProp_iIMG').dom.height = params.h;
			Ext.get('imgProp_iA').dom.value = rich_ImageEditor.imgAspectRatio;
			Ext.get('imgProp_iFS').dom.value = rich_ImageEditor.imgSize_edit;
			Ext.get('imgProp_iA').dom.disabled = true;
			Ext.get('imgProp_iFS').dom.disabled = true;
			Ext.get('imgProp_iW').dom.value = rich_ImageEditor.imgW_edit;
			Ext.get('imgProp_iH').dom.value = rich_ImageEditor.imgH_edit;
			Ext.get('imgProp_iRez').dom.value = rich_ImageEditor.imgRez;
			try{
				function txtiWidthKeyup(){
					if(Ext.get('imgProp_iConstrain').dom.checked==true){
						Ext.get('imgProp_iW').dom.value =parseInt(Ext.get('imgProp_iW').dom.value);//force int
						Ext.get('imgProp_iH').dom.value=parseInt((Ext.get('imgProp_iW').dom.value * rich_ImageEditor.imgH_edit)/rich_ImageEditor.imgW_edit);
					}//end if constrain =true
				}//end function txtWidthKeyup
				function txtiHeightKeyup(){
					if(Ext.get('imgProp_iConstrain').dom.checked==true){
						Ext.get('imgProp_iH').dom.value =parseInt(Ext.get('imgProp_iH').dom.value);//force int
						Ext.get('imgProp_iW').dom.value=parseInt((Ext.get('imgProp_iH').dom.value * rich_ImageEditor.imgW_edit)/rich_ImageEditor.imgH_edit);
					}//end if constrain =true
				}//end function txtHeightKeyup
				Ext.get('imgProp_iW').on('keyup', txtiWidthKeyup);
				Ext.get('imgProp_iW').on('blur', txtiWidthKeyup);
				Ext.get('imgProp_iH').on('keyup', txtiHeightKeyup);
				Ext.get('imgProp_iH').on('blur', txtiHeightKeyup);
			}catch(e){}//escape err
		}//end if this.resizeDialog
	},//end function this.rie_resizeImageDialog

	rie_Undo: function(){
		rich_ImageEditor.historyIndex--;
		if(rich_ImageEditor.histroyIndex<0) rich_ImageEditor.histroyIndex=0;
		this.processImage({'action': "undo"});
	},//end function rie_Undo

	rie_Redo: function(){
		rich_ImageEditor.historyIndex++;
		if(rich_ImageEditor.histroyIndex>rich_ImageEditor.historyAction.length) rich_ImageEditor.histroyIndex=rich_ImageEditor.historyAction.length;
		//add indexing override param
		rich_ImageEditor.historyAction[rich_ImageEditor.historyIndex].redoFlag=true;
		this.processImage(rich_ImageEditor.historyAction[rich_ImageEditor.historyIndex]);
	},//end function rie_Undo

	rie_AboutDialog : function(){
		if(!this.aboutDialog){
			this.aboutDialog = new Ext.Window({
				title: rich_ImageEditor.aboutDialogTitle,
				id: 'rich_imgEditor-aboutDialog',
				autoLoad: rich_ImageEditor.aboutDialogUrl,
				//html: 'About dialog window',
				bodyStyle:'padding:10px',
				layout:'fit',
				autoScroll: true,
				width:400,
				height:180,
				closeAction:'hide',
				buttons: [{
					text:'Ok',
					disabled:false,
					handler: function(){
						this.aboutDialog.hide();
					},
					scope: this
				}],
				iconCls: rich_ImageEditor.winIcon,
				plain: true,
				modal: false
			});
		}//end if !this.aboutDialog
		this.aboutDialog.show();
		if(this.aboutDialog){
			this.aboutDialog.center();
			this.aboutDialog.load({
				url: rich_ImageEditor.aboutDialogUrl,
				discardUrl: true,
				nocache: true,
				scripts: false
			});
		}//end if this.aboutDialog
	},//end function this.rie_AboutDialog

	showErrorMsg: function(msgTxt) {
	// error message box
		Ext.Msg.show({
			title:rich_ImageEditor.err_msgTitle,
			iconCls: rich_ImageEditor.winIcon,
			msg: msgTxt,
			buttons: Ext.Msg.OK,
			icon: 'gpError',
			width: 300
		}); 
	},//end function showErrorMsg

	// Ajax interface
	sendAjaxRequest: function(params,successCallback,failureCallback,aurl) {
		if (!aurl)	aurl = rich_ImageEditor.defaultUrl;
		Ext.Ajax.request({
			url		: aurl,
			method	: 'POST',
			params	:params,
			success	: successCallback,
			failure	: failureCallback,
			scope: this,
//			record: record,
//			form: form.getForm().getEl().dom,
			isUpload: false
		});
	},// end function sendAjaxRequest

	onStatusUpdate: function(){
		//handle statusBar option
		var stat1="";
		var stat2="";

		if(rich_ImageEditor.imgSize_editShowFlag || rich_ImageEditor.imgSize_origShowFlag) stat1="Doc:  ";
		if(rich_ImageEditor.imgSize_editShowFlag) stat1+=rich_ImageEditor.imgSize_edit+" KB";
		if(rich_ImageEditor.imgSize_editShowFlag && rich_ImageEditor.imgSize_origShowFlag) stat1+="  /  ";
		if(rich_ImageEditor.imgSize_origShowFlag) stat1+="(orig) "+rich_ImageEditor.imgSize_orig+" KB";
		
		if(rich_ImageEditor.imgWH_editShowFlag || rich_ImageEditor.imgWH_origShowFlag) stat2="WxH:  ";
		if(rich_ImageEditor.imgWH_editShowFlag) stat2+=rich_ImageEditor.imgW_edit+"x"+rich_ImageEditor.imgH_edit;
		if(rich_ImageEditor.imgWH_editShowFlag && rich_ImageEditor.imgWH_origShowFlag) stat2+="  /  ";
		if(rich_ImageEditor.imgWH_origShowFlag) stat2+="(orig) "+rich_ImageEditor.imgW_orig+"x"+rich_ImageEditor.imgH_orig;
		
		if(stat1==""){
			Ext.fly(this.StatusBar_Text1.getEl()).hide();
		}else{
			Ext.fly(this.StatusBar_Text1.getEl()).show();
		}
		Ext.fly(this.StatusBar_Text1.getEl()).update(stat1);
		if(stat2==""){
			Ext.fly(this.StatusBar_Text2.getEl()).hide();
		}else{
			Ext.fly(this.StatusBar_Text2.getEl()).show();
		}
		Ext.fly(this.StatusBar_Text2.getEl()).update(stat2);
		if(rich_ImageEditor.img_dateFlag){
			var statDate=new Date().format('n/d/Y');
			if(rich_ImageEditor.imgDATE ==0){
				Ext.fly(this.StatusBar_Date.getEl()).update(statDate);
			}else{
				statDate=""+rich_ImageEditor.imgDATE;//convert to string
				Ext.fly(this.StatusBar_Date.getEl()).update(statDate.substr(0,25));
			}
			Ext.fly(this.StatusBar_Date.getEl()).show();
		}else{
			Ext.fly(this.StatusBar_Date.getEl()).update("");
			Ext.fly(this.StatusBar_Date.getEl()).hide();
		}
	},//end function onStatusUpdate

	enableMenuFunctions: function(){
		Ext.getCmp('rich_imgEditor-win-menu_fileSave').enable();
		Ext.getCmp('rich_imgEditor-win-menu_fileProp').enable();
		Ext.getCmp('rich_imgEditor-win-menu_editRestore').enable();
		Ext.getCmp('rich_imgEditor-win-menu_editRefresh').enable();
		if(rich_ImageEditor.historyIndex>0){
			Ext.getCmp('rich_imgEditor-win-menu_editUndo').enable();
			Ext.getCmp('rich_imgEditor-toolbar_Undo').enable();
		}else{
			Ext.getCmp('rich_imgEditor-win-menu_editUndo').disable();
			Ext.getCmp('rich_imgEditor-toolbar_Undo').disable();
		}//end if historyIndex
		if(rich_ImageEditor.historyIndex<rich_ImageEditor.historyAction.length-1){
			Ext.getCmp('rich_imgEditor-win-menu_editRedo').enable();
			Ext.getCmp('rich_imgEditor-toolbar_Redo').enable();
		}else{
			Ext.getCmp('rich_imgEditor-win-menu_editRedo').disable();
			Ext.getCmp('rich_imgEditor-toolbar_Redo').disable();
		}//end if historyIndex
		Ext.getCmp('rich_imgEditor-win-menu_filter').enable();
		Ext.getCmp('rich_imgEditor-toolbar_Resize').enable();
		Ext.getCmp('rich_imgEditor-toolbar_Hand').enable();
		Ext.getCmp('rich_imgEditor-toolbar_Zoom').enable();
		Ext.getCmp('rich_imgEditor-toolbar_Marquee').enable();
		Ext.getCmp('rich_imgEditor-toolbar_Crop').enable();
		Ext.getCmp('rich_imgEditor-toolbar_Rotate').enable();
		Ext.getCmp('rich_imgEditor-toolbar_Mirror').enable();
	},//end function enableMenuFunctions

	updateCanvas: function(){
		//updates the canvas dimensions and attributes
    	var thisApp = rich_ImageEditor.getDesktop.getWindow(rich_ImageEditor.winId);
		var winWidth = thisApp. getInnerWidth();
		var winHeight = thisApp.getInnerHeight();
		var editorWindow = document.getElementById("ImageEditorWindow");
		var editorImage = document.getElementById("ImageEditorCanvas");
		var imgStyle_overflow="hidden";
//		if(rich_ImageEditor.imgH_edit>winHeight || rich_ImageEditor.imgW_edit>winWidth){
		if(rich_ImageEditor.h>winHeight || rich_ImageEditor.w>winWidth){
			//scroll is based on canvas size instead of image
			imgStyle_overflow="auto";//scroll
		}else{
			editorWindow.scrollLeft=0;
			editorWindow.scrollTop=0;
		}//end if pic> canvas size
		editorImage.style.height=(winHeight-15-4)+"px";
		editorImage.style.width=(winWidth-15-3)+"px";
		editorImage.style.overflow=imgStyle_overflow;
		editorWindow.style.width=(winWidth-4)+"px";
		editorWindow.style.height=(winHeight-3)+"px";
		editorImage.style.cursor = rich_ImageEditor.cursorStyle;
	},//end function updateCanvas

	displayImage : function(imageData){
    	var thisApp = rich_ImageEditor.getDesktop.getWindow(rich_ImageEditor.winId);
		var sb = Ext.getCmp("rich_imgEditor-win-statusbar");
		var sb_text="Loading image... "
		var actionFlag=false;
		try{
			actionFlag=true; //when not performed by upload/open command
			sb_text=imageData.lastFtnCall.action+" done. "+sb_text;
		}catch(e){}//escape err
		sb.setStatus({
			iconCls: '',
			text: sb_text
		});
		if(actionFlag){
		try{//store action for undo
			if(imageData.lastFtnCall.action!="undo" &&
			   imageData.lastFtnCall.action!="redo" &&
			   imageData.lastFtnCall.action!="cleanUp" &&
			   imageData.lastFtnCall.action!="restoreIMG" &&
			   imageData.lastFtnCall.action!="viewActive" &&
			   imageData.lastFtnCall.action!="save" &&
			   imageData.lastFtnCall.action!="" &&
			   imageData.lastFtnCall.redoFlag!=true){
				rich_ImageEditor.historyIndex++;
				var tempHist=new Array();
				for(x=0; x<rich_ImageEditor.historyIndex;x++){
					//rebuild history
					tempHist[x]=rich_ImageEditor.historyAction[x];
				}//end for x
				rich_ImageEditor.historyAction=null;//empty it out
				delete rich_ImageEditor.historyAction;
				rich_ImageEditor.historyAction=tempHist;
				delete tempHist; //clear mem
				rich_ImageEditor.historyAction[rich_ImageEditor.historyIndex]=imageData.lastFtnCall;
			}//end if recordable history
			if(imageData.lastFtnCall.action=="restoreIMG"){
				rich_ImageEditor.historyIndex=0;
				delete rich_ImageEditor.historyAction;
				rich_ImageEditor.historyAction=new Array();
			}//reset undo/redo upon restore
		}catch(e){}//escape err
		}//end if actionFlag
		if(imageData.size===true){
			//an action was performed
			rich_ImageEditor.imgSize_orig= imageData.imgSize_orig;// in KB
			rich_ImageEditor.imgSize_edit= imageData.imgSize_edit;
			rich_ImageEditor.imgW_orig= imageData.imgW_orig;
			rich_ImageEditor.imgH_orig=imageData.imgH_orig;
			rich_ImageEditor.imgMAXw=imageData.imgMAXw;
			rich_ImageEditor.imgMAXh=imageData.imgMAXh;
			rich_ImageEditor.imgWH_tolerance=imageData.imgWH_tolerance;
			rich_ImageEditor.imgZoom=imageData.imgZoom;
			rich_ImageEditor.imgAspectRatio=imageData.imgAspectRatio;
		}else{//loaded by open cmd
			rich_ImageEditor.imgSize_orig= imageData.size/1000;
			rich_ImageEditor.imgSize_edit= imageData.size/1000;
			rich_ImageEditor.imgW_orig= imageData.w;
			rich_ImageEditor.imgH_orig=imageData.h;
		}//end if imageData.size
		rich_ImageEditor.imgRez=imageData.imgRez;
		rich_ImageEditor.imgW_edit= imageData.w;
		rich_ImageEditor.imgH_edit= imageData.h;
		rich_ImageEditor.imgDATE= imageData.lastmod;
		if(rich_ImageEditor.w<=0) rich_ImageEditor.w=imageData.w;
		if(rich_ImageEditor.h<=0) rich_ImageEditor.h=imageData.h;
		if(rich_ImageEditor.imgName!= imageData.name && rich_ImageEditor.imgName!= ""){
			//remove previous image from edit dir
			this.processImage({'action': "cleanUp"});
			rich_ImageEditor.w= imageData.w; //canvas matches image
			rich_ImageEditor.h= imageData.h;
			rich_ImageEditor.cursorStyle="default";
			rich_ImageEditor.historyIndex=0;
			rich_ImageEditor.historyAction= new Array("");
		}//end if imgName
		rich_ImageEditor.imgName= imageData.name;
		rich_ImageEditor.imgURL= imageData.url;
		Ext.DomHelper.overwrite('ImageEditorCanvas', {
			tag: 'img'
			,src: rich_ImageEditor.getImgUrl+"?imageName="+rich_ImageEditor.imgName+"&Hindex="+rich_ImageEditor.historyIndex+"&_dc="+(new Date).getTime()
			,style:'margin:0px;'//visibility:hidden;
			,id: "CanvasPIC"
			,name: "CanvasPIC"
		}, true).show(true).frame();

		//handle load event of new pic
		var canvasPIC = document.getElementById("CanvasPIC");
		canvasPIC.onload = function(){
			var sb = Ext.getCmp("rich_imgEditor-win-statusbar");
			sb.setStatus({
				iconCls: 'x-status-valid',
				text: "Ready"
			});
		}//end function canvasPIC.onload

		thisApp.setTitle(rich_ImageEditor.winTitle+" &minus; "+rich_ImageEditor.imgName);
		thisApp.taskButton.setText(rich_ImageEditor.winTitle+" &minus; "+rich_ImageEditor.imgName);
		try{
			this.updateCanvas();
			this.enableMenuFunctions();
			this.onStatusUpdate();
		}catch(e){}
	},//end function displayImage

	processImage: function(params){
		var aURL="";
		if(params.aURL!=""){
			aURL=params.aURL;
			params.aURL="";
			delete params.aURL;
		}//end if url
		var sb = Ext.getCmp("rich_imgEditor-win-statusbar");
		sb.setStatus({
			iconCls: '',
			text: "Sent server request: "+params.action
		});
		//add imageName to params
		params.imageName=rich_ImageEditor.imgName;
		params.Hindex=rich_ImageEditor.historyIndex;
		this.sendAjaxRequest(
			params,
			function(result, request){
				var response = Ext.util.JSON.decode(result.responseText);
				if(response.error){
					var sb = Ext.getCmp("rich_imgEditor-win-statusbar");
					sb.setStatus({
						iconCls: 'x-status-error',
						text: "An error occured on the server... Please try again."
					});
					this.showErrorMsg(response.error);
				}else{ 
					imageData=new Ext.data.Store({
							lastFtnCall: params,
							name: response.imageName
							,w: response.w
							,h: response.h
							,imgMAXh : response.maxHeight
							,imgMAXw : response.maxWidth
							,imgWH_tolerance: response.tolerance
							,imgSize_orig: response.imgSize_orig
							,imgSize_edit: response.imgSize_edit
							,size: true
							,imgW_orig: response.ow
							,imgH_orig: response.oh
							,lastmod: new Date(response.lastmod).format("n/d/Y g:i a")
							,url: response.url
							,imgZoom: 100 * response.zoomRatio
							,imgAspectRatio: response.imgAspectRatio
							,imgRez: response.imgRez
					});
					if(params.action!="cleanUp" &&
					   	params.action!="save"
					   ){
						this.displayImage(imageData);
					}//end if action
				}//end if response.error
			},//end sucess function
			function(result, request){
				var sb = Ext.getCmp("rich_imgEditor-win-statusbar");
				sb.setStatus({
					iconCls: 'x-status-error',
					text: rich_ImageEditor.connErrMsg
				});
				this.showErrorMsg(rich_ImageEditor.connErrMsg);
			}//end failure function
			,aURL
		);    
	}//end function processImage
	
}//end function (call) Ext.extend
);// end var QoDesk.rich_imgEditor



QoDesk.rich_imgEditor.VIcontainer = function(config){
	this.owner = config.owner;
	
	QoDesk.rich_imgEditor.VIcontainer.superclass.constructor.call(this, {
	/*
	TODO: re-write this using a template... see dataView example and EXT.templates
	*/
		autoScroll: false,
		bodyStyle: 'padding:0px',
		border: false,
		html: '<div name="ImageEditorWindow" id="ImageEditorWindow" ><table id="IEW_canvasContainer" border="0" cellpadding="0" cellspacing="0"><tr><td align="right" valign="bottom"><img id="rulerZ" name="rulerZ" src="/!Admin/images/rule+.jpg" width="15" height="15" alt="Ruler" galleryimg="no"></td><td align="left" valign="bottom"><div id="edRuleX" name="edRuleX" style="height:15px;"><img id="rulerX" name="rulerX" src="/!Admin/images/IMGruler_vert.jpg" width="699" height="15" alt="Ruler: Pixels" galleryimg="no"></div></td></tr><tr><td align="right" valign="top" background="/!Admin/images/canvasPattern.jpg"><div id="edRuleY" name="edRuleY" style="width:15px;"><img id="rulerY" name="rulerY" src="/!Admin/images/IMGruler_horizontal.jpg" width="15" height="699" alt="Ruler: Pixels" galleryimg="no"></div></td><td width="100%" height="100%" align="left" valign="top" background="/!Admin/images/canvasPattern.jpg"><div name="ImageEditorCanvas" id="ImageEditorCanvas"></div></td></tr></table></div>',
		id: config.id
	});
	
};

Ext.extend(QoDesk.rich_imgEditor.VIcontainer, Ext.Panel, {
	afterRender : function(){
		this.on({
			'mousedown': {
				fn: this.doAction,
				scope: this,
				delegate: 'a'
			},
			'click': {
				fn: Ext.emptyFn,
				scope: null,
				delegate: 'a',
				preventDefault: true
			}
		});
		
		QoDesk.rich_imgEditor.VIcontainer.superclass.afterRender.call(this); // do sizing calcs last
	},
	
	doAction : function(e, t){
    	e.stopEvent();
		alert("mouse action detected...");
    	this.actions[t.id](this.owner);  // pass owner for scope
    }
});













/*
 // modified from DataView/chooser.js code
 */
QoDesk.rich_imgEditor.ImageViewer = function(config){
	//extend rich_imgEditor functions...
	this.config = config;
};

QoDesk.rich_imgEditor.ImageViewer.prototype = {
    // cache data by image name for easy lookup
    lookup : {},
    
	show : function(){// el,   callback
		if(!this.win){
			this.initTemplates();
			
			this.store = new Ext.data.JsonStore({
			    url: this.config.url,
			    root: 'images',
			    fields: [
			        'name', 'url',
			        {name:'h', type: 'float'},
			        {name:'w', type: 'float'},
			        {name:'th', type: 'float'},
			        {name:'tw', type: 'float'},
			        {name:'imgRez', type: 'float'},
			        {name:'size', type: 'float'},
			        {name:'lastmod', type:'date', dateFormat:'timestamp'}
			    ],
			    listeners: {
			    	'load': {fn:function(){ this.view.select(0); }, scope:this, single:true}
			    }
			});
			this.store.load();
			
			var formatSize = function(data){
		        if(data.size < 1048.576) {
		            return data.size + "  bytes";
		        } else if(data.size < 1048576) {
		            return (Math.round(((data.size*100) / 1048.576))/100) + " KB";
		        } else {
		            return (Math.round(((data.size*100) / 1048576))/100) + " MB";
		        }
		    };
			
			var formatData = function(data){
		    	data.shortName = data.name.ellipse(15);
		    	data.sizeString = formatSize(data);
		    	data.dateString = new Date(data.lastmod).format("n/d/Y g:i a");//  m/d/Y g:i a
		    	this.lookup[data.name] = data;
		    	return data;
		    };
			
		    this.view = new Ext.DataView({
				tpl: this.thumbTemplate,
				singleSelect: true,
				overClass:'x-view-over',
				loadingText: 'Loading Images...',
				itemSelector: 'div.thumb-wrap',
				emptyText : '<div style="padding:10px;">No images match the specified filter</div>',
				deferEmptyText: true,
				store: this.store,
				listeners: {
					'selectionchange': {fn:this.showDetails, scope:this, buffer:100},
					'dblclick'       : {fn:this.doCallback, scope:this},//
					'loadexception'  : {fn:this.onLoadException, scope:this},
					'beforeselect'   : {fn:function(view){
				        return view.store.getRange().length > 0;
				    }}
				},
				prepareData: formatData.createDelegate(this)
			});
		    
			var cfg = {
		    	title: rich_ImageEditor.imgOpDialogTitle,
				iconCls: rich_ImageEditor.winIcon,
		    	id: 'img-chooser-dlg',
		    	layout: 'border',
				minWidth: 500,
				minHeight: 250,
				modal: true,
				closeAction: 'hide',
				border: false,
				cb: null, //callback function
				items:[{
					id: 'img-chooser-view',
					region: 'center',
					autoScroll: true,
					items: this.view,
                    tbar:[{
                    	text: 'Filter:'
                    },{
                    	xtype: 'textfield',
                    	id: 'filter',
                    	selectOnFocus: true,
                    	width: 100,
                    	listeners: {
                    		'render': {fn:function(){
						    	Ext.getCmp('filter').getEl().on('keyup', function(){
						    		this.filter();
						    	}, this, {buffer:500});
                    		}, scope:this}
                    	}
                    }, ' ', '-', {
                    	text: 'Sort By:'
                    }, {
                    	id: 'sortSelect',
                    	xtype: 'combo',
				        typeAhead: true,
				        triggerAction: 'all',
				        width: 100,
				        editable: false,
				        mode: 'local',
				        displayField: 'desc',
				        valueField: 'name',
				        lazyInit: false,
				        value: 'name',
				        store: new Ext.data.SimpleStore({
					        fields: ['name', 'desc'],
					        data : [
									['name', 'Name'],
									['h', 'Image Height'],
									['w', 'Image Width'],
									['size', 'File Size'],
									['lastmod', 'Last Modified']
							]
					    }),
					    listeners: {
							'select': {fn:this.sortImages, scope:this}
					    }
                    },' ', '-', ' ',{
						text: 'Reload',
						tooltip: 'Reload the Images',
						iconCls:'RIE-restore',
						id: 'rich_imgEditor-openRefresh',
						handler: function(){ this.reset(); },
						scope: this
				    }]
				},{
					id: 'img-detail-panel',
					region: 'east',
					split: true,
					width: 150,
					minWidth: 150,
					maxWidth: 250
				}],
				buttons: [{
					id: 'ok-btn',
					text: 'Open',
					handler: this.doCallback,
					scope: this
				},{
					text: 'Cancel',
					handler: function(){ this.win.hide(); },
					scope: this
				}],
				keys: {
					key: 27, // Esc key
					handler: function(){ this.win.hide(); },
					scope: this
				}
			};
			Ext.apply(cfg, this.config);
		    this.win = new Ext.Window(cfg);
		}
		
		this.reset();
	    this.win.show();//el
		//this.callback = callback;
		//this.animateTarget = el;
	},
	
	initTemplates : function(){
		this.thumbTemplate = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="thumb-wrap" id="{name}">',
				'<div class="thumb"><img src="{url}" title="{name}" width={tw} height={th}></div>',
				'<span>{shortName}</span></div>',
			'</tpl>'
		);
		this.thumbTemplate.compile();
		
		this.detailsTemplate = new Ext.XTemplate(
				'<DIV class="details">',
					'<tpl for=".">',
						'<img src="{url}" title="{name}" width={tw} height={th}><DIV class="details-info">',
						'<b>Image Name:</b>',
						'<SPAN>{shortName}</SPAN>',
						'<b>Dimensions:</b>',
						'<SPAN>W: {w}px&nbsp;&nbsp;&nbsp;&nbsp;H: {h}px</SPAN>',
						'<b>Resolution:</b>',
						'<SPAN>{imgRez}&nbsp;ppi</SPAN>',
						'<b>File Size:</b>&nbsp;&nbsp;{sizeString}',
						'<b>Last Modified:</b>',
						'<SPAN>{dateString}</SPAN></DIV>',
					'</tpl>',
				'</DIV>'
		);
		this.detailsTemplate.compile();
	},
	
	showDetails : function(){
	    var selNode = this.view.getSelectedNodes();
	    var detailEl = Ext.getCmp('img-detail-panel').body;
		if(selNode && selNode.length > 0){
			selNode = selNode[0];
			Ext.getCmp('ok-btn').enable();
		    var data = this.lookup[selNode.id];
			data.shortName = data.name.ellipse(19);
			detailEl.hide();
            this.detailsTemplate.overwrite(detailEl, data);
            detailEl.slideIn('l', {stopFx:true,duration:.2});
		}else{
		    Ext.getCmp('ok-btn').disable();
		    detailEl.update('');
		}
	},
	
	filter : function(){
		var filter = Ext.getCmp('filter');
		this.view.store.filter('name', filter.getValue());
		this.view.select(0);
	},
	
	sortImages : function(){
		var v = Ext.getCmp('sortSelect').getValue();
    	this.view.store.sort(v, v == 'name' ? 'asc' : 'desc');
    	this.view.select(0);
    },
	
	reset : function(){
		if(this.win.rendered){
			Ext.getCmp('filter').reset();
			this.view.getEl().dom.scrollTop = 0;
		}
	    this.view.store.clearFilter();
		this.view.store.reload();
		this.view.select(0);
	},
	
	doCallback : function(){
        var selNode = this.view.getSelectedNodes()[0];
		var lookup = this.lookup;
		this.win.hide(rich_ImageEditor.winId, function(){
            if(selNode && this.cb){// 
				var data = lookup[selNode.id];
				if(data.name!=""){ 
					/** inform callee of current data */
					//if (typeof(this.cb) === "function") 
					this.cb.displayImage(data);
					try{
						var sb = Ext.getCmp("rich_imgEditor-win-statusbar");
						sb.setStatus({
							iconCls: '',
							text: "Opening image..."
						});
					}catch(e){}
				}
			}
		});
    },
	
	onLoadException : function(v,o){
	    this.view.getEl().update('<div style="padding:10px;">Error loading images.</div>'); 
	}
};// end function QoDesk.rich_imgEditor.ImageViewer

String.prototype.ellipse = function(maxLength){
    if(this.length > maxLength){// shows: filenam...ext
        return this.substr(0, maxLength-3) + '...' +this.substr(this.length-3,this.length);
    }
    return this;
};



Ext.form.ButtonField = Ext.extend(Ext.form.Field,  {
// from ;  http://extjs.com/forum/showthread.php?t=6099&page=2
	defaultAutoCreate  : { 
		tag: 'div' 
	},
	onRender: function (ct, position) {
            if(!this.el){
                var cfg = this.getAutoCreate();
                if(!cfg.name){
                    cfg.name = this.name || this.id;
                }
                if(this.inputType){
                    cfg.type = this.inputType;   
		}
                this.el = ct.createChild(cfg, position);
            }

		this.button =  	new Ext.Button({
			renderTo : this.el,
			text     : this.text,
			iconCls  : this.iconCls || null,
			handler  : this.handler || Ext.emptyFn,
			scope    : this.scope   || this
		})
	},
	getValue : Ext.emptyFn,
	setValue : Ext.emptyFn
});

function rie_imgAspectCalc(/* obj - construct */ params){
// calculates the aspect ratio of the image w & h
// returns the proper w / h with respect the aspect ratio
	if(params.h < params.w){//get ratio when keeping width at max pixels
		myratio = params.w / params.h;
		tw = params.max_thumbWidth;
		th = params.max_thumbHeight / myratio;
	}else{
		myratio = params.h / params.w;
		tw = params.max_thumbWidth / myratio;
		th = params.max_thumbHeight;
	}//end if size
	params.w=tw;
	params.h=th;
	params.myratio=myratio;
	return(params);
}//end function rie_imgAspectCalc