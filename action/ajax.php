<?php
if(!defined('DOKU_INC')) define('DOKU_INC',realpath(dirname(__FILE__).'/../../../').'/');
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_PLUGIN.'action.php');

/**
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl2.html)
 * @author     David Buchmann <david.buchmann@liip.ch>, Pierre Spring <pierre.spring@liip.ch>
 */

class action_plugin_dokuwysiwyg_ajax extends DokuWiki_Action_Plugin {

    function getInfo()
    {
        return confToHash(dirname(__FILE__).'../info.txt');
    }

    function register(&$controller) {
        $controller->register_hook('AJAX_CALL_UNKNOWN', 'BEFORE', $this, 'get_xhtml');
    }

    public function get_xhtml(&$event)
    {
        global $ID;

        if ($event->data != 'dokuwysiwyg_get_xhtml') {
            return;
        }
        if (!(isset($_POST['text']) && $_POST['text'])) {
            // create a new page
            die();
        }
        $text = urldecode($_POST['text']);

        if (!(isset($_POST['ID']) && $_POST['ID'])) {
            die('$ID not defined in '.__FILE__);
        }
        $ID = $_POST['ID'];

        $instructions = p_get_instructions($text);
        if(is_null($instructions)) {
            die();
        }

        $renderer =& plugin_load('renderer',$this->getPluginName());
        
        $renderer->smileys = getSmileys();
        $renderer->interwiki = getInterwiki();
        
        $renderer->nest($instructions);

        // some application firewalls get break our links when sending out html.
        // as we only use this action plugin in combination w/ ajax, 
        // the text content type is just ok.
        header('Content-Type: text/plain');
        // the ajax call ends here, we may die ;)
        die($renderer->doc);
    }


} //end of action class
