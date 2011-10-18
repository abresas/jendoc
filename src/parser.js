var fs = require( 'fs' ),
    ObjectTree = require( './objecttree' ).ObjectTree,
    ObjectNode = require( './objecttree' ).ObjectNode;

function parse( source ) {
    var objectTree = new ObjectTree();
    var currentNode = objectTree;
    var contextStack = [ objectTree ];

    function addToTree( node, parentNode ) {
        if ( !( currentNode.children.length == 1 && currentNode.isDocumented ) && ( node.type == 'property' || node.type == 'method' ) ) {
            var prevSibling = currentNode.children[ currentNode.children.length - 1 ];
            if ( !prevSibling ) {
                return;
            }
            if ( prevSibling.type == 'comment' && prevSibling.isDoc ) {
                node.isDocumented = true;
                node.appendChild( prevSibling );
            }
        }
        
        parentNode.appendChild( node );
    }

    for ( var i = 0; i < source.length; ++i ) {
        if ( currentNode.type == 'comment' && currentNode.commentType == 'singleline' ) {
            if ( source[ i ] == '\n' ) {
                currentNode.source += '\n';
                currentNode = contextStack.pop();
                continue;
            }
            currentNode.source += source[ i ];
            continue;
        }
        if ( currentNode.type == 'comment' && currentNode.commentType == 'multiline' ) {
            if ( source[ i ] == '*' && source[ i + 1 ] == '/' ) {
                currentNode.source += "*/";
                if ( currentNode.source.slice( 0, 3 ) == '/**' ) {
                    currentNode.tags = parseCommentTags( currentNode.source.split( '\n' ) );
                    currentNode.isDoc = true;
                }
                currentNode = contextStack.pop();
                ++i;
                continue;
            }
            currentNode.source += source[ i ];
            continue;
        }
        if ( currentNode.type == 'string' ) {
            if ( source[ i ] == "\\" ) {
                currentNode.source += "\\" + source[ i + 1 ];
                ++i; // ignore next
                continue;
            }
            else if ( source[ i ] == currentNode.source[ 0 ] ) {
                currentNode.source += currentNode.source[ 0 ];
                currentNode = contextStack.pop();
                continue;
            }
            currentNode.source += source[ i ];
            continue;
        }
        if ( source[ i ] == "'" || source[ i ] == '"' ) {
            var stringNode = new ObjectNode( 'string' );
            stringNode.source = source[ i ];
            stringNode.parentNode = currentNode;
            contextStack.push( currentNode );
            currentNode = stringNode;
            continue;
        }
        if ( source[ i ] == '/' && source[ i + 1 ] == '/' ) {
            var commentNode = new ObjectNode( 'comment' );
            commentNode.commentType = 'singleline';
            commentNode.source = '//';
            addToTree( commentNode, currentNode );
            contextStack.push( currentNode );
            currentNode = commentNode;
            ++i;
            continue;
        }
        if ( source[ i ] == '/' && source[ i + 1 ] == '*' ) {
            var commentNode = new ObjectNode( 'comment' );
            commentNode.commentType = 'multiline';
            commentNode.source = '/*';
            commentNode.tags = [];
            addToTree( commentNode, currentNode );
            contextStack.push( currentNode );
            currentNode = commentNode;
            ++i;
            continue;
        }
        if ( currentNode.type == 'method' || currentNode.type == 'property' ) {
            if ( source[ i ] == '{' ) {
                ++currentNode.blockLevel;
                currentNode.source += '{';
                continue;
            }
            if ( source[ i ] == '}' ) {
                if ( currentNode.blockLevel == 0 ) {
                    currentNode = contextStack.pop();
                    --i;
                    continue;
                }
                --currentNode.blockLevel;
                currentNode.source += '}';
                if ( !currentNode.blockLevel ) {
                    currentNode = contextStack.pop();
                }
                continue;
            }
        }

        if ( currentNode.type == 'property' && currentNode.blockLevel == 0 ) {
            if ( ( source[ i ] == ',' && ( currentNode.sign == ':' || currentNode.sign == "=" ) ) || ( source[ i ] == ';' && currentNode.sign == '=' ) ) {
                currentNode = contextStack.pop();
                continue;
            }
        }

        var rest = source.slice( i );

        var functionMatch = /^\s*(([a-zA-Z0-9._]*\s*)(\=|:)\s*)?\s*function\s*([a-zA-Z0-9]*)?\s*\([^)]*\)/.exec( rest );
        if ( functionMatch && ( functionMatch[ 4 ] || functionMatch[ 2 ] ) ) {
            var lparts;
            if ( functionMatch[ 2 ] ) {
                lparts = functionMatch[ 2 ].split( '.' );
            } 
            var methodName = functionMatch[ 4 ] ? functionMatch[ 4 ] : lparts[ lparts.length - 1 ];
            methodName = methodName.trim();

            var methodNode = new ObjectNode( 'method' );
            // console.log( 'found method ' + methodName + ' on node: ' + currentNode.name + ' (level:' + currentNode.level + ')' );
            methodNode.name = methodName;
            methodNode.source = source.slice( i, source.indexOf( '{', i ) );
            methodNode.blockLevel = 0;

            var parentNode = currentNode;
            var parentFound = true;

            if ( functionMatch[ 3 ] == ":" || !lparts ) {
                parentNode = currentNode;    
            }
            else if ( lparts.length > 1 ) {
                for ( var j = 0; j < lparts.length; ++j ) {
                    if ( j == lparts.length - 1 ) {
                        break;
                    }
                    var varname = lparts[ j ];
                    if ( j == 0 && varname == "this" ) {
                        parentNode = currentNode;
                        continue;
                    }
                    // else
                    var p = parentNode.getChild( varname );
                    if ( p ) {
                        parentNode = p;
                    }
                    else {
                        parentFound = false;
                        break;
                    }
                }
            }

            if ( parentFound ) {
                addToTree( methodNode, parentNode );
                contextStack.push( currentNode );
                currentNode = methodNode;
            }
            else {
                currentNode.source += source.slice( i, equalsIndex + 1 );
            }

            i = source.indexOf( '{', i ) - 1;
            continue;
        }

        var m = /^([a-zA-Z0-9._]+)\s*(=|:)/.exec( rest );
        if ( m ) {
            equalsIndex = source.indexOf( m[ 2 ], i );

            /*
            if ( m[ 1 ] ) { // don't handle var definitions
                currentNode.source += source.slice( i, equalsIndex + 1 );
                i = equalsIndex;
                continue;
            }
            */

            var lparts = m[ 1 ].split( '.' );

            var propertyNode = new ObjectNode( 'property' );
            propertyNode.name = lparts[ lparts.length - 1 ];
            // console.log( 'found property ' + propertyNode.name + ' on node: ' + currentNode.name + ' (level:' + currentNode.level + ')' );
            propertyNode.fullName = m[ 2 ];
            propertyNode.source = source.slice( i, equalsIndex + 1 );
            propertyNode.blockLevel = 0;
            propertyNode.sign = m[ 2 ];

            var parentNode = currentNode;
            var parentFound = true;

            if ( m[ 2 ] == ":" ) {
                parentNode = currentNode;    
            }
            else if ( lparts.length > 1 ) {
                for ( var j = 0; j < lparts.length; ++j ) {
                    if ( j == lparts.length - 1 ) {
                        break;
                    }
                    var varname = lparts[ j ];
                    if ( j == 0 && varname == "this" ) {
                        parentNode = currentNode;
                        continue;
                    }
                    // else
                    var p = parentNode.getChild( varname );
                    if ( p ) {
                        parentNode = p;
                    }
                    else {
                        parentFound = false;
                        break;
                    }
                }
            }

            if ( parentFound ) {
                addToTree( propertyNode, parentNode );
                contextStack.push( currentNode );
                currentNode = propertyNode;
            }
            else {
                currentNode.source += source.slice( i, equalsIndex + 1 );
            }
            
            i = equalsIndex;
            continue;
        }

        currentNode.source += source[ i ];
    }

    return objectTree;
}

function parseFile( path, callback ) {
    fs.readFile( path, 'utf8', function( err, data ) {
        callback( err, parse( data ) );
    } );
}

function parseCommentTags( comment ) {
    var line, i, tag = {}, description = '', tags = [];
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
                tags.push( {
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
            tags.push( {
                name: tagName,
                params: tagParams
            } );
        }
        else {
            description += line + '\n';
        }
    }

    if ( description.length ) {
        tags.push( {
            name: 'description',
            value: description
        } );
    }

    return tags;
}

exports.parse = parse;
exports.parseFile = parseFile;
exports.parseCommentTags = parseCommentTags;
