var ParameterDocumentation = require( './parameter' ).ParameterDocumentation,
    assert = require( 'assert' );

function MethodDocumentation( name ) {
    this.name = name || '';
    this.description = '';
    this.visibility = 'public';
    this.returns = undefined;
    this.specifiers = [];
    this.parameters = [];
    this.isConstructor = false;
}

MethodDocumentation.prototype = {
    constructor: MethodDocumentation,
    addSpecifier: function( specifier ) {
        if ( specifier == 'constructor' ) {
            this.isConstructor = true;
        }
        this.specifiers.push( specifier );
    },
    addParameter: function( parameter ) {
        assert.ok( parameter instanceof ParameterDocumentation, 'tried to add parameter that is not ParameterDocumentation' );
        this.parameters.push( parameter );
    },
    setDescription: function( description ) {
        this.description = description;
    },
    setVisibility: function( visibility ) {
        this.visibility = visibility;
    },
    setReturns: function( type ) {
        this.returns = type;
    }
};

MethodDocumentation.createFromObjectNode = function( node ) {
    var i, tag, param, 
        comment = node.children[ 0 ],
        doc = new MethodDocumentation( node.name );

    for ( i = 0; i < comment.tags.length; ++i ) {
        tag = comment.tags[ i ];
        if ( tag.name == 'class' ) {
            console.error( 'please write @class before @constructor in ', node.name );
            process.exit( 1 );
            break;
        }
        switch ( tag.name ) {
            case 'constructor':
                doc.addSpecifier( 'constructor' );
                doc.setReturns( '' );
                break;
            case 'description':
                tag.value = tag.value.replace( /{@link (([a-zA-Z0-9]+)#([a-zA-Z0-9]+))}/g, "<a href=\"$1\">$2.$3</a>" ).replace( /\{@link ([a-zA-Z0-9]+)\}/g, '<a href="#$1">$1</a>' );
                var description = tag.value.trim();
                doc.setDescription( description );
                break;
            case 'param':
                var name = '', type = 'Object';                
                if ( tag.params[ 0 ].indexOf( '{' ) != -1 ) {
                    name = tag.params[ 1 ];
                    type = tag.params[ 0 ].replace( /\{|\}/g, '' );
                }
                else {
                    name = tag.params[ 0 ];
                }
                param = new ParameterDocumentation( name, type );
                doc.addParameter( param );
                break;
            case 'returns':
                doc.setReturns( tag.params[ 0 ] );
                break;
            case 'public':
                doc.setVisibility( 'public' );
                break;
            case 'private':
                doc.setVisibility( 'private' );
                break;
            default:
                // console.error( 'unknown method tag named ' + tag.name + ' for methods. value: ' + tag.value + ' ' + node.name );
        }
    }
    return doc;
}

exports.MethodDocumentation = MethodDocumentation;
