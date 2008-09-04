<?php
/************************************************************************/
/*
* Image Editor 3.0
* for the qWikiOffice platform(v0.7.1) powered by EXTjs.com framework.
* design & coded by Richie Bartlett
* code Date: Sept 2008
*/
/*  Advanced image handling functions...								*/
/************************************************************************/

//TODO: create imageRez function to read/write imgRez

function fastimagecopyresampled(&$dst_image, $src_image, $dst_x, $dst_y, $src_x, $src_y, $dst_w, $dst_h, $src_w, $src_h, $quality = 3){
  // Plug-and-Play fastimagecopyresampled function replaces much slower imagecopyresampled.
  // Just include this function and change all "imagecopyresampled" references to "fastimagecopyresampled".
  // Typically from 30 to 60 times faster when reducing high resolution images down to thumbnail size using the default quality setting.
  //
  // Optional "quality" parameter(defaults is 3).  Fractional values are allowed, for example 1.5.
  // 1 = Up to 600 times faster.  Poor results, just uses imagecopyresized but removes black edges.
  // 2 = Up to 95 times faster.  Images may appear too sharp, some people may prefer it.
  // 3 = Up to 60 times faster.  Will give high quality smooth results very close to imagecopyresampled.
  // 4 = Up to 25 times faster.  Almost identical to imagecopyresampled for most images.
  // 5 = No speedup.  Just uses imagecopyresampled, highest quality but no advantage over imagecopyresampled.
try{
	if(empty($src_image) || empty($dst_image)) return false;
	if($quality <= 1){
		$temp = imagecreatetruecolor($dst_w+1, $dst_h+1);
		imagecopyresized($temp, $src_image, $dst_x, $dst_y, $src_x, $src_y, $dst_w+1, $dst_h+1, $src_w, $src_h);
		imagecopyresized($dst_image, $temp, 0, 0, 0, 0, $dst_w, $dst_h, $dst_w, $dst_h);
		imagedestroy($temp);
	}elseif($quality < 5 &&(($dst_w * $quality) < $src_w ||($dst_h * $quality) < $src_h)) {
		$tmp_w = $dst_w * $quality;
		$tmp_h = $dst_h * $quality;
		$temp = imagecreatetruecolor($tmp_w+1, $tmp_h+1);
		imagecopyresized($temp, $src_image, $dst_x * $quality, $dst_y * $quality, $src_x, $src_y, $tmp_w+1, $tmp_h+1, $src_w, $src_h);
		imagecopyresampled($dst_image, $temp, 0, 0, 0, 0, $dst_w, $dst_h, $tmp_w, $tmp_h);
		imagedestroy($temp);
	}else {
		imagecopyresampled($dst_image, $src_image, $dst_x, $dst_y, $src_x, $src_y, $dst_w, $dst_h, $src_w, $src_h);
	}//end if quality
	return true;
}catch (Exception $e){
	return false;
}//end try...catch
}//end function fastimagecopyresampled


function image_mirror(&$input_image_resource, $direction="vertical"){
    $width = imagesx($input_image_resource);
    $height = imagesy($input_image_resource);
    $output_image_resource = imagecreatetruecolor($width, $height);
    imagealphablending($output_image_resource, true);
    $y = 1;
	$x = 1;
	switch($direction){
		case "flip":
		case "vertical":
			for($x=0; $x<$width; $x++)
				imagecopy($output_image_resource, $input_image_resource, $width-$x-1, 0, $x, 0, 1, $height);
			break;
		case "flop":
		case "horizontal":
			for($y=0; $y<$height; $y++)
				imagecopy($output_image_resource, $input_image_resource, 0, $height-$y-1, 0, $y, $width, 1);
			break;
		case "both":
			for($x=0; $x<$width; $x++)
				imagecopy($output_image_resource, $input_image_resource, $width-$x-1, 0, $x, 0, 1, $height);
			
			$rowBuffer = imagecreatetruecolor($width, 1);
			for($y=0; $y<($height/2); $y++){
				imagecopy($rowBuffer, $output_image_resource  , 0, 0, 0, $height-$y-1, $width, 1);
				imagecopy($output_image_resource  , $input_image_resource  , 0, $height-$y-1, 0, $y, $width, 1);
				imagecopy($output_image_resource  , $rowBuffer, 0, $y, 0, 0, $width, 1);
			}//end for y
			
			imagedestroy($rowBuffer);
			break;
	}//end switch direction
    imagealphablending($output_image_resource, false);
    return($output_image_resource);
}//end function image_mirror


