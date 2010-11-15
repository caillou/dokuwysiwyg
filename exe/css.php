<?php 
/**
 * Load CSS from DokuWiki StyleSheet creator and do some RegEx for the dokuwysiwyg editor
 *
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author     Pierre Spring <pierre.spring@liip.org>
 */

if(!defined('DOKU_INC')) define('DOKU_INC',realpath(dirname(__FILE__).'/../../../../').'/');

// load the css
ob_start();
require_once(DOKU_INC.'lib/exe/css.php');
$css = ob_get_contents();
ob_end_clean();

// do some RegEx Magic™
$css = str_replace(array('div.dokuwiki','div.page'), '', $css);

/* the lists in DW are output as follows:
 * <li>
 *   <div class=".li">list item text</div>
 * </li>
 *
 * the fck editor does not have that semantically insignificant <div class=".li"> ...
 */ 
$matches = array();
preg_match('/\.(li.*?\{.*?\})/s', $css, $matches);
$css .= $matches[1];

// if there is some thing like 
// ...} {...}
//     ^ due to our replacements befor
$css = preg_replace('/\}\s*(\{.*?\})/', '} body$1', $css);

// get rid of header margins, because we can not use levels in the editor
$css = preg_replace('/((?:(?:\bh\d)|(?:\bdiv\.level\d))\{[^}]*?)margin-left:.*?;([^}]*?\})/', '$1$2', $css);

print $css;