var parrot = require( 'parrot' ),
    fs = require( 'fs' ),
    assert = require( 'assert' ),
    path = process.argv[ 2 ];

var sandboxMethods = {
    isBuiltin: function( name ) {
        return name in global;
    }
};

function generateClassHTML( templatePath, classDoc, doc, callback ) {
    fs.readFile( templatePath, function( err, contents ) {
        if ( err ) {
            throw( err );
        }

        var sandbox = {
            doc: doc,
            classDoc: classDoc
        };

        for ( var i in sandboxMethods ) {
            sandbox[ i ] = sandboxMethods[ i ];
        }

        var out = parrot.render( contents, { sandbox: sandbox } );
        callback( out );
    } );
}

function readContents( path, callback ) {
    fs.readFile( path, 'utf8', function( err, contents ) {
        if ( err ) {
            throw err;
        }
        callback( contents );
    } );
}

function getDocComments( contents ) {
    var i, line, tline, 
        lines = contents.split( '\n' ),
        inDocComment = false,
        comment = [],
        comments = [];

    for ( i = 0; i < lines.length; ++i ) {
        line = lines[ i ];
        tline = line.trim();
        if ( !tline.length ) {
            continue;
        }
        if ( tline == '/**' ) {
            inDocComment = true;
            comment.push( line );
        }
        else if ( tline == '*/' && inDocComment ) {
            inDocComment = false;
            comment.push( line );
            comments.push( {
                lines: comment,
                code: lines[ i + 1 ].trim()
            } );
            comment = [];
            i += 1;
        }
        else if ( inDocComment ) {
            if ( tline[ 0 ] != '*' ) {
                console.error( 'Every line of a doc comment should begin with "*"' );    
                console.error( line );
                process.exit( 1 );
            }
            comment.push( line );
        }
    }

    return comments;
}

function parseComment( comment ) {
    var line, i, tag = {}, description = '', info = [];
    for ( i = 0; i < comment.length; ++i ) {
        line = comment[ i ].trim();
        if ( line.slice( 0, 3 ) == '/**' ) {
            line = line.slice( 3 );
        }
        else if ( line.slice( 0, 2 ) == '*/' ) {
            line = line.slice( 2 );
        }
        else if ( line[ 0 ] == '*' ) {
            line = line.slice( 1 );
        }
        if ( !line.length ) {
            if ( description.length ) {
                description += '\n';
            }
            continue;
        }
        tline = line.trim();
        if ( tline[ 0 ] == '@' ) {
            if ( description.length ) {
                info.push( {
                    name: 'description',
                    value: description
                } );
                description = '';
            }
            var tagEnd = tline.indexOf( ' ' ),
                tagName = '',
                tagParams = [];
            if ( tagEnd != -1 ) {
                tagName = tline.slice( 1, tagEnd );
                tagParams = tline.slice( tagEnd ).trim().split( ' ' );
            }
            else {
                tagName = tline.slice( 1 );
            }
            info.push( {
                name: tagName,
                params: tagParams
            } );
        }
        else {
            description += line + '\n';
        }
    }

    if ( description.length ) {
        info.push( {
            name: 'description',
            value: description
        } );
    }

    return info;
}

function Documentation() {
    this.title = 'Final Engine Documentation';
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


function PropertyDocumentation( name ) {
    this.name = name || '';
    this.visibility = 'public';
    this.description = '';
    this.type = '';
    this[ 'default' ] = '';
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
    }
};

function ParameterDocumentation( name, type ) {
    this.name = name || '';
    this.type = type || '';
}

function getCodeInfo( line ) {
    var functionMatch = /((\s*[a-zA-Z][a-zA-Z0-9]*\s*)(\=|:)\s*)?\s*function(\s+[a-zA-Z][a-zA-Z0-9]*)?\s*\([^)]*\)/.exec( line );
    if ( functionMatch && ( functionMatch[ 4 ] || functionMatch[ 2 ] ) ) {
        methodName = functionMatch[ 4 ] ? functionMatch[ 4 ] : functionMatch[ 2 ];
        return {
            type: 'function',
            name: methodName.trim()
        };
    }

    var propertyMatch = /(this\.)?([a-zA-Z0-9]+)\s*(=|:)\s*/.exec( line );
    if ( propertyMatch ) {
        return {
            type: 'property',
            name: propertyMatch[ 2 ]
        };
    }

    console.error( 'could not recognize type of documented symbol' );
    console.error( line );
    process.exit( 1 );
}

