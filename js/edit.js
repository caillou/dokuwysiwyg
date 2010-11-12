// if (!console || !console.log) {
//     var console =
//     {
//         log: function(s){alert(s);}
//     }
// }

String.prototype['repeat'] = function(amount)
{
    result = '';
    for (var i=0; i<amount; i++) {
        result += this;
    }
    return result;
}

RegExp.escape = function(str) {
    return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};

/*
newline and space placeholder: random()+'space'
*/

var renderer =
{
    state: {
        li: {
            level: 0,
            token: new Array()
        }
    },
    render: function (node)
    {
        var string = this.get_node_content(node);
        // let us clean up.
        string = string.replace(/^ +(?![ *-])| *$/gm, '').replace(/\n\n\n+|\\\\\n\n\n?|\\\\\n*$/g, "\n\n").replace(/^\n*/,'');
        return string;
    },
    get_relative_attribute : function (node, attr)
    {
        // IE <8 prefixes everything with a http://damin.name/
        // This removes the domain name.
        return jQuery(node).attr(attr).replace(new RegExp('^('+window.location.protocol+'//'+window.location.host + ')?' + DOKU_REL.replace(/\/$/,'')), '');
    },
    get_node_content : function (node)
    {
        var node_list = node.childNodes;
        var node = null;
        var result = '';
        for (var i = 0; i<node_list.length; i++) {
            node = node_list[i];
            switch (node.nodeType) {
                case 1:
                    // this is an element node
                    var node_name = node.nodeName.toLowerCase();
                    if (typeof this[node_name] == 'function') {
                        result += this[node_name](node);
                    } else {
                        result += this.get_node_content(node);
                    }
                    break;
                case 3:
                    // this is a text node
                    result += node.data.replace(/^\s+/, ' ').replace(/\s+$/, ' ').replace(/\n/, ' ');
                    break;
            }
        }
        return result;
    },

    get_node_as_text : function (node)
    {
        return this.get_text(node, false);
    },
    
    get_text: function (node, preserve_whitespace) {
        var node_list = node.childNodes;
        var node = null;
        var result = '';
        var text = '';
        for (var i = 0; i<node_list.length; i++) {
            node = node_list[i];
            switch (node.nodeType) {
                case 1:
                    result += this.get_text(node, preserve_whitespace);
                    break;
                case 3:
                    // this is a text node
                    text = node.data;
                    if (!preserve_whitespace) {
                        text = node.data.replace(/^\s+/, ' ').replace(/\s+$/, ' ').replace(/\n/, ' ');
                    }
                    result += text;
                    break;
            }
        }
        return result;
    },

    head: function(node)
    {
        return '';
    },

    hr: function(node)
    {
        return "\n\n----";
    },

    a: function(node)
    {
        var url = this.get_relative_attribute(node, 'href');        

        // in case nice url's in mod rewrite is used
        url = this.get_raw_media_url(url);

        if (url.match(/^\/(doku\.php\?id=)(:?([^:]*:)*[^:]*)$/)) {
            // preprocess intenal page links
            // any href that looks like
            //     "/name:space:page" or "/doku.php?id=name:space:pgae"
            // is set to link to
            //     "name:space:page"
            url = RegExp.$2;

            if (!url.match(/:|\//)) {
                // prepend a ":" to URL's that link to a page in the root
                url = ':' + url;
            }
        } else if (url.match(/^mailto:(.*)(\?.*)?/)) {
            // dokuwiki doesn't accept mailto links with
            // any options.
            return "<" + RegExp.$1 + ">";
        } else if (url.match(new RegExp('^/lib/exe/fetch.php\?'))) {

            if (url.match(/media=([^&]*)/)) {
                // this is a resource from the dokuwiki file repository

                var media = RegExp.$1;
                var file  = media.replace(/.*:(.*)$/, '$1');

                media += "?linkonly";
                if (media.search(/\/\/|:/) == -1) {
                    // prepend a ":" to images in the root of the repository
                    media = ":" + media;

                }
                var description = this.get_node_as_text(node).replace(/\s+$/, '');

                if (description == file) {
                    return '{{'+media+'}}';
                }
                return '{{'+media+'|'+description+'}}';
            }
        } else if (url.match(new RegExp('^/lib/exe/detail.php\?'))) {
            // this link is autogenerated by dokuwiki
            // for images from the repository
            // so we can translate it's content and ignore the link
            return this.get_node_content(node);
        }

        // interwiki links inserted by fck
        // might start with an '/'
        url = url.replace(/^\/(\w*>.*)$/,'$1');

        var result = "";
        var text = this.get_node_content(node).replace(/\s*$/,'');

        if (url == text || url.match(new RegExp('^((\w)(\w|_)*:)+' + RegExp.escape(text) + '$'))) {
             result = '[[' + url + ']]';
        } else {

            //// we replace all the instances of
            //// //, --, '', **  in the title by a single one ...
            //
            // ** needs special escaping for the regexp (// is automatically escaped).
            var tags = [
                "//",
                "__",
                "''",
                "**"
            ];
            var em = {};
            var tag = '';
            for (var i=0; i<tags.length; i++) {
                tag = tags[i];
                tagExp = RegExp.escape(tag);
                var re = new RegExp('(^.*)'+tagExp+'(.*)'+tagExp+'(.*$)');
                while (text.match(re)) {
                    text = RegExp.$1 + RegExp.$2 + RegExp.$3;
                    em[tag] = tag;
                }
            }
            tags = [
                { open:'<del>', close:'</del>'},
                { open:'((', close:'))'}
            ];
            for (var i=0; i<tags.length; i++) {
                var openExp = RegExp.escape(tags[i].open);
                var closeExp = RegExp.escape(tags[i].close);
                var re = new RegExp('(^.*)'+openExp+'(.*)'+closeExp+'(.*$)');
                while (text.match(re)) {
                    text = RegExp.$1 + RegExp.$2 + RegExp.$3;
                    em[tags[i].open] = tags[i].close;
                }
            }

            var result = '[['+url+'|'+text+']]';
            for (tag in em) {
                result = tag + result + em[tag];
            }

            return result;
        }

        return '[[' + url + ']]';
    },

    strong: function (node) {return this.b(node);},
    b:      function (node) {return this.replace(node, '**');},
    em:     function (node) {return this.i(node);},
    i:      function (node) {return this.replace(node, '//');},
    u:      function (node) {return this.replace(node, '__');},
    tt:     function (node) {return this.replace(node, "''");},

    replace: function (node, tag) {return tag+this.get_node_content(node)+tag},

    strike: function (node)
    {
        return '<del>'+this.get_node_content(node)+'</del>';
    },
    
    sup: function (node)
    {
        return this.preserve(node);
    },
    sub: function (node){
        return this.preserve(node);
    },
    
    preserve: function(node){
        var tag = node.nodeName.toLowerCase();
        return '<'+tag+'>'+this.get_node_content(node)+'</'+tag+'>';
    },

    p: function(node)
    {
        return '\n\n' + this.get_node_content(node) + '\n\n';
    },

    h1: function(node)
    {
        return this.header(node,1);
    },
    h2: function(node)
    {
        return this.header(node,2);
    },
    h3: function(node)
    {
        return this.header(node,3);
    },
    h4: function(node)
    {
        return this.header(node,4);
    },
    h5: function(node)
    {
        return this.header(node,5);
    },
    h6: function(node)
    {
        // dokuwiki does not support h6 headers
        return this.get_node_content(node);
    },

    td: function (node) {return this.table_cell(node, "|");},
    th: function (node) {return this.table_cell(node, "^");},

    tr: function (node)
    {
        return this.get_node_content(node)+"\n";
    },
    
    br: function(node)
    {
        return ' \\\\ ';
    },

    table: function (node) {return this.replace(node,"\n\n");},

    table_cell: function (node, token)
    {
        // get the content and replace all <p> by <br>
        var content = this.get_node_content(node).replace(/\n\n*/g,' \\\\ ').replace(/^\s*\\\\\s*|\s*\\\\\s*$/g, '').replace(/\\\\(\s*\\\\)+/g, '\\\\').replace(/^\s*|\s*$/g,'');
        var align = node.getAttribute('align');
        var colspan = node.getAttribute('colspan');
        var prefix = token;
        var postfix = ' ';

        if (content) {
            prefix += ' ';
        }

        if (align && (align=='center'||align=='right')) {
            prefix += ' ';
        }

        if (align && (align=='center'||align=='left')) {
            postfix += ' ';
        }

        if (!colspan) {
            colspan = 1;
        }

        var next = this.next_element_sibling(node);

        if (!(colspan == 1 && next)) {
            // we have to close the table
            if (next) {
                colspan--;
            }
            postfix += '|'.repeat(colspan);
        }
        return prefix + content + postfix;
    },

    next_element_sibling: function(node) {
      while (node = node.nextSibling)
        if (node.nodeType == 1) return node;
      return null;
    },

    header: function(node, level)
    {
        var token = '='.repeat(7-level);
        return "\n\n" + token + ' ' + this.get_node_as_text(node) + ' ' + token + "\n\n";
    },
    
    blockquote: function(node)
    {
        // todo: this should not include lists and tables, i guess
        return '>'+this.get_node_content(node).replace(/\\\\\s*/g, "\n> ");
    },

    pre: function (node)
    {
        var text = "\n" + this.get_text(node, true).replace(/^\s+|\s+$/g,'') + "\n";
        var class_name = jQuery(node).attr('class');

        if (class_name) {
            if (class_name.search(/\bcode\b/) != -1) {
                class_name = class_name.replace(/\bcode\b/,'').replace(/\s*/g,'');
                class_name = class_name ? ' '+class_name : '';
                return "\n\n<code"+class_name+'>'+text+'</code>';
            }
            if (class_name.search(/\bfile\b/) != 1) {
                var type = class_name.match('php|html');
                if (type && type.length) {
                    type = type.pop();
                    return "\n\n<"+type+'>'+text+'</'+type+'>';
                }
            }
        }

        // jsut in case:
        return '<code>'+text+'</code>';
    },

    ol: function(node)
    {
        return this.list(node, '-');
    },

    ul: function(node)
    {
        return this.list(node, '*');
    },

    list: function(node, token)
    {
        var result = '';

        if (!this.state.li.level) {
            result += "\n";
        }

        this.state.li.token.unshift(token);
        this.state.li.level++;

        result += this.get_node_content(node);

        this.state.li.level--;
        this.state.li.token.shift();

        if (!this.state.li.level) {
            result += "\n\n";
        }

        return result;
    },

    li: function(node)
    {
        var result = "\n" + '  '.repeat(this.state.li.level) + this.state.li.token[0] + this.get_node_content(node).replace(/\s*(\\\\)+\s*$/, '');
        return result;
    },

    script: function(){},
    
    span: function (node)
    {
        var class_name = jQuery(node).attr('class');
        var pre = '';
        var post = '';
        if (class_name) {
            if (class_name.search(/unformated/)!=-1) {
                return '<nowiki>'+this.get_node_as_text(node)+'</nowiki>';
            }
            if (class_name.search(/footnote/) != -1) {
                pre = '((';
                post = '))';
            }
        }
        var text = this.get_node_content(node).replace(/\s*$/,'');
        if (text) {
            return pre + text + post;
        }
    },
    
    img: function(node)
    {
        var url_string = this.get_relative_attribute(node, 'src');

        if(url_string.search(new RegExp('^/lib/images/smileys/')) != -1) {
            // this is a smiley
            var smiley = node.alt;
            if (!smiley) {
                smiley = ';-)';
            }
            return smiley;
        }
        
        // in case nice url's in mod rewrite is used
        url_string = this.get_raw_media_url(url_string);

        
        var match = url_string.match(new RegExp('^/lib/exe/fetch.php\\?(.*)$'))

        if (!match || match[1] == '') {
            // this is an external image
            return this.image_external(node);
        }
        
        var attributes = unescape(match[1]).replace(/\+/g, ' ').split('&');
        var attribute_touples = {};
        
        for (var i=0; i<attributes.length; i++) {
            var touple = attributes[i].split('=');
            if (touple.length = 2) {
                attribute_touples[touple[0]] = touple[1];
            }
        }
        
        if (!attribute_touples.media) {
            return this.image_external(node);
        }

        if (attribute_touples.media.search(/\/\/|:/) == -1) {
            // prepend a ":" to images in the root of the repository
            attribute_touples.media = ':'+attribute_touples.media;
        }
        
        // width and height attributes in the node overwrite
        // the information you could hav in the src attribute
        var w = node.getAttribute('width');
        var h = node.getAttribute('height');

        if (w != null) {
            attribute_touples.w = w;
        }
        if (h != null) {
            attribute_touples.h = h;
        }
        
        var class_name = node.className;

        var prefix = '';
        var postfix = '';
        
        if (class_name.search(/mediacenter|mediaright/) != -1) {
            prefix = ' ';
        }
        if (class_name.search(/mediacenter|medialeft/) != -1) {
            postfix = ' ';
        }

        var dimensions = '';

        if (attribute_touples.w || attribute_touples.h) {
            dimensions += '?';
            if (attribute_touples.w) {
                dimensions += 'w='+attribute_touples.w;
            }    
            if (attribute_touples.h) {
                if (dimensions.length > 1) {
                    dimensions += '&'
                }
                dimensions += 'h='+attribute_touples.h;
            }
        }
        
        var title_attribute = node.getAttribute('alt');
        var title = '';

        if (title_attribute && !(title_attribute==attribute_touples.media||':'+title_attribute==attribute_touples.media)) {
            title = '|'+title_attribute.replace(/^\s*|\s*$/g,'');
        }
        
        return '{{'+prefix+attribute_touples.media+dimensions+postfix+title+'}}';
    },
    
    image_external: function (node)
    {
        return '{{' + this.get_relative_attribute(node, 'src') + '}}';
    },
    
    get_raw_media_url: function (url_string)
    {
        var match = url_string.match(new RegExp('^/_media/([^\?]*)(.*)$'));
        if (match && match.length) {
            url_string = base+'lib/exe/fetch.php?media='+match[1];
            if (match[2].length > 2) {
                url_string += '&'+ match[2].slice(1);
            }
        }
        return url_string;
    },
    
    decode_uri: function (encoded)
    {
        // Replace + with ' '
        // Replace %xx with equivalent character
        // Put [ERROR] in output if %xx is invalid.
        var HEXCHARS = "0123456789ABCDEFabcdef";
        var plaintext = "";
        var i = 0;
        while (i < encoded.length) {
            var ch = encoded.charAt(i);
            if (ch == "+") {
                plaintext += " ";
                i++;
            } else if (ch == "%") {
                if (i < (encoded.length-2)
                    && HEXCHARS.indexOf(encoded.charAt(i+1)) != -1
                    && HEXCHARS.indexOf(encoded.charAt(i+2)) != -1 ) {
                    plaintext += unescape( encoded.substr(i,3) );
                    i += 3;
                } else {
                    alert( 'Bad escape combination near ...' + encoded.substr(i) );
                    plaintext += "%[ERROR]";
                    i++;
                }
            } else {
                plaintext += ch;
                i++;
            }
        } // while

        return plaintext;

    }

}

var fckw_ajax_object = new sack();
var fckw_page_element = null;
var fckw_draft_status_parent = null;

var fckw_get_page_element = function() {
    if (fckw_page_element == null) {
        fckw_page_element = fckw_get_draft_status_parent().parentNode.parentNode;//getElementsByClass('page',null,'div')[0];
    }
    return fckw_page_element;
}

var fckw_get_draft_status_parent = function () 
{
    if (!fckw_draft_status_parent) {
        fckw_draft_status_parent = document.getElementById('draft__status').parentNode;
    }
    return fckw_draft_status_parent;
}

var init_fckw = function() {
    var btn = document.createElement('input');
    btn.setAttribute('id', 'edbtn__wysiwyg');
    btn.className = 'button';
    btn.setAttribute('type', 'submit');
    btn.setAttribute('value', 'Wysiwyg');
    addEvent(btn, "click", get_xhtml);

    var edbtn__preview = document.getElementById('edbtn__preview');
    edbtn__preview.parentNode.appendChild(btn);
    
    if (fckw_default_wysiwyg) {
        get_xhtml(null);
    }
}

var write_back = function(name, save_draft)
{
    var oEditor = FCKeditorAPI.GetInstance(name);
    var wiki_text = renderer.render(oEditor.EditorDocument);
    
    if (separate_page_title) {
        // prepend the title
        var title = jQuery('#fckw_title').val();
        if (title) {
            wiki_text = '====== ' + title + ' ======' + "\n\n" + wiki_text;
        }
    }
    if (fckw_dicussion_plugin_active) {
        wiki_text += "\n\n" + '~~DISCUSSION' + (jQuery('#fckw_discussion_cb').attr('checked')?'':':off') + '~~';
    }
    
    if (jQuery('#fckw_nocache_cb').attr('checked')) {
        wiki_text += "\n\n" + '~~NOCACHE~~';
    }
    if (jQuery('#fckw_notoc_cb').attr('checked')) {
        wiki_text += "\n\n" + '~~NOTOC~~';
    }
    
    $('wiki__text').value = wiki_text;
    document.getElementById('edit__summary').value = document.getElementById('edit__xsummary').value;

    if (save_draft) {
        // c.f. /lib/scripts/edit.js
        // we force the native drafts system ;)
        locktimer.lasttime.setTime(locktimer.lasttime.getTime() - 30*1000);
        locktimer.refresh();
        textChanged = true;
        oEditor.ResetIsDirty();
    }
}

var edit_wikisyntax = function()
{
    write_back('wiki__xtext', true);

    xpage.style.display='none';
    fckw_get_page_element().style.display='';

    // move the draft__status box to its original place
    var draft_status_box = document.getElementById('draft__status');
    draft_status_box.parentNode.removeChild(draft_status_box);
    fckw_get_draft_status_parent().insertBefore(draft_status_box, fckw_get_draft_status_parent().firstChild);
}

var get_xhtml = function (e) {
    fckw_ajax_object.setVar('call', 'fckw_get_xhtml');
    fckw_ajax_object.setVar('ID', ID);
    // when moving to the updated version of SACK (v. 1.6.1 or newer),
    // you will need to remove the encodeURIComponent().
    fckw_ajax_object.setVar('text', encodeURIComponent($('wiki__text').value));
    fckw_ajax_object.requestFile = DOKU_BASE + 'lib/exe/ajax.php';
    fckw_ajax_object.method = 'POST';
    fckw_ajax_object.onCompletion = fckw_on_completion;
    fckw_ajax_object.runAJAX();

    if (e) {
        if (!!(window.attachEvent && !window.opera)){
            // this is IE
            e.returnValue = false;
            e.cancelBubble = true;
        } else {
            e.preventDefault();
            e.stopPropagation();
        }
        e.stopped = true;
    }
    
    // move the draft__status box into a visible place
    var draft_status_box = document.getElementById('draft__status');
    fckw_get_draft_status_parent().removeChild(draft_status_box);
    fckw_get_page_element().parentNode.insertBefore(draft_status_box, fckw_get_page_element());
}

var xpage = null;

var set_title = function () {
    var title = jQuery('<div>'+jQuery('#wiki__xtext').val()+'</div>').find('h1').eq(0).text();
    
    if (title) {
        // set the title to the input field
        jQuery('#fckw_title').val(title);

        // remove the title from the text
        var without_first_title = jQuery('<div>'+jQuery('#wiki__xtext').val()+'</div>').find('h1').eq(0).remove().end().end().html();
        jQuery('#wiki__xtext').val(without_first_title);
    }
}

var set_discussion = function () {
    var match = jQuery('#wiki__xtext').val().match(/~~DISCUSSION([^~]*)~~/);
    
    if (match == null || match[1] != '') {
        jQuery('#fckw_discussion_cb').attr('checked', false);
    } else {
        jQuery('#fckw_discussion_cb').attr('checked', true);
    }
    
    // remove the plugin from the wiki text
    jQuery('#wiki__xtext').val(jQuery('#wiki__xtext').val().replace(/~~DISCUSSION[^~]*~~/, ''));
}

var set_no = function (macro) {
    var macro_regex = new RegExp('~~NO'+macro.toUpperCase()+'~~');
    var original_wiki__xtext = jQuery('#wiki__xtext').val();
    var wiki__xtext = original_wiki__xtext.replace(macro_regex, '');
    if (wiki__xtext.length != original_wiki__xtext.length) {
        jQuery('#wiki__xtext').val(wiki__xtext);
        jQuery('#fckw_no'+macro+'_cb').attr('checked', true);
    } else {
        jQuery('#fckw_no'+macro+'_cb').attr('checked', false);
    }
}

var fckw_on_completion = function () {
    if (fckw_ajax_object.responseStatus[0] != 200) {
        return;
    }

    fckw_get_page_element().style.display='none';
    
    if (xpage != null) {
        // the wysiwyg editor has already been rendered.
        // we update the content and leave.
        area = document.getElementById('wiki__xtext');
        area.value = fckw_ajax_object.response;
        document.getElementById('edit__xsummary').value = document.getElementById('edit__summary').value;
        
        jQuery('#wiki__xtext').val(fckw_ajax_object.response);
        if (separate_page_title) {
            set_title();
        }
        
        if (fckw_dicussion_plugin_active) {
            set_discussion();
        }
        set_no('toc');
        set_no('cache');
        
        FCKeditorAPI.GetInstance('wiki__xtext').SetData(jQuery('#wiki__xtext').val(), true);
        xpage.style.display='';
        return;
    }
    
    xpage = document.createElement('div');
    xpage.className = 'xpage';
    xpage.setAttribute('id', 'xpage');
    fckw_get_page_element().parentNode.insertBefore(xpage, fckw_get_page_element().nextSibling);


    jQuery('<textarea/>')
        .attr('id', 'wiki__xtext')
        .val(fckw_ajax_object.response)
        .appendTo(xpage);

    if (separate_page_title) {
        jQuery('<input/>')
            .attr('type', 'text')
            .attr('name', 'fckw_title')
            .attr('id', 'fckw_title')
            .addClass('fckw_page_title_field')
            .prependTo(xpage);
        jQuery('<label/>')
            .addClass('fckw_page_title_field')
            .addClass('nowrap')
            .attr('for', 'fckw_title')
            .html('Title:')
            .prependTo(xpage);

        set_title();
    }
    
    var check_box_container = jQuery('<div/>')
        .addClass('summary')
        .appendTo(xpage)[0];
    
    var check_boxes = ['notoc', 'nocache'];
    
    if (fckw_dicussion_plugin_active) {
        check_boxes.push('discussion');
    }
    
    
    for (var i in check_boxes) {
        jQuery(check_box_container)
            .append((i==0)?'':' | ')
            .append(
                jQuery('<input type="checkbox"/>')
                    .attr('id', 'fckw_'+check_boxes[i]+'_cb')
            )
            .append('&nbsp;')
            .append(
                jQuery('<label/>')
                    .html(fckw_lang['label_'+check_boxes[i]])
            );
    }
    
    set_no('toc');
    set_no('cache');
    
    if (fckw_dicussion_plugin_active) {
        set_discussion();        
    }


    var editb = document.createElement('div');
    editb.setAttribute('id', 'wiki__xeditbar');
    xpage.appendChild(editb);
    var buttons = document.createElement('div');
    buttons.className = 'editButtons';
    buttons.setAttribute('style','float: left');
    buttons.style.padding='0pt 1em 0.7em 0pt';
    editb.appendChild(buttons);

    var cmds = ['save', 'cancel', 'wikisyntax'];
    for(var i in cmds) {
        var btn = document.createElement('input');
        btn.setAttribute('id', 'edbtn__x'+cmds[i]);
        btn.className =  'button';
        btn.setAttribute('type', 'submit');
        btn.setAttribute('value', fckw_lang['btn_'+cmds[i]]);
        switch(cmds[i]) {
            case 'wikisyntax':
                addEvent(btn, "click", edit_wikisyntax);
                break;
            case 'save':
                addEvent(btn, 'click', fckw_save);
                break;
            case 'cancel':
                addEvent(btn, 'click', fckw_cancel);
                break;
        }
        buttons.appendChild(btn);
    }
    var summary = document.createElement('div');
    summary.className = 'summary';
    summary.style.float = 'left';
    editb.appendChild(summary);

    var label = document.createElement('label');
    label.className = 'nowrap';
    label.setAttribute('for', 'edit__xsummary');
    summary.appendChild(label);

    var span = document.createElement('span');
    span.appendChild(document.createTextNode(fckw_lang['summary']+' '));
    label.appendChild(span);

    var inp = document.createElement('input');
    inp.setAttribute('id', 'edit__xsummary');
    inp.className = 'edit';
    inp.setAttribute('type', 'text');
    inp.setAttribute('size', '50');
    inp.setAttribute('name', 'summary');
    label.appendChild(inp);
    inp.value = $('edit__summary').value;


    var fck = new FCKeditor("wiki__xtext", "100%", "600");
    fck.BasePath = DOKU_BASE + 'lib/plugins/fckw/js/fckeditor/';
    fck.Config["DokuWikiLinkProtocols"] = fckw_link_protocols;
    fck.Config['EditorAreaCSS'] = [fck.BasePath +'../../exe/css.php?s=all', fck.BasePath +'../../exe/css.php', fck.BasePath + 'editor/css/fck_editorarea.css'];
    fck.ToolbarSet = fckw_toolbar;
    fck.ReplaceTextarea();

}

var fckw_save =  function()
{
    write_back('wiki__xtext', false);
    var form = $('dw__editform');
    var input = document.createElement('input');
    input.setAttribute('name', 'do[save]');
    form.appendChild(input);
    jQuery('#edbtn__save').click();
}

var fckw_draft_timeout = 30*1000; // miliseconds used for drafts
var FCKeditor_OnComplete = function( editorInstance )
{
    // initChangeCheck("lalala");
    textChanged = true;
    summaryCheck();
    setTimeout('fckw_save_draft(\''+editorInstance.Name+'\');', fckw_draft_timeout);
}

var fckw_save_draft = function(name)
{
    var oEditor = FCKeditorAPI.GetInstance(name) ;
    if (oEditor.IsDirty()) {
        write_back('wiki__xtext', true);
    }

    setTimeout('fckw_save_draft(\''+name+'\');', fckw_draft_timeout);
}

var fckw_cancel = function()
{
    // TODO: check if you really need this ajax call from
    // the changeCheck function
    if (changeCheck("Unsaved changes will be lost. \nReally continue?")){
        var form = $('dw__editform');
        var input = document.createElement('input');
        input.setAttribute('name', 'do[draftdel]');
        form.appendChild(input);
        form.submit();
    }

}
$(init_fckw);