var SnippetsCommand=function(){
    //create our own command, we dont want to use the FCKDialogCommand because it uses the default fck layout and not our own
};

SnippetsCommand.prototype.Execute=function(){
}

SnippetsCommand.GetState=function() {
    return FCK_TRISTATE_OFF; //we dont want the button to be toggled
}

SnippetsCommand.Execute=function() {
    //open a popup window when the button is clicked
    window.open(FCKConfig.DokuWikiBasePath + 'lib/plugins/snippets/exe/snippetsmanager.php', 'Templates', 'width=750,height=500,left=20,top=20,scrollbars=yes,resizable=yes,toolbar=no');
}

FCKCommands.RegisterCommand('Snippets', SnippetsCommand ); //otherwise our command will not be found

var oSnippets = new FCKToolbarButton('Snippets', 'Templates');

oSnippets.IconPath = FCKPlugins.Items['Snippets'].Path + 'Snippets.gif' ;

FCKToolbarItems.RegisterItem( 'Snippets', oSnippets );
