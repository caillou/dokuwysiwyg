<?php
if(!defined('DOKU_INC')) define('DOKU_INC',realpath(dirname(__FILE__).'/../../../').'/');
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_PLUGIN.'action.php');

/**
 * used by the link selection of the fck editor
 *
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl2.html)
 * @author     Pierre Spring <pierre.spring@liip.ch>
 */

class action_plugin_fckw_index extends DokuWiki_Action_Plugin {

    function getInfo()
    {
        return confToHash(dirname(__FILE__).'../info.txt');
    }

    function register(&$controller)
    {
        $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'fckw_index');
    }

    function fckw_index(&$event)
    {
        global $ACT;
        // we only change the edit behaviour
        if ($ACT != 'index' || !isset($_REQUEST['fckw']) ){
            return;
        }
        global $conf;
        
        $conf['userewrite'] = '0';

        $conf['template.bak'] = $conf['template'];
        $conf['template'] = "../plugins/fckw/tpl";
    }
}

