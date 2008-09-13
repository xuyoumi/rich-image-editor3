<?php
/*
* Image Editor 3.0
* for the qWikiOffice platform(v0.7.1) powered by EXTjs.com framework.
* design & coded by Richie Bartlett
* code Date: Sept 2008
*/
// required params: action, imageName
error_reporting(E_ERROR | E_PARSE); //limit error output
mb_internal_encoding("UTF-8");// add support for Asian languages
header("Content-Type: text/html");
require_once("imgFunctions.php");

/// TODO: add permissions check to  "./" , "./edit" , "./Saved"
/// TODO: getImage.php needs to verify caller, sessID before delivery of image...


function prMultiDemArray($arrayName,  $prevDemName=""){
//recursive function to return (as string) array values in a "first.second.third = value" format
	$out="";
	foreach($arrayName as $key => $val){
		if(is_array($val)){
			$out.=prMultiDemArray($val,  ($prevDemName!= ""? "$prevDemName.": "").$key);
		}else{
			$out.= ($prevDemName!= ""? "$prevDemName.": "")."$key: $val<br />";
		}//end if is_array:key
	}//end for arrayName
	return($out);
}//end function prMultiDemArray


$requiredImageFileType="/\.(jpg|jpeg|gif|png)$/";
$imageTypeErrMsg = "JPG, JPEG, GIF, or PNG";
//$requiredImageFileType="/\.jpg$/";
//$imageTypeErrMsg = "JPG";
$maxFileUploadSize=((int) ini_get('upload_max_filesize'))*1048576;//post_max_size
//$maxFileSizeStr=" ".round((int) $maxFileUploadSize/1048576,1);

//files saved here from Save menu option
//"Open" menu option only sees the ./saved folder 
$originalDirectory = getcwd()."/Saved/";//also the Restore directory
$editDirectory = getcwd()."/edit/";//files are kept here during editing
//   /!Admin/system/modules/rich_imgEditor-v3.0/Saved/

$imageName = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['imageName']))),ENT_NOQUOTES, "UTF-8");
$action=htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['action']))),ENT_NOQUOTES, "UTF-8");
$response="{success:false}";//init response to client

//when set to "1" will force the scaled image to overwrite the original on load.
$forceScaleSAVE = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['forceScaleSAVE']))),ENT_NOQUOTES, "UTF-8");
//force image to a max xy of:
$forceScaleDown = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['forceScaleDown']))),ENT_NOQUOTES, "UTF-8");

//history index for un/redo functions
$Hindex = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['Hindex']))),ENT_NOQUOTES, "UTF-8");
if($Hindex<0 || !is_numeric($Hindex)) $Hindex=0;

$maxHeight=700;
$maxWidth=700;
$max_thumbHeight=60;
$max_thumbWidth=80;
$tolerance=0.15;
$zoomRatio = 1;
$imgRez=72; //default web image resolution...
$imgAspectRatio = 1;


$imgType = mb_substr($imageName, strrpos($imageName, ".")-strlen($imageName)+1 );
//$imgNameIndex=basename($imageName, ".$imgType")."____[$Hindex].$imgType";
//basename is not mult-byte safe!
$imgNameIndex=mb_substr($imageName, 0,strrpos($imageName, "."))."____[$Hindex].$imgType";


if($action!="storeImage" && $action!="exploreImages"){

	if(empty($imageName) || $imageName=="" || !file_exists($originalDirectory.$imageName)){echo "{success:false,imageFound:false,error:\"Image data not found...\"}";exit;}
//make the "undo" files
	if($Hindex>0){
		@copy($editDirectory.mb_substr($imageName, 0,strrpos($imageName, "."))."____[".($Hindex-1)."].$imgType", $editDirectory.$imgNameIndex);
	}else{
		@copy($originalDirectory.$imageName, $editDirectory.$imgNameIndex);
	}//end if prev->copy

	$startMEM=memory_get_usage();
	$memStat =setMemoryForImage($editDirectory.$imgNameIndex);// update Memory config!
	if($memStat===false) {echo "{success:false, error:\"Not enough server memory to process this image...<br><BR>memoryLimit=".((int) ini_get('memory_limit')*1048576)." <BR>memoryUsed=".memory_get_usage()." <BR>memoryNeed=".getMemoryForImage($editDirectory.$imgNameIndex)." \"}";exit;}
	header("Content-Disposition: inline; filename=[Properties] $imageName.txt"); 
}else{
	header("Content-Disposition: inline; filename=processImage.txt"); 
}//end if action


