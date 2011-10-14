var MethodDocumentation = require( './method' ).MethodDocumentation,
    PropertyDocumentation = require( './property' ).PropertyDocumentation;

function ClassDocumentation( name ) {
    this.name = name;
    this.methods = [];
    this.properties = [];
    this.shortDescription = '';
    this.detailedDescription = '';
}

ClassDocumentation.prototype = {
    constructor: ClassDocumentation,
    setName: function( name ) {
        this.name = name;
    },
    setShortDescription: function( description ) {
        this.shortDescription = description;
    },
    setDetailedDescription: function( description ) {
        this.detailedDescription = description;
    },
    addMethod: function( method ) {
        assert.ok( method instanceof MethodDocumentation, 'tried to add method that is not MethodDocumentation' );
        this.methods.push( method );
    },
    addProperty: function( property ) {
        assert.ok( property instanceof PropertyDocumentation, 'tried to add property that is not PropertyDocumentation' );
        this.properties.push( property );
    }
};

ClassDocumentation.createFromObjectNode = function( node ) {
    var classDoc = new ClassDocumentation( node.name );
    var comment = node.children[ 0 ];
    if ( !comment || !comment.tags ) {
        return;
    }
    while ( typeof ( tag = comment.tags.shift() ) != 'undefined' ) {
        if ( tag.name == 'constructor' ) {
            comment.tags.unshift( tag );
            classDoc.methods.push( MethodDocumentation.createFromObjectNode( node ) );
            break;
        }
        switch ( tag.name ) {
            case 'class':
                break;
            case 'description':
                tag.value = tag.value.replace( /{@link (([a-zA-Z0-9]+)#([a-zA-Z0-9]+))}/g, "<a href=\"$1\">$2.$3</a>" );
                var lines = tag.value.split( '\n' );
                var shortDescription = lines[ 0 ]; 
                var detailedDescription = lines.slice( 1 ).join( '\n' ).trim();
                classDoc.setShortDescription( shortDescription );
                classDoc.setDetailedDescription( detailedDescription );
                break;
        }
    }

    for ( var j = 0; j < node.children.length; ++j ) {
        // console.log( 'got member', node.children[ j ].name );
        var member = node.children[ j ];
        if ( member.isDocumented && member.type == 'method' ) {
            //console.log( 'got method', member.name );
            classDoc.methods.push( MethodDocumentation.createFromObjectNode( member ) );    
        }
        if ( member.isDocumented && member.type == 'property' ) {
            // console.log( 'got method', member.name );
            classDoc.properties.push( PropertyDocumentation.createFromObjectNode( member ) );    
        }
        if ( member.name == 'prototype' ) {
            // console.log( 'got prototype' );
            for ( var k = 0; k < member.children.length; ++k ) {
                var prototypeMember = member.children[ k ];
                if ( prototypeMember.isDocumented && prototypeMember.type == 'method' ) {
                    classDoc.methods.push( MethodDocumentation.createFromObjectNode( prototypeMember ) );
                }
                if ( prototypeMember.isDocumented && prototypeMember.type == 'property' ) {
                    classDoc.properties.push( PropertyDocumentation.createFromObjectNode( prototypeMember ) );
                }
            }
        }
    }
    return classDoc;
}

exports.ClassDocumentation = ClassDocumentation;
