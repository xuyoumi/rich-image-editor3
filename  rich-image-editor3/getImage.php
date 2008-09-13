<?php
/*
* Image Editor 3.0
* for the qWikiOffice platform(v0.7.1) powered by EXTjs.com framework.
* design & coded by Richie Bartlett
* code Date: Sept 2008
*/
/************************************************************************/
// required params: imageName
//chdir(dirname((strstr($_SERVER["SCRIPT_FILENAME"], $_SERVER["PHP_SELF"]) ? $_SERVER["SCRIPT_FILENAME"] : $_SERVER["PATH_TRANSLATED"])));

//TODO: add save-as feature==> output file as a different image type
error_reporting(E_ERROR | E_PARSE); //limit error output
mb_internal_encoding("UTF-8");// add support for Asian languages

require_once("imgFunctions.php");

//files saved here from Save menu option
//"Open" menu option only sees the ./saved folder 
$originalDirectory = getcwd()."/Saved/";//also the Restore directory
$editDirectory = getcwd()."/edit/";//files are kept here during editing
$imageName = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['imageName']))),ENT_NOQUOTES, "UTF-8");
$dl = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['dl']))),ENT_NOQUOTES, "UTF-8");

//history index for un/redo functions
$Hindex = htmlspecialchars(addslashes(strip_tags(urldecode($_REQUEST['Hindex']))),ENT_NOQUOTES, "UTF-8");
if($Hindex<0 || !is_numeric($Hindex)) $Hindex=0;

$imgType = mb_substr($imageName, strrpos($imageName, ".")-strlen($imageName)+1 );
$imgNameIndex=mb_substr($imageName, 0,strrpos($imageName, "."))."____[$Hindex].$imgType";

if(empty($imageName) || !file_exists($originalDirectory.$imageName)){
	header("Content-Type: text/plain");
	header("Content-Disposition: attachment; filename=PHPerrorMessage"); 
	$response="{imageFound:false, success:false, error:\"Original Image not found on server...<BR> Contact your systems administrator for assistance...  \"}";
	header("Content-Length: ".strlen($response));
	echo $response;
	exit;
}//end if file_exist

if(!file_exists($editDirectory.$imgNameIndex)){
	if(!file_exists($editDirectory.basename($imageName, ".$imgType")."____[".($Hindex-1)."].$imgType")){
		copy($originalDirectory.$imageName, $editDirectory.$imgNameIndex) || die("{success:false,Error:\"copy failed @\'$imageName\'\"}");
	}else{
		@copy($editDirectory.basename($imageName, ".$imgType")."____[".($Hindex-1)."].$imgType", $editDirectory.$imgNameIndex);
	}//end if can't find org.pic
}//end if not img found

	$memStat =setMemoryForImage($editDirectory.$imgNameIndex);// update Memory config!
	if($memStat===false) {echo "{success:false, error:\"Not enough server memory to process this image...<br><BR>memoryLimit=".ini_get('memory_limit')."\"}";exit;}

switch(strtolower($imgType)){
	case "jpg":
	case "jpeg":
		$contentType="image/jpeg";
		$output = imagecreatefromjpeg($editDirectory.$imgNameIndex);
		ob_start(); // start a new output buffer
		   imagejpeg($output, "", 100);
		   $imageData = ob_get_contents();
		   $imageDataLength = ob_get_length();
		ob_end_clean(); // stop this output buffer
		break;
	case "gif":
		$contentType="image/gif";
		$output = imagecreatefromgif($editDirectory.$imgNameIndex);
		ob_start(); // start a new output buffer
		   imagegif($output, "", 100);
		   $imageData = ob_get_contents();
		   $imageDataLength = ob_get_length();
		ob_end_clean(); // stop this output buffer
		break;
	case "png":
		$contentType="image/png";
		$output = imagecreatefrompng($editDirectory.$imgNameIndex);
		ob_start(); // start a new output buffer
		   imagepng($output);
		   $imageData = ob_get_contents();
		   $imageDataLength = ob_get_length();
		ob_end_clean(); // stop this output buffer
		break;
	case "bmp"://convert the image to JPEG out!
		$contentType="image/jpg";
		$output = imagecreatefromwbmp($editDirectory.$imgNameIndex);
		ob_start(); // start a new output buffer
		   imagejpeg($output, "", 100);
		   $imageData = ob_get_contents();
		   $imageDataLength = ob_get_length();
		ob_end_clean(); // stop this output buffer
		break;
}//end switch imgType


//$dl=($dl==1? "attachment":"inline"); //download or just view?
if($dl==1){//download?
	$dl="attachment";
}else{//or just view?
	//force broswers to load "new" pic based on new filename
	$imageName=$imageName.rand()."".date("U").".".$imgType;
	$dl="inline";
}//end if dl
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Type: $contentType");
header("Content-Length: $imageDataLength");
header("Content-Disposition: $dl; filename=$imageName"); //
header("Content-Description: Image Editor 3.0 file");
echo $imageData;
//imagedestroy($output);

?>