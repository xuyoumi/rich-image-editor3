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
/*
 * Get GIF image data
 * Returns an array of data, including GIF image type, and
 * the width and height of the image, plus transparent colour
 * details and much more.
 *
 * This function takes one argument, $file, a direct link to the image in
 * question. Perhaps in future versions it will get the file from an image
 * resource, but for now, it will have to do.
This function returns something like:

Array
(
    [version] => GIF89a
    [file_reg_version] => 89a
    [total_pallete_colours] => 251
    [width] => 100
    [height] => 100
    [transparent_color_id] => 16
    [transparent_color_values] => Array
        (
            [red] => 0
            [green] => 0
            [blue] => 0
            [alpha] => 127
        )

)
 */
function fetch_gif_data($file) {
 
    /*
     * First, we need to get the contents of the file in question, or we print
     * a warning using trigger_error().
     */
    $file_data = @file_get_contents($file) or trigger_error("File $file does not exist", E_USER_WARNING);
   
    /*
     * Now we need to fetch the gif image's version. We'll use strpos to fetch
     * gif89a, gif87a or if we don't get that then we will print an error.
     */
    $image_type = strpos($file_data, "g");
   
    /*
     * Now we check to see wether it is actually a GIF image, as it may not be
     * an image and if this is the case, problems could occur.
     */
    if($image_type === false) {
      trigger_error("File $file is not a gif89a or gif87a compatible image", E_USER_ERROR);
    }
   
    /*
     * Now, we need to fetch the image type by fetching the text at a certain
     * position, using PHP's function substr.
     */
    $image_info[version] = substr($file_data, 0, 6);
    $image_info[file_reg_version] = substr($file_data, 3, 3);
   
    /*
     * Let's get the total number of colours in this image using a special
     * piece of code, which fetches all the image's colours.
     */
    $im_gif = imagecreatefromgif($file);
    $image_info[total_pallete_colours] = imagecolorstotal($im_gif);
   
    /*
     * Now, the next thing we need to do is get the width and height of the
     * image in question by using imagesx(); and imagesy();
     */
    $image_info[width] = imagesx($im_gif);
    $image_info[height] = imagesy($im_gif);
    
    /*
     * Let's fetch the transparent color of the image, if there is one.
     */
    $id = imagecolortransparent($im_gif);
    $image_info[transparent_color_id] = $id;
    $image_info[transparent_color_values] = imagecolorsforindex($im_gif, $id);
   
    /*
     * Now, we return all the data.
     */
    return $image_info;
}//end function fetch_gif_data



function imagebmp ($im, $fn = false){
/*
It works the same way as regular imagejpeg/imagepng do and only 
supports GD2.0 true colour bitmaps (which is what's required by ExcelWriter).
*/
    if (!$im) return false;
           
    if ($fn === false) $fn = 'php://output';
    $f = fopen ($fn, "w");
    if (!$f) return false;
           
    //Image dimensions
    $biWidth = imagesx ($im);
    $biHeight = imagesy ($im);
    $biBPLine = $biWidth * 3;
    $biStride = ($biBPLine + 3) & ~3;
    $biSizeImage = $biStride * $biHeight;
    $bfOffBits = 54;
    $bfSize = $bfOffBits + $biSizeImage;
           
    //BITMAPFILEHEADER
    fwrite ($f, 'BM', 2);
    fwrite ($f, pack ('VvvV', $bfSize, 0, 0, $bfOffBits));
           
    //BITMAPINFO (BITMAPINFOHEADER)
    fwrite ($f, pack ('VVVvvVVVVVV', 40, $biWidth, $biHeight, 1, 24, 0, $biSizeImage, 0, 0, 0, 0));
           
    $numpad = $biStride - $biBPLine;
    for ($y = $biHeight - 1; $y >= 0; --$y){
        for ($x = 0; $x < $biWidth; ++$x){
            $col = imagecolorat ($im, $x, $y);
            fwrite ($f, pack ('V', $col), 3);
        }
        for ($i = 0; $i < $numpad; ++$i) fwrite ($f, pack ('C', 0));
    }
    fclose ($f);
    return true;
}//end function imagebmp

function getJPEGresolution($filename){
	if(exif_imagetype( $filename)!= IMAGETYPE_JPEG) return(false);
	ini_set('exif.encode_unicode', 'UTF-8');
	$outRez=array();
	// Read the file
	$exif = exif_read_data($filename, 'IFD0');
	
	ob_start(); // start a new output buffer
	$image   = file_get_contents($filename);
	
	// grab DPI information from the JPG header
	$outRez["xDPI"] = (int)(ord($image[15])>0? ord($image[15]) : $exif['XResolution'] );
	$outRez["yDPI"] = (int)(ord($image[17])>0? ord($image[17]) : $exif['YResolution'] );
	ob_end_clean(); // stop this output buffer

	//correct output if header doesn't contain dpi info:: use exif info instead
	$outRez["xDPI"] = ($outRez["xDPI"]>0? $outRez["xDPI"] : $exif['THUMBNAIL']['XResolution'] );
	$outRez["yDPI"] = ($outRez["yDPI"]>0? $outRez["yDPI"] : $exif['THUMBNAIL']['YResolution'] );
	
	//double check values; make sure it's just a number and not "72/1" ...
	if(!is_numeric($outRez["xDPI"])) $outRez["xDPI"] = (int)substr($outRez["xDPI"], 0, strpos($outRez["xDPI"],"/",1));
	if(!is_numeric($outRez["yDPI"])) $outRez["yDPI"] = (int)substr($outRez["yDPI"], 0, strpos($outRez["yDPI"],"/",1));

	//xDPI and yDPI should equal in value... but we output both anyway...
	return($outRez);
}//end function getJPEGresolution

function setJPEGresolution($filename){
/*
this code is experimental!  see http://jp.php.net/imagejpeg (xavi at lapalomera dot com)

  imagejpeg($image, $file, 75);

  // Change DPI
  $dpi_x   = 150;
  $dpi_y   = 150;
 
  // Read the file
  $size    = filesize($filename);
  $image   = file_get_contents($filename);

  // Update DPI information in the JPG header
  $image[13] = chr(1);
  $image[14] = chr(floor($dpi_x/255));
  $image[15] = chr(      $dpi_x%255);
  $image[16] = chr(floor($dpi_y/255));
  $image[17] = chr(      $dpi_y%255);

  // Write the new JPG
  $f = fopen($filename, 'w');
  fwrite($f, $msg, $size);
  fclose($f);

*/
}//end function setGPEGresolution


?>