function getSymbolDoc( comment, code, classDoc ) {
    if ( !comment.length ) {
        return;
    }
    if ( code.type == 'function' ) {
        return getFunctionDoc( comment, code, classDoc );
    }
    else if ( code.type == 'property' ) {
        return getPropertyDoc( comment, code, classDoc );
    }
}

function getFunctionDoc( comment, code, classDoc ) {
    var param, doc = null;
    while ( typeof ( tag = comment.shift() ) != 'undefined' ) {
        if ( doc !== null && ( tag.name == 'class' || tag.name == 'constructor' ) ) {
            // console.error( 'returning inside comment' );
            comment.unshift( tag );
            return doc;
        }
        if ( tag.name == 'class' ) {
            doc = new ClassDocumentation( code.name );
            if ( code.type != 'function' ) {
                console.error( '@class used on symbol that is not a function' );
            }
            continue;
        }
        else if ( doc === null ) {
            doc = new MethodDocumentation( code.name );
        }
        switch ( tag.name ) {
            case 'constructor':
                doc.addSpecifier( 'constructor' );
                doc.setReturns( '' );
                break;
            case 'description':
                tag.value = tag.value.replace( /{@link (([a-zA-Z0-9]+)#([a-zA-Z0-9]+))}/g, "<a href=\"$1\">$2.$3</a>" );
                if ( doc instanceof ClassDocumentation ) {
                    var lines = tag.value.split( '\n' );
                    var shortDescription = lines[ 0 ]; 
                    var detailedDescription = lines.slice( 1 ).join( '\n' ).trim();
                    doc.setShortDescription( shortDescription );
                    doc.setDetailedDescription( detailedDescription );
                }
                else {
                    var description = tag.value.trim();
                    doc.setDescription( description );
                }
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
                console.error( 'unknown method tag named', tag.name );
        }
    }
    return doc;
}

function getPropertyDoc( comment, code ) {
    var doc = new PropertyDocumentation( code.name );
    while ( typeof( tag = comment.shift() ) != "undefined" ) {
        switch ( tag.name ) {
            case 'description':
                tag.value = tag.value.replace( /{@link (([a-zA-Z0-9]+)#([a-zA-Z0-9]+))}/g, "<a href=\"$1\">$2.$3</a>" );
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
            default:
                console.error( 'unknown property tag named', tag.name );
                break;
        }
    }
    return doc;
}

readContents( path, function( contents ) {
    var rawDoc = getDocComments( contents ),
        doc = new Documentation(),
        lastClass = null,
        i, lines, code, docInfo, codeInfo, symbolDoc,
        classDoc;


    for ( i = 0; i < rawDoc.length; ++i ) {
        lines = rawDoc[ i ].lines;
        code = rawDoc[ i ].code;

        docInfo = parseComment( lines );
        codeInfo = getCodeInfo( code );
        symbolDoc = null;

        var times = 0;
        while ( ( symbolDoc = getSymbolDoc( docInfo, codeInfo, lastClass ) ) ) {
            if ( symbolDoc instanceof ClassDocumentation ) {
                doc.addClass( symbolDoc );
                lastClass = symbolDoc;
                // console.error( 'got class', symbolDoc );
            }
            else if ( symbolDoc instanceof MethodDocumentation ) {
                // console.error( 'got method', symbolDoc );
                lastClass.addMethod( symbolDoc );
            }
            else if ( symbolDoc instanceof PropertyDocumentation ) {
                // console.error( 'got property', symbolDoc );
                lastClass.addProperty( symbolDoc );
            }
        }
    }

    for ( i = 0; i < doc.classes.length; ++i ) {
        classDoc = doc.classes[ i ];
        // console.error( classDoc );
        generateClassHTML( "templates/default/class.html", classDoc, doc, function( dochtml ) {
            console.log( dochtml );
        } );
    }
} );
