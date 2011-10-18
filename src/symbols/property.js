function PropertyDocumentation( name ) {
    this.name = name || '';
    this.visibility = 'public';
    this.description = '';
    this.type = '';
    this[ 'default' ] = '';
    this.specifiers = [];
}

PropertyDocumentation.prototype = {
    constructor: PropertyDocumentation,
    setVisibility: function( visibility ) {
        this.visibility = visibility;
    },
    setDescription: function( description ) {
        this.description = description;
    },
    setType: function( type ) {
        this.type = type;
    },
    setDefault: function( def ) {
        this[ 'default' ] = def;
    },
    addSpecifier: function( specifier ) {
        if ( this.specifiers.indexOf( specifier ) == -1 ) {
            this.specifiers.push( specifier );
        }
    }
};

PropertyDocumentation.createFromObjectNode = function( node ) {
    var doc = new PropertyDocumentation( node.name );
    var comment = node.children[ 0 ];
    if ( !comment.tags ) {
        return doc;
    }
    for ( var i = 0; i < comment.tags.length; ++i ) {
        var tag = comment.tags[ i ];
        switch ( tag.name ) {
            case 'description':
                tag.value = tag.value.replace( /{@link (([a-zA-Z0-9]+)#([a-zA-Z0-9]+))}/g, "<a href=\"$1\">$2.$3</a>" ).replace( /\{@link ([a-zA-Z0-9]+)\}/g, '<a href="#$1">$1</a>' );
                doc.setDescription( tag.value );
                break;
            case 'type':
                doc.setType( tag.params[ 0 ] );
                break;
            case 'public':
                doc.setVisibility( 'public' );
                break;
            case 'private':
                doc.setVisibility( 'private' );
            case 'static':
                doc.addSpecifier( 'static' );
            case 'const':
                doc.addSpecifier( 'const' );
            default:
                // console.warn( 'unknown property tag named ' + tag.name + ' for property' );
                break;
        }
    }
    return doc;
};

exports.PropertyDocumentation = PropertyDocumentation;
