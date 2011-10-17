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
    },
    addClasses: function( tree ) {
        var d = Documentation.createFromObjectTree( tree, this.title );
        var classes = [];
        for ( var i = 0; i < d.classes.length; ++i ) {
            this.addClass( d.classes[ i ] );
            classes.push( d.classes[ i ] );
        }
        return classes;
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