//TODO: add fileLock(true/false) option to output; check if file is in use...

switch($action){
	case "storeImage":
		$file_byte_size = $_FILES['rie_upFILE']['size'];
		if($file_byte_size > $maxFileUploadSize){ 
			$response = "{success:false, error:\"The file you tried to upload is larger than ".$maxFileUploadSize."MB, please reduce it's size or try another image.<br />maxFileUploadSize=$maxFileUploadSize<br />".addslashes(json_encode($_POST))."<br>".addslashes(json_encode($_FILES))."\"}";
			break;
		}//end if $maxFileUploadSize
		
		$TheFileName = $_FILES['rie_upFILE']['name'];
		$TempName = $_FILES['rie_upFILE']['tmp_name'];
		$uploaded=true;
		$uploaded=is_uploaded_file($_FILES['rie_upFILE']['tmp_name']);//2nd security check -- guards against hacks
		///check the file... is it an actual image??
		$imgSizeCheck = @getimagesize($TempName);
		if(!preg_match($requiredImageFileType, strtolower($TheFileName)) || !$imgSizeCheck || !$uploaded){ //must be image
			if(file_exists($TheFileName)) @unlink($TheFileName); //clean it up!
			if(file_exists($TempName)) @unlink($TempName); //clean it up!
			$response = "{success:false, error:\"The file you tried to upload wasn't a valid $imageTypeErrMsg file.\"}"; 
		}else{//good image
		//TODO: need to check filename for existing file in target directories! if exist rename to userImgName.sessionID
			@copy($TempName, $originalDirectory.$TheFileName);//for later retrieval
			@copy($TempName, $editDirectory.$imgNameIndex);//for immediate editing
			if(file_exists($TempName)) @unlink($TempName); //clean it up!
			$response="{success:true}";
		}//end if !requiredImageFileType
		break;

	case "exploreImages":
		//outputs a list of images in $originalDirectory with details 
		$images = array();
		$d = dir($originalDirectory);
		while($name = $d->read()){
			if(!preg_match($requiredImageFileType, strtolower($name))) continue;
			list($w, $h) = @getimagesize($originalDirectory.$name);
			$img_fSize = filesize($originalDirectory.$name);
			if($w<1 || $h<1 || $img_fSize<0.01) continue;// bad file
			if($h < $w){//get ratio when keeping width at max pixels
				$myratio = $w / $h;
				$tw = $max_thumbWidth;
				$th = $max_thumbHeight / $myratio;
			}else{
				$myratio = $h / $w;
				$tw = $max_thumbWidth / $myratio;
				$th = $max_thumbHeight;
			}//end if size
			$imgR=getJPEGresolution($originalDirectory.$name);
			$images[] = array(
				'name'=>$name, 
				'size'=>$img_fSize, 
				'w'=>$w, 
				'h'=>$h, 
				'tw'=>$tw, 
				'th'=>$th, 
				'imgRez'=>($imgR===false? $imgRez: $imgR['xDPI']),
				'lastmod'=>filemtime($originalDirectory.$name)*1000, 
				'url'=>substr($originalDirectory, strpos($originalDirectory,"!Admin")-1).$name
				//'url'=>"/!Admin/system/modules/rich_imgEditor-v3.0/getImage.php?imageName=" .$name
			);
		}//end while name(dir)
		$d->close();
		$o = array('images'=>$images);
		$response= json_encode($o);
		break;

	case "undo":
		//trash last redo
		if($Hindex>0){
			//@unlink($editDirectory.mb_substr($imageName, 0,strrpos($imageName, "."))."____[".($Hindex+0)."].$imgType");
			@unlink($editDirectory.mb_substr($imageName, 0,strrpos($imageName, "."))."____[".($Hindex+1)."].$imgType");
			$Hindex--;
		}
		$imgNameIndex=mb_substr($imageName, 0,strrpos($imageName, "."))."____[$Hindex].$imgType";
		break;

	case "save":
		copy($editDirectory.$imgNameIndex, $originalDirectory.$imageName);
	case "cleanUp":
		$response = "{success:true}";
		//remove extra copies of image
		foreach (glob($editDirectory.mb_substr($imageName, 0,strrpos($imageName, "."))."____*") as $filename)  @unlink($filename);
		exit();//no response required for this cmd
		break;

	case "restoreIMG"://also clears undo/redo history!
		//remove extra copies of image
		foreach (glob($editDirectory.mb_substr($imageName, 0,strrpos($imageName, "."))."____*") as $filename)  @unlink($filename);
	case "viewActive":
		usleep(430000); //wait for .43 seconds before continuing -- resolves upload not found issue
		if(!file_exists($editDirectory.$imgNameIndex)){
			if(!file_exists($originalDirectory.$imageName)){
					$response= "{success:false, error: \"viewActive($imageName) function failure: original image not found...\"}";
					break;
			}//end if file err
			@copy($originalDirectory.$imageName, $editDirectory.$imgNameIndex);
		}//end if file exist
		list($owidth,$oheight) = getimagesize($editDirectory.$imgNameIndex);
		if($oheight < $owidth){//get ratio when keeping width at max pixels
			$myratio = $owidth / $oheight;
			$width = $maxWidth;
			$height = $maxHeight / $myratio;
		}else{
			$myratio = $oheight / $owidth;
			$width = $maxWidth / $myratio;
			$height = $maxHeight;
		}//end if size
		if($forceScaleDown=="1"){
			if(($owidth>$maxWidth+$maxWidth*$tolerance) || ($oheight>$maxHeight+$maxHeight*$tolerance)){
				//auto resize it
				if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
				if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
				if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
				$out = imagecreatetruecolor($width, $height);//reBuffer the img bkgnd
				fastimagecopyresampled($out, $in, 0, 0, 0, 0, $width, $height, $owidth, $oheight);
				if(!$out){
					$response= "{success:false, error: \"viewActive() function failure...\"}";
					break;
				}//end if out error
				if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($out, $editDirectory.$imgNameIndex, 100);
				if ($imgType == "gif") imagegif($out,$editDirectory.$imgNameIndex);
				if ($imgType == "png") imagepng($out,$editDirectory.$imgNameIndex);
				imagedestroy($in);
				imagedestroy($out);
				if($forceScaleSAVE =="1") copy($editDirectory.$imageName, $originalDirectory.$imgNameIndex);
			}//end if auto resize
		}//end if forceScaleDown
		break;

	case "mirror": // additional required params: direction (vertical,horizontal)
		$imgType=strtolower($imgType);
		$direction=strtolower(htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['direction']))),ENT_NOQUOTES, "UTF-8"));
		if(empty($direction)) exit;
		$imgType=strtolower($imgType);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		$output = @image_mirror($in, $direction);
		if(!$output){
			$response =  "{success:false, error: \"mirror($direction) function failure...\"}";
		}//end if out error
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($output, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($output,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($output,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		imagedestroy($output);
		break;

	case "resize": // additional required params: w, h
	try{
		$imgType=strtolower($imgType);
		$out_w = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['w']))),ENT_NOQUOTES, "UTF-8");
		$out_h = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['h']))),ENT_NOQUOTES, "UTF-8");
		if(!is_numeric($out_w) || $out_w < 1 || $out_w > $maxWidth+ $maxWidth*$tolerance || !is_numeric($out_h) || $out_h < 1 || $out_h > $maxHeight+$maxHeight*$tolerance) {
			$response =  "{success:false, error: \"resize($out_w,$out_h) attempting to exceed maximum height or width restrictions...<br><BR> Please edit program options to over-ride this feature.\"}"; 
			break;
		}//end if maxWH
		list($in_w, $in_h) = getimagesize($editDirectory.$imgNameIndex);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		if(!$in){
			$response =  "{success:false, error: \"resize($in_w,$in_h)(*in) function failure...\"}";
		}//end if out error
		$out = imagecreatetruecolor($out_w, $out_h);
		if(!$out){
			$response =  "{success:false, error: \"resize($out_w,$out_h)(*out) function failure...\"}";
		}//end if out error
		$status = fastimagecopyresampled($out, $in, 0, 0, 0, 0, $out_w, $out_h, $in_w, $in_h);
		if(!$out || !status){
			$response =  "{success:false, error: \"resize($out_w,$out_h)(*out) function failure...\"}";
		}//end if out error
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($out, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($out,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($out,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		imagedestroy($out);
	}catch(Exception $e){
		$response =  "{success:false, error: \"resize($out_w,$out_h)(*out) function failure...\n PHP Error: ".$e->getMessage()."\"}";
	}//end try..catch
		break;

	case "rotate": // additional required params: degrees (90, 180 or 270)
		$imgType=strtolower($imgType);
		$degrees = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['degrees']))),ENT_NOQUOTES, "UTF-8");
		if(($degrees != 90 && $degrees != 180 && $degrees != 270)) { exit; }
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		if($degrees == 180){
			$out = imagerotate($in, $degrees, 180);
		}else{ // 90 or 270
			$x = imagesx($in);
			$y = imagesy ($in);
			$max = max($x, $y);

			$square = imagecreatetruecolor($max, $max);
			imagecopy($square, $in, 0, 0, 0, 0, $x, $y);
			$square = imagerotate($square, $degrees, 0);

			$out = imagecreatetruecolor($y, $x);
			if($degrees == 90) {
				imagecopy($out, $square, 0, 0, 0, $max - $x, $y, $x);
			} elseif($degrees == 270) {
				imagecopy($out, $square, 0, 0, $max - $y, 0, $y, $x);
			}
			imagedestroy($square);
		}
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($out, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($out,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($out,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		imagedestroy($out);
		break;

	case "crop": // additional required params: x, y, w, h
		$imgType=strtolower($imgType);
		$x = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['x']))),ENT_NOQUOTES, "UTF-8");
		$y = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['y']))),ENT_NOQUOTES, "UTF-8");
		$w = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['w']))),ENT_NOQUOTES, "UTF-8");
		$h = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['h']))),ENT_NOQUOTES, "UTF-8");
		if(!is_numeric($x) || !is_numeric($y) || !is_numeric($w) || !is_numeric($h)){ exit; }
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		$out = imagecreatetruecolor($w, $h);
		imagecopyresampled($out, $in, 0, 0, $x, $y, $w, $h, $w, $h);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($out, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($out,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($out,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		imagedestroy($out);
		break;

	case "grayscale":	// no additional params.
		$imgType=strtolower($imgType);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		imagefilter($in,IMG_FILTER_GRAYSCALE);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($in, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($in,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($in,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		break;

	case "sepia":	// no additional params.
		$imgType=strtolower($imgType);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		imagefilter($in, IMG_FILTER_GRAYSCALE);
		imagefilter($in, IMG_FILTER_COLORIZE, 100, 50, 0);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($in, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($in,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($in,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		break;

	case "pencil":	// no additional params.
		$imgType=strtolower($imgType);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		imagefilter($in, IMG_FILTER_EDGEDETECT);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($in, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($in,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($in,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		break;

	case "emboss":	// no additional params.
		$imgType=strtolower($imgType);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		imagefilter($in, IMG_FILTER_EMBOSS);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($in, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($in,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($in,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		break;

	case "blur":	// no additional params.
		$imgType=strtolower($imgType);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		imagefilter($in, IMG_FILTER_GAUSSIAN_BLUR);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($in, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($in,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($in,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		break;

	case "smooth":	// no additional params.
		$imgType=strtolower($imgType);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		imagefilter($in, IMG_FILTER_SMOOTH, 5);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($in, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($in,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($in,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		break;

	case "invert":	// no additional params.
		$imgType=strtolower($imgType);
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		imagefilter($in, IMG_FILTER_NEGATE);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($in, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($in,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($in,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		break;

	case "brighten":	// param amt = amount to brighten (up or down)
		$imgType=strtolower($imgType);
		$amt = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['amt']))),ENT_NOQUOTES, "UTF-8");
		if ($imgType == "jpg" || $imgType == "jpeg") $in = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		if ($imgType == "gif") $in = imagecreatefromgif($editDirectory.$imgNameIndex);
		if ($imgType == "png") $in = imagecreatefrompng($editDirectory.$imgNameIndex);
		imagefilter($in, IMG_FILTER_BRIGHTNESS, $amt);
		if ($imgType == "jpg" || $imgType == "jpeg") imagejpeg($in, $editDirectory.$imgNameIndex, 100);
		if ($imgType == "gif") imagegif($in,$editDirectory.$imgNameIndex);
		if ($imgType == "png") imagepng($in,$editDirectory.$imgNameIndex);
		imagedestroy($in);
		break;
}//end switch $action

if(!empty($imageName) && !strripos($response,"error")){
	list($ow, $oh) = getimagesize($originalDirectory.$imageName);
	list($w, $h) = getimagesize($editDirectory.$imgNameIndex);
	$imgSize_orig =imgFileSize($originalDirectory.$imageName);//output is in KB
	$imgSize_edit =imgFileSize($editDirectory.$imgNameIndex);
	//$url=addslashes(substr($editDirectory, 0,strpos($editDirectory,"!Admin")).$imgNameIndex);
	$url="/!Admin/system/modules/rich_imgEditor-v3.0/getImage.php?imageName=" .$imageName;
	$fileMOD=filemtime($originalDirectory.$imageName)*1000;
	//get ratio when keeping width at max pixels
	$imgAspectRatio = ($h < $w)? ($w / $h) : ($h / $w);
	$imgR=getJPEGresolution($editDirectory.$imgNameIndex);
	$imgRez=($imgR===false? $imgRez: $imgR['xDPI']);

	$exif = @exif_read_data($editDirectory.$imgNameIndex, 0, true, false);
	if($exif === false || empty($exif)){
		$exif= "&lt; none available &gt;<br />";
	}else{
		$exif= addslashes(prMultiDemArray($exif));
		$exif= str_replace("\n", "", $exif);
		$exif= str_replace("\r", "", $exif);
	}//end if exif available

	$memUse=memory_get_usage() - $startMEM;

	$response= '{success:true,imageFound:true,imageName:"'.$imageName.'",w:'.$w.',h:'.$h.',ow:'.$ow.',oh:'.$oh.',imgSize_orig:'.$imgSize_orig.',imgSize_edit:'.$imgSize_edit.',maxWidth:'.$maxWidth.',maxHeight:'.$maxHeight.',tolerance:'.$tolerance.',zoomRatio:'.$zoomRatio.',url:"'.$url.'", lastmod: '.$fileMOD.',imgRez:'.$imgRez.',imgAspectRatio:'.$imgAspectRatio.',memUse:'.$memUse.',hIndex:'.$Hindex.',exif:"'.$exif.'"}';
}//end if imageName

	header("Content-Length: ".strlen($response));
	echo $response;

	@unlink($editDirectory."____[].");//TODO: find the bug that creates this file...
?>