function imgInsertImage(&$srcImg,&$insertImg,$src_x,$src_y){
//superimpose a second image on top of base image
    $lwidth  = imagesx($insertImg);
    $lheight = imagesy($insertImg);
    imagealphablending($srcImg, true);
    imagecopy($srcImg,$insertImg,$src_x,$src_y,0,0,$lwidth,$lheight);
	return($srcImg);
}//end function imgInsertImage


function imgInsertText(&$srcImg,$textInsert,$textX,$textY,$textColor="000000", $textFont=3){
    $fontwidth = imagefontwidth($textFont);
    $fullwidth = strlen($textInsert) * $fontwidth;//px width of text
	$strColor = imagecolorallocate($srcImg, 220, 210, 60);
	imagestring($im, $textFont, $textX, $textY, trim($textInsert), $strColor);
	imagejpeg($srcImg, '',100);
	return($srcImg);
}//end function imgInsertText

function imgFileSize($filename){
	if(is_readable($filename) && !is_dir($filename)){
		return round(filesize($filename)/1048.576,3);//output is in KB
	}//end if readable
	return false;
}//end function imgFileSize



function imageInsertWatermark($destImage, $waterImage, $destX=0, $destY=0, $waterOpacity=50, $autoFitWater=true){
/*	version 1.6 by Richie Bartlett
////this function will return the $waterImage on top of $destImage 
////as imageResourceObject (this is a RAW image object in memory) --
	you must use imagejpeg() or other output function to display image to browser

	$destImage			- src path of destination image
	$waterImage			- src path of watermark image
	$destX				- X co-ord in $destImage to place $waterImage
	$destY				- Y o-ord in $destImage to place $waterImage
	$waterOpacity		- amount of transparency (in percent %) to force
						  on $waterImage before merging with $destImage
	$autoFitWater		- force resize $waterImage to fit within $destImage
	
NOTE: 	waterImage's WHITE background will be forced to transparency
		this function does NOT stream the output to browser.
*/
//echo "\n\r<br>DEBUG: function imageInsertWatermark($destImage, $waterImage, $destX, $destY, $waterOpacity, $autoFitWater)\n\r\n\r";//testing only
	if(empty($waterImage) || empty($destImage)) return false;//nothing to do
	if(!file_exists($waterImage)) return false;//no file
	if(!file_exists($destImage)) return false;//no file
	$imgSizeWater = @getimagesize($waterImage);
	if(!$imgSizeWater){ //must be an image
		return false;
	}//end if not image
	$imgSizeDest = @getimagesize($destImage);
	if(!$imgSizeDest){ //must be an image
		return false;
	}//end if not image
	if($waterOpacity<=0) return false; //watermark not visible, so return...
	$waterOpacity=min(100, $waterOpacity);//max it @ 100
//echo "\n\rDEBUG: waterOpacity=$waterOpacity;";//testing only

	list($destW, $destH) = $imgSizeDest;
	switch(strtolower(substr($destImage, -4))){
        case ".gif":
            $dest_id = imagecreatefromgif($destImage);
			// upsample it to a truecolor image
			$tempImage = imagecreatetruecolor($destW, $destH);
			
			// copy the 8-bit gif into the truecolor image
			imagecopy($tempImage, $dest_id, 0, 0, 0, 0, $destW, $destH);
			
			$dest_id = $tempimage; //update object to new src
			imagedestroy($tempimage);
            break;
        case ".png":
            $dest_id = imagecreatefrompng($destImage);
            break;
		case "jpeg":
        case ".jpg":
            $dest_id = imagecreatefromjpeg($destImage);
            break;
        default:
//			echo "\n\rDEBUG: unsupported image type: ".(strtolower(substr($destImage, -4)));//testing only
            return false; //unsupported image type
    }//end switch ImageType


	list($waterW, $waterH) = $imgSizeWater;
	switch(strtolower(substr($waterImage, -4))){
        case ".gif":
            $water_id = imagecreatefromgif($waterImage);
			// upsample it to a truecolor image
			$tempImage = imagecreatetruecolor($waterW, $waterH);
			
			// copy the 8-bit gif into the truecolor image
			imagecopy($tempImage, $water_id, 0, 0, 0, 0, $waterW, $waterH);
			
			$water_id = $tempimage; //update object to new src
			imagedestroy($tempimage);
            break;
        case ".png":
            $water_id = imagecreatefrompng($waterImage);
            break;
		case "jpeg":
        case ".jpg":
            $water_id = imagecreatefromjpeg($waterImage);
            break;
        default:
//			echo "\n\rDEBUG: unsupported image type: ".(strtolower(substr($waterImage, -4)));//testing only
            return false; //unsupported image type
    }//end switch ImageType

    imageAlphaBlending($water_id, false);
    imageSaveAlpha($water_id, true);
	if($autoFitWater){//force waterMark resize?
		$aspectRatio=$waterW / $waterH; //waterMark's apect
		if($waterH>$destH || $waterW>$destW){//need to downsize
			if($destH < $destW){//(height dominant)
				$newheight = destH;
				$newwidth = destH / $aspectRatio;
			}else{//(width dominant)
				$newwidth = destW;
				$newheight = destW * $aspectRatio;
			}//end if h<w
			$tempImage = imagecreatetruecolor($newwidth, $newheight);
			fastimagecopyresampled($tempImage, $water_id, 0, 0, 0, 0, $newwidth, $newheight, $waterW, $waterH, 3.5);
			$water_id=$tempImage;
			imagedestroy($tempImage);
			$destW=imagesx($water_id);
			$destH=imagesy($water_id);
		}//end if too wide || tall
	}//end if autoFitWater
	
	//apply transparency to $waterImage
	$ptr_white = imageColorAllocate($water_id,255,255,255);//make white transparent
	imagecolortransparent($water_id,$ptr_white);

	if($dextX<0) $destX+=$destH;//allow negative values; start from bottom
	if($dextY<0) $destY+=$destW;
//echo "\n\r<br>DEBUG: destX=$destX; destY=$destY";//testing only

	$destX=max(min($destW-$waterW, $destX),0);//account from waterSize; show water fully on destImage
	$destY=max(min($destH-$waterH, $destY),0);


//echo "\n\r\n\r<br>DEBUG: waterW=$waterW; waterH=$waterH";//testing only
//echo "\n\r\n\r<br>DEBUG: destX=$destX; destY=$destY";//testing only
//echo "\n\r\n\r<br>DEBUG: destH=$destH; destW=$destW";//testing only



	//merge together:
	imagecopymerge($dest_id, $water_id, $destX, $destY, 0, 0, $waterW, $waterH, $waterOpacity);

//http://us2.php.net/manual/en/function.imagecopymerge.php
	//cleanup:
	//imagedestroy($dest_id);
	@imagedestroy($water_id);

	//return output Raw image (resourceID):
	return $dest_id;

}//end function imageInsertWatermark


