<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>About Image Editor 3.0</title>
</head>

<body>
<span  style="float:left">
<br />
<img src="./system/modules/rich_imgEditor-v3.0/images/60x45pscs3icon.jpg" alt="Image Editor" width="60" height="45" border="0" /> 
<br />
</span>
<span style=" margin: 0px 0px 0px 0px; width:200px;" align="center">
<span style="color:#990000; font-size:16px; background-color:#FFFFFF; font-weight:bolder; text-shadow: 3px -3px , yellow -3px 3px 2px, 3px 3px red;">Image Editor 3.0.0</span><br />
Designed and coded by: <br />
&nbsp;&nbsp;&nbsp;&nbsp;Richie Bartlett Jr. (aka <a href="http://www.LoreZyra.com/" target="_blank">LoreZyra</a>)<br />
&nbsp;&nbsp;&nbsp;&nbsp;<a href="http://www.ZyraTech.com/" target="_blank">ZyraTech.com</a> Technologies<br />
</span><br /><br />
<div style=" margin: 16px 16px 16px 16px;">
This software was built on the following technologies:<br /><br />
<ul>
	<li type="disc"><a href="http://qwikioffice.com/default.php" target="_blank">qWikiOffice Desktop Environment</a> &mdash; a collaborative project lead by Todd Murdock and Jack Slocum </li>
    <li type="disc"><a href="http://www.extjs.com/" target="_blank">Ext JS Library</a></li>
	<li type="disc"><a href="http://php.net/" target="_blank">PHP</a> &amp; <a href="http://www.mysql.com/" target="_blank">MySQL</a></li>
    <li type="disc">GD Image Libraries:<br />
<?PHP 
//var_dump(gd_info()); 
$array=gd_info ();
foreach ($array as $key=>$val) {
  if ($val===true) $val="Enabled";
  if ($val===false)  $val="Disabled";
  echo "$key: $val <br />\n";
}//end for array
?>
<br />
</li>
    <li type="disc">DHTML/JavaScript</li>
    <li type="disc">AJAX / JSON</li>
</ul>
</div>
<br />
<hr align="center" color="#CC0033" />
<br /><br />
    This software operates under a Dual Licensing scheme. <br />
    <br />
    Should you wish you use this in a commerical application, please obtain a commercial license from <a href="mailto: owner@ZyraTech.com" target="_blank">ZyraTech.com Technologies</a>.<br />
    Please note, commerical license prohibits the resale of this software as a commerical product. Only ZyraTech.com and it's subdisidaries are allowed to sale commerical licenses for ZyraTech products.<br /><br />
    However, you are free to use this code as open source for as long as it is <b>not</b> apart of a commercial application (without explicit permission). In which case,  <a href="http://www.gnu.org/licenses/gpl.html" target="_blank">G P L </a> applies. 
<br /><a href="http://www.gnu.org/licenses/gpl.html" target="_blank"><img src="./system/modules/rich_imgEditor-v3.0/images/gplv3-127x51.png" alt="GNU GENERAL PUBLIC LICENSE" width="127" height="51" border="0" /></a>
<br /><br /><br />Please honor the code.
<br />
<hr align="center" color="#CC0033" />
<br />
<?PHP
	$strTemp="<CENTER>User Details:</CENTER><br />\n";
	$strTemp.=" HTTP_ACCEPT = ".$_SERVER['HTTP_ACCEPT']."<br />\n";
	$strTemp.=" HTTP_ACCEPT_ENCODING = ".$_SERVER['HTTP_ACCEPT_ENCODING']."<br />\n";
	$strTemp.=" HTTP_ACCEPT_LANGUAGE = ".$_SERVER['HTTP_ACCEPT_LANGUAGE']."<br />\n";
	$strTemp.=" HTTP_USER_AGENT = ".$_SERVER['HTTP_USER_AGENT']."<br />\n";
	$strTemp.=" HTTP_REFERER = ".$_SERVER['HTTP_REFERER']."<br />\n";
//	$strTemp.=" REQUEST_URI = ".$_SERVER['REQUEST_URI']."<br />\n";

	$strTemp.="<br />\n<CENTER>Server Details:</CENTER><br />\n";
	$strTemp.="memoryLimit=".((int) ini_get('memory_limit')*1048576)."<br />\n";
	$strTemp.="memoryUsed=".memory_get_usage()."<br />\n";

echo $strTemp;
?><br />
</body>
</html>

