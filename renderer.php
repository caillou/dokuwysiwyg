<?php
/**
 * Renderer for XHTML output
 *
 * @author Pierre Spring <pierre.spring@liip.ch>
 */
// must be run within Dokuwiki
if(!defined('DOKU_INC')) die();

// we inherit from the XHTML renderer instead directly of the base renderer
require_once DOKU_INC.'inc/parser/xhtml.php';

/**
 * The Renderer
 */
class renderer_plugin_fckw extends Doku_Renderer_xhtml
{
    
    function document_start() {
        global $conf;
        //don't use nice URLs:
        $conf['userewrite']  = 0;

        //reset some internals
        $this->toc     = array();
        $this->headers = array();

        // some application firewalls get break our links when sending out html.
        // as we only use this action plugin in combination w/ ajax, 
        // the text content type is just ok.
        header('Content-Type: text/plain');
    }

    function plugin($name,$data,$state='',$match='')
    {
        $plugin =& plugin_load('syntax',$name);
        if ($match) { 
            $this->doc .= htmlentities($match);
        } else {
            parent::plugin($name, $data);
        }
    }
    
    function nocache() {
        $this->doc .= '~~NOCACHE~~';
    }

    function notoc() {
        $this->doc .= '~~NOTOC~~';
    }

    /**
     * return some info
     */
    function getInfo()
    {
        return confToHash(dirname(__FILE__).'/info.txt');
    }

    /**
     * the format we produce
     */
    function getFormat()
    {
        return 'fckw';
    }



    /*
     * The standard xhtml renderer adds anchors we do not need.
     */
    function header($text, $level, $pos) {
        // write the header
        $this->doc .= DOKU_LF.'<h'.$level.'>';
        $this->doc .= $this->_xmlEntities($text);
        $this->doc .= "</h$level>".DOKU_LF;
    }

    /*
     * The FCKEditor prefers <b> over <strong>
     */
    function strong_open()
    {
        $this->doc .= '<b>';
    }
    function strong_close()
    {
        $this->doc .= '</b>';
    }

    /*
     * The FCKEditor prefers <strike> over <del>
     */
    function deleted_open()
    {
        $this->doc .= '<strike>';
    }
    function deleted_close()
    {
        $this->doc .= '</strike>';
    }

    /*
     * Dokuwiki displays __underlines__ as follows
     *     <em class="u">underlines</em>
     * in the fck editor this conflicts with
     * the //italic// style that is displayed as
     *     <em>italic</em>
     * which makes the rathe obvious
     */
    function underline_open()
    {
        $this->doc .= '<u>';
    }
    function underline_close()
    {
        $this->doc .= '</u>';
    }

    function listcontent_open()
    {
    }
    function listcontent_close()
    {
        // this is for the fck editor
        $this->doc .= '<br/>';
    }
    function monospace_open()
    {
        $this->doc .= '<tt>';
    }
    function monospace_close()
    {
        $this->doc .= '</tt>';
    }
    function code($text, $language = NULL) {
        $this->preformatted($text, $language);
    }
    function preformatted($text, $language = NULL) {
        $language = $language ? " " . $language : "";
        if (! trim($text)) {
            $text = "&nbsp;";
        } else {
            $text = $this->_xmlEntities(htmlentities($text));
        }
        $this->doc .= '<pre class="code' . $language .'">' . $text . '</pre>'. DOKU_LF;
    }
    function unformatted($text) {
        $this->doc .= '<span class="unformated">' . $this->_xmlEntities(htmlentities($text)) . "</span>";
    }

    function php($text) {
        $this->file($text, "php");
    }

    function html($text) {
        $this->file($text, "html");
    }

    function file($text, $language = NULL) {
        $language = $language ? " " . $language : "";
        $this->doc .= '<pre class="file' .$language. '">' . $this->_xmlEntities($text). '</pre>'. DOKU_LF;
    }

    function internalmedia ($src, $title=NULL, $align=NULL, $width=NULL,
                            $height=NULL, $cache=NULL, $linking=NULL) {                                
        global $conf;
        global $ID;

        resolve_mediaid(getNS($ID),$src, $exists);
        
        $render = ($linking == 'justlink' || $linking == 'linkonly') ? false : true;

        $link = array();
        $link['class']  = 'media';
        $link['style']  = '';
        $link['pre']    = '';
        $link['suf']    = '';
        $link['more']   = '';
        $link['target'] = $conf['target']['media'];
        $noLink = false;

        $link['title']  = $this->_xmlEntities($src);
        list($ext,$mime) = mimetype($src);
        if(substr($mime,0,5) == 'image' && $render){
             // don't link images
             $noLink = true;
         }elseif($mime == 'application/x-shockwave-flash'){
             // don't link flash movies
             $noLink = true;
         }else{
             // add file icons
             $class = preg_replace('/[^_\-a-z0-9]+/i','_',$ext);
             $link['class'] .= ' mediafile mf_'.$class;
             $link['url'] = ml($src,array('id'=>$ID,'cache'=>$cache),true);
         }
         $link['name']   = $this->_media ($src, $title, $align, $width, $height, $cache, $render);

         //output formatted
         if ($linking == 'nolink' || $noLink) $this->doc .= $link['name'];
         else $this->doc .= $this->_formatLink($link);
    }