//********************************************************************************
function getMemoryForImage($filename){
   $imageInfo    = getimagesize($filename);
   $memoryNeeded = round(($imageInfo[0] * $imageInfo[1] * $imageInfo['bits'] * $imageInfo['channels'] / 8 + Pow(2, 16)) * 1.65);
   return($memoryNeeded);
}//end function setMemoryForImage

//********************************************************************************
function setMemoryForImage($filename){
	$imageInfo    = getimagesize($filename);
	$memoryNeeded = getMemoryForImage($filename);
	
	$memoryLimit = (int) ini_get('memory_limit')*1048576;
	$setMemLimit = ceil((memory_get_usage() + $memoryNeeded)/1048576);// + $memoryLimit
	if((memory_get_usage() + $memoryNeeded) > $memoryLimit){
		ini_set('memory_limit', $setMemLimit .'M');
	}//end if mem
	return((int) ini_get('memory_limit')>=$setMemLimit);
	//return(true);
}//end function setMemoryForImage



function getGIFColorMap($file){
   $fp = fopen($file, 'r');
   $buf = fread($fp, 1024);
   fclose($fp);
     
   // Calculate number of colors
   // buf[10] is the color info byte
   $color_byte = ord($buf[10]);
   $has_color_map = ($color_byte >> 7) & 1;
   $color_res = (($color_byte >> 4) & 7) + 1;
   $bits_per_pixel = ($color_byte & 7) + 1;
   $color_count = 1 << $bits_per_pixel;
     
   if (!$has_color_map) return null;
     
   // buf[13] is the beginning of the color map
   $color_map_index = 13;
   $map = array();
   for ($i=0; $i < $color_count; $i++) {
       $index = $color_map_index + $i*3;
       $r = ord($buf[$index]);
       $g = ord($buf[$index + 1]);
       $b = ord($buf[$index + 2]);
       $map[$i] = array($r, $g, $b);
   }
   return $map;
}


/****************************************************
//Width ImageString, the strings you draw are not automatically wrapped width the edge of the image. //You may use this function to automatically wrap them: */

function ImageStringWrap($image, $font, $x, $y, $text, $color, $maxwidth){
    $fontwidth = ImageFontWidth($font);
    $fontheight = ImageFontHeight($font);

    if($maxwidth != NULL) {
        $maxcharsperline = floor($maxwidth / $fontwidth);
        $text = wordwrap($text, $maxcharsperline, "\n", 1);
      }

    $lines = explode("\n", $text);
    while(list($numl, $line) = each($lines)) {
        ImageString($image, $font, $x, $y, $line, $color);
        $y+= $fontheight;
      }
}

/***************************************************/
?>