<?php
if(!defined('DOKU_INC')) define('DOKU_INC',realpath(dirname(__FILE__).'/../../../').'/');
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_PLUGIN.'action.php');

/**
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl2.html)
 * @author     Pierre Spring <pierre.spring@liip.ch>
 */

class action_plugin_dokuwysiwyg_edit extends DokuWiki_Action_Plugin {
    var $fck_location        = false;

    function init()
    {
        global $ID;

        $js_base_dir =  DOKU_BASE . 'lib/plugins/'.$this->getPluginName().'/js/';
        $this->fck_location = $js_base_dir . 'fckeditor';
    }

    function getInfo()
    {
        return confToHash(dirname(__FILE__).'../info.txt');
    }

    function register(&$controller)
    {
        $controller->register_hook('TPL_METAHEADER_OUTPUT', 'BEFORE', $this, 'dokuwysiwyg_edit_meta');
    }

    /**
     * dokuwysiwyg_edit_meta 
     *
     * load fck js
     * 
     * @param mixed $event 
     * @access public
     * @return void
     */
    function dokuwysiwyg_edit_meta(&$event)
    {
        global $ACT;

        // we only change the edit behaviour
        if (!in_array($ACT, array('recover', 'edit', 'preview'))){
            return;
        }

        global $lang;
        global $ID;
        
        $this->init();
        $event->data['script'][] = 
            array( 
                'type'    =>'text/javascript', 
                'charset' =>'utf-8', 
                '_data'   =>'',
                'src'     => $this->fck_location. '/fckeditor.js?rev='.self::getSCID()
            );

        $event->data['script'][] = 
            array( 
                'type'=>'text/javascript', 
                'charset'=>'utf-8', 
                '_data'=>'',
                'src'=> $this->fck_location. '/../jquery-1.3.2.min.js'
                );

        $event->data['script'][] = 
            array( 
                'type'=>'text/javascript', 
                'charset'=>'utf-8', 
                '_data'=>'',
                'src'=> $this->fck_location. '/../edit.js?rev='.self::getSCID()
                );

        $toolbar = 'Default';
        $snippets = @plugin_load('helper', 'snippets');
        if ($snippets && !plugin_isdisabled('snippets')) {
            $toolbar = 'WithSnippets';
        }

        $event->data['script'][] = 
            // the $lang['plugin']['js'] is not used on purpose
            array( 
                'type'=>'text/javascript', 
                'charset'=>'utf-8', 
                '_data'=>"

                            jQuery.noConflict();

                            var dokuwysiwyg_lang = 
                                {
                                    btn_save:'{$lang['btn_save']}',
                                    btn_cancel:'{$lang['btn_cancel']}',
                                    btn_wikisyntax: 'Wikisyntax',
                                    summary:'{$lang['summary']}',
                                    label_discussion:'".$this->getLang('discussion')."',
                                    label_nocache:'".$this->getLang('nocache')."',
                                    label_notoc:'".$this->getLang('notoc')."'
                                };
                            var ID = '$ID';
                            var dokuwysiwyg_link_protocols = '".$this->getConf('link_protocols')."';
                            var dokuwysiwyg_dicussion_plugin_active = ".((@plugin_load('action','discussion') && !plugin_isdisabled('discussion'))?'true':'false').";
                            var separate_page_title = ". ($this->getConf('separate_page_title')?'true':'false') .";
                            var dokuwysiwyg_default_wysiwyg = ". ($this->getConf('default_wysiwyg')?'true':'false') .";
                            var dokuwysiwyg_toolbar = '$toolbar';
                            var DOKU_REL = '".DOKU_REL."';
                    "
        );
        return;
    }
    
    /** Returns revision number */
    public static function getSCID() {
        $svnid = '$Rev: 12581 $';
        $scid = substr($svnid, 6);
        return intval(substr($scid, 0, strlen($scid) - 2));
    }

} //end of action class
