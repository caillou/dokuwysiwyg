<?php
if(!defined('DOKU_INC')) define('DOKU_INC',realpath(dirname(__FILE__).'/../../../').'/');
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_PLUGIN.'action.php');

/**
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl2.html)
 * @author     Pierre Spring <pierre.spring@liip.ch>
 */

class action_plugin_dokuwysiwyg_mediamanager extends DokuWiki_Action_Plugin {

    var $mark = false;

    function getInfo()
    {
        return confToHash(dirname(__FILE__).'../info.txt');
    }

    function register(&$controller)
    {
        $controller->register_hook('MEDIAMANAGER_STARTED', 'BEFORE', $this, 'mark');
        $controller->register_hook('TPL_METAHEADER_OUTPUT', 'BEFORE', $this, 'inject_js');
    }
    
    function mark () {
        $this->mark = true;
    }
    
    function inject_js (&$event) {
        if (!$this->mark) {
            return;
        }
        
        if (!isset($_GET['dokuwysiwyg']) || !$_GET['dokuwysiwyg']) {
            return;
        }

        $event->data['script'][] = 
            array( 
                'type'=>'text/javascript', 
                'charset'=>'utf-8', 
                '_data'=>"
                (function () {
                    var old_list = media_manager.list;
                    
                    media_manager.list = function(event,link){
                        event.preventDefault();
                        old_list(event,link);
                    };
                    
                    media_manager.select = function(event,link){
                        var id = link.name.substr(2);
                        media_manager.id = id;
                        media_manager.inSet('media__linkbtn1');
                        media_manager.outSet('media__linkbtn2');
                        media_manager.outSet('media__linkbtn3');
                        media_manager.outSet('media__linkbtn4');

                        media_manager.inSet('media__alignbtn0');
                        media_manager.outSet('media__alignbtn1');
                        media_manager.outSet('media__alignbtn2');
                        media_manager.outSet('media__alignbtn3');

                        media_manager.outSet('media__sizebtn1');
                        media_manager.outSet('media__sizebtn2');
                        media_manager.outSet('media__sizebtn3');
                        media_manager.inSet('media__sizebtn4');

                        media_manager.insert();
                        return;
                    };
                }())"
            );
    }


} //end of action class