    /**
     * @todo don't add link for flash
     */
    function externalmedia ($src, $title=NULL, $align=NULL, $width=NULL,
                            $height=NULL, $cache=NULL, $linking=NULL) {
        global $conf;
        $render = ($linking == 'justlink' || $linking == 'linkonly') ? false : true;

        $link = array();
        $link['class']  = 'media';
        $link['style']  = '';
        $link['pre']    = '';
        $link['suf']    = '';
        $link['more']   = '';
        $link['target'] = $conf['target']['media'];

        $link['title']  = $this->_xmlEntities($src);
        $link['url']    = ml($src,array('cache'=>$cache));
        $link['name']   = $this->_media ($src, $title, $align, $width, $height, $cache, $render);
        $noLink = false;

        list($ext,$mime) = mimetype($src);
        if(substr($mime,0,5) == 'image' && $render){
             // don't link images
             $noLink = true;
        }elseif($mime == 'application/x-shockwave-flash'){
             // don't link flash movies
             $noLink = true;
        }else{
             // add file icons
             $link['class'] .= ' mediafile mf_'.$ext;
         }

        //output formatted
        if ($linking == 'nolink' || $noLink) $this->doc .= $link['name'];
        else $this->doc .= $this->_formatLink($link);
    }
    function tablecell_open($colspan = 1, $align = NULL){
        $this->doc .= '<td';
        if ( !is_null($align) ) {
            $this->doc .= ' align="'.$align.'"';
        }
        if ( $colspan > 1 ) {
            $this->doc .= ' colspan="'.$colspan.'"';
        }
        $this->doc .= '>';
    }
    function interwikilink($match, $name = NULL, $wikiName, $wikiUri) {
        global $conf;

        $link = array();
        $link['target'] = $conf['target']['interwiki'];
        $link['pre']    = '';
        $link['suf']    = '';
        $link['more']   = '';
        $link['name']   = $this->_getLinkTitle($name, $wikiUri, $isImage);

        //get interwiki URL
        $url = $match;

        if ( !$isImage ) {
            $class = preg_replace('/[^_\-a-z0-9]+/i','_',$wikiName);
            $link['class'] = "interwiki iw_$class";
        } else {
            $link['class'] = 'media';
        }

        //do we stay at the same server? Use local target
        if( strpos($url,DOKU_URL) === 0 ){
            $link['target'] = $conf['target']['wiki'];
        }

        $link['url'] = "/" . $url;
        $link['title'] = htmlspecialchars($link['url']);

        //output formatted
        $this->doc .= $this->_formatInterWikiLink($link);
    }
    function _formatInterWikiLink($link){
        $ret  = '';
        $ret .= $link['pre'];
        $ret .= '<a href="'.$link['url'].'"';
        if(!empty($link['class']))  $ret .= ' class="'.$link['class'].'"';
        if(!empty($link['target'])) $ret .= ' target="'.$link['target'].'"';
        if(!empty($link['title']))  $ret .= ' title="'.$link['title'].'"';
        if(!empty($link['style']))  $ret .= ' style="'.$link['style'].'"';
        if(!empty($link['more']))   $ret .= ' '.$link['more'];
        $ret .= '>';
        $ret .= $link['name'];
        $ret .= '</a>';
        $ret .= $link['suf'];
        return $ret;
    }
    function windowssharelink($url, $name = NULL) {
        global $conf;
        global $lang;
        //simple setup
        $link['target'] = $conf['target']['windows'];
        $link['pre']    = '';
        $link['suf']   = '';
        $link['style']  = '';
        $link['name'] = $this->_getLinkTitle($name, $url, $isImage);
        if ( !$isImage ) {
            $link['class'] = 'windows';
        } else {
            $link['class'] = 'media';
        }


        $link['title'] = $this->_xmlEntities($url);
        $link['url'] = $url;

        //output formatted
        $this->doc .= $this->_formatLink($link);
    }

    /**
     * Callback for footnote start syntax
     *
     * All following content will go to the footnote instead of
     * the document. To achieve this the previous rendered content
     * is moved to $store and $doc is cleared
     *
     * @author Andreas Gohr <andi@splitbrain.org>
     */
    function footnote_open() {
        $this->doc .= "<span class='footnote'>";
    }

    /**
     * Callback for footnote end syntax
     *
     * All rendered content is moved to the $footnotes array and the old
     * content is restored from $store again
     *
     * @author Andreas Gohr
     */
    function footnote_close() {
        $this->doc .= "</span>";
    }

    function multiplyentity($x, $y) {
        $this->doc .= "${x}x$y";
    }

    function singlequoteopening() {
        global $lang;
        $this->doc .= "'";
    }

    function singlequoteclosing() {
        global $lang;
        $this->doc .= "'";
    }

    function apostrophe() {
        global $lang;
        $this->doc .= "'";
    }

    function doublequoteopening() {
        global $lang;
        $this->doc .= '"';
    }

    function doublequoteclosing() {
        global $lang;
        $this->doc .= '"';
    }
}
