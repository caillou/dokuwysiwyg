var ButtonTdThCommand=function(){
    //create our own command, we dont want to use the FCKDialogCommand because it uses the default fck layout and not our own
};

ButtonTdThCommand.prototype.Execute=function(){
}

ButtonTdThCommand.GetState=function() {
    var state = FCK_TRISTATE_DISABLED;
    if (FCK.EditorDocument != null && FCKSelection.HasAncestorNode( 'TABLE' ) ) {
        var aCells = FCKTableHandler.GetSelectedCells();
        var j = 0;
        var iCells = aCells.length;
        for( i = 0 ; i < iCells; i++ ){
            if ( aCells[i].nodeName.toLowerCase() == 'td' ) j++;
        }
        if (iCells && (j/iCells) > 0.5) {
            state = FCK_TRISTATE_OFF;
        } else {
            state = FCK_TRISTATE_ON;
        }
    }
    // disable if not inside a table
    return state;
}

ButtonTdThCommand.Execute=function() {
    var aCells = FCKTableHandler.GetSelectedCells();
    var cellType = 'td';
    if (this.GetState()==FCK_TRISTATE_OFF) {
        cellType = 'th';
    }
    for( i = 0 ; i < aCells.length ; i++ ){
        if ( aCells[i].nodeName.toLowerCase() != cellType ) {
            aCells[i] = FCKDomTools.RenameNode( aCells[i], cellType ) ;
        }
    }
}

FCKCommands.RegisterCommand('ButtonTdTh', ButtonTdThCommand ); //otherwise our command will not be found

var oButtonTdTh = new FCKToolbarButton('ButtonTdTh', FCKLang.FontFormat, null, null, null, true);

oButtonTdTh.IconPath = FCKPlugins.Items['ButtonTdTh'].Path + 'ButtonTdTh.gif' ;

FCKToolbarItems.RegisterItem( 'ButtonTdTh', oButtonTdTh );