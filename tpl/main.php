<?php
/**
 * DokuWiki Default Template
 *
 * This is the template you need to change for the overall look
 * of DokuWiki.
 *
 * You should leave the doctype at the very top - It should
 * always be the very first line of a document.
 *
 * @link   http://wiki.splitbrain.org/wiki:tpl:templates
 * @author Andreas Gohr <andi@splitbrain.org>
 */

// must be run from within DokuWiki
if (!defined('DOKU_INC')) die();
$conf['template'] = $conf['template.bak'];

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
 "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?php echo $conf['lang']?>"
 lang="<?php echo $conf['lang']?>" dir="<?php echo $lang['direction']?>">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>
    <?php tpl_pagetitle()?>
    [<?php echo strip_tags($conf['title'])?>]
  </title>

  <?php tpl_metaheaders()?>
<script type="text/javascript" language="javascript" charset="utf-8">
//<![CDATA[

// remove ajax capability from this index page,
// quick and dirty fix for https://jira.liip.ch/browse/DW-30
index.treeattach = function(){};

addInitEvent(init_index);
function firstDescendant(element) 
{
    element = element.firstChild;
    while (element && element.nodeType != 1) element = element.nextSibling;
    return element;
}
function getEventElement(e)
{
    if (typeof e.srcElement != 'undefined') {
        var node = e.srcElement;
    } else {
        var node = e.target;
    }
    if (node.nodeType == 3) {
        node = node.parentNode();
    }
    return node;
}
function page_click(e)
{
    link = getEventElement(e);
    opener.SetUrl(link.getAttribute('href'));
    window.close();
    return false;
}
function init_index()
{
    div = $('dw_page_div');
    for (i=0; i<2; i++){
        to_be_removed = firstDescendant(div);
        div.removeChild(to_be_removed);
    }
    links = document.getElementsByTagName("a");
    var pattern = new RegExp("(^|\\s)idx_dir(\\s|$)");
    for(i=0; i<links.length; i++) {
        if ( pattern.test(links[i].className) ) {
            links[i].href += '&fckw=1';
        } else {
            addEvent(links[i], "click", page_click);
        }
    }
    $('dw_page_div').style.display = 'block';
}
//]]>
</script>

  <link rel="shortcut icon" href="<?php echo DOKU_TPL?>images/favicon.ico" />

  <?php /*old includehook*/ @include(dirname(__FILE__).'/meta.html')?>
</head>

<body>
<?php /*old includehook*/ @include(dirname(__FILE__).'/topheader.html')?>
<div class="dokuwiki">

  <?php flush()?>

  <?php /*old includehook*/ @include(dirname(__FILE__).'/pageheader.html')?>

  <div class="page" id="dw_page_div" style="display: none;">
    <!-- wikipage start -->
    <?php tpl_content()?>
    <!-- wikipage stop -->
  </div>

  <div class="clearer">&nbsp;</div>

  <?php flush()?>

</div>
<?php /*old includehook*/ @include(dirname(__FILE__).'/footer.html')?>

<div class="no"><?php /* provide DokuWiki housekeeping, required in all templates */ tpl_indexerWebBug()?></div>
</body>
</html>
