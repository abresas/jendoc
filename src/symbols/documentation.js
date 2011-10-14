var ClassDocumentation = require( './class' ).ClassDocumentation;

function Documentation( title ) {
    this.title = title || '';
    this.classes = [];
    this.classNames = [];
}

Documentation.prototype = {
    addClass: function( classDoc ) {
        this.classes.push( classDoc );
        this.classNames.push( classDoc.name );
    },
    hasClass: function( className ) {
        return this.classNames.indexOf( className ) != -1;
    }
};

Documentation.createFromObjectTree = function( tree, title ) {
    var doc = new Documentation( title );

    for ( var i = 0; i < tree.children.length; ++i ) {
        var node = tree.children[ i ];
        // console.log( 'got node', node.name );
        if ( node.isDocumented ) {
            var isClass = false;
            if ( node.children[ 0 ].tags ) {
                for ( var t = 0; t < node.children[ 0 ].tags.length; ++t ) {
                    var tag = node.children[ 0 ].tags[ t ];
                    if ( tag.name == 'class' ) {
                        isClass = true;
                    }
                }
            }
            
            if ( isClass ) {
                var classDoc = ClassDocumentation.createFromObjectNode( node ); 
                doc.addClass( classDoc );
            }
        }
    }

    return doc;
};

exports.Documentation = Documentation;
