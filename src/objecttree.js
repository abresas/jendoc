function ObjectNode( type ) {
    this.type = type;
    this.source = "";
    this.children = [];
    this.parentNode = null;
    this.level = 0;
    this.isDocumented = false;
}

ObjectNode.prototype.toString = function() {
    return this.source;
};

ObjectNode.prototype.clone = function() {
    var n = new ObjectNode();
    for ( var i in this ) {
        if ( this.hasOwnProperty( i ) ) {
            n[ i ] = this[ i ];
        }
    }
    n.children = [];
    n.parentNode = null;
    return n;
};

ObjectNode.prototype.appendChild = function( node ) {
    if ( node.parentNode ) {
        node.parentNode.removeChild( node );
    }

    this.children.push( node );
    node.parentNode = this;
    node.level = this.level + 1;

    /*
    if ( !( this.children.length == 2 && this.isDocumented ) && ( node.type == 'property' || node.type == 'method' ) ) {
        var prevSibling = this.children[ this.children.length - 2 ];
        if ( !prevSibling ) {
            return;
        }
        if ( prevSibling.type == 'comment' && prevSibling.isDoc ) {
            node.isDocumented = true;
            node.appendChild( prevSibling );
        }
    }
    */
};

ObjectNode.prototype.removeChild = function( node ) {
    this.children.splice( this.children.indexOf( node ), 1 );
};

ObjectNode.prototype.getChild = function( name ) {
    for ( var i = 0; i < this.children.length; ++i ) {
        var child = this.children[ i ];
        if ( child.name == name ) {
            return child;
        }
    }
};

exports.ObjectNode = ObjectNode;

function ObjectTree( type ) {
    ObjectNode.call( this, type );
}

ObjectTree.prototype = new ObjectNode();

ObjectTree.prototype.getDocumentationTree = function() {
    var tree = new ObjectTree();

    for ( var i = 0; i < this.children.length; ++i ) {
        var node = this.children[ i ];
        // console.log( 'got node', node.name );
        if ( node.isDocumented ) {
            var docNode = node.clone();
            tree.appendChild( docNode );
            for ( var j = 0; j < node.children.length; ++j ) {
                // console.log( 'got member', node.children[ j ].name );
                var member = node.children[ j ];
                var docMember = member.clone();
                if ( member.type == 'comment' && member.isDoc ) {
                    docNode.appendChild( docMember );
                }
                if ( member.isDocumented ) {
                    docMember.appendChild( member.children[ 0 ] );
                    docNode.appendChild( docMember );
                }
                if ( member.name == 'prototype' ) {
                    docNode.appendChild( docMember );
                    for ( var k = 0; k < member.children.length; ++k ) {
                        // console.log( 'got prototype member', member.children[ k ].name );
                        var prototypeMember = member.children[ k ];
                        if ( prototypeMember.isDocumented ) {
                            var docPropMember = prototypeMember.clone();
                            docPropMember.appendChild( prototypeMember.children[ 0 ] );
                            docMember.appendChild( docPropMember );
                        }
                    }
                }
            }
        }
    }

    return tree;
}

exports.ObjectTree = ObjectTree;
