var fs = require( 'fs' ),
    parrot = require( '../libs/parrot' );

var sandboxBase = {
    isBuiltin: function( name ) {
        return name in global;
    }
};

function render( templatePath, variables, callback ) {
    if ( typeof callback == "undefined" ) {
        throw "No callback passsed to render.";
    }
    fs.readFile( templatePath, function( err, contents ) {
        if ( err ) {
            callback( err );
        }

        var sandbox = {};
        for ( var i in variables ) {
            sandbox[ i ] = variables[ i ];
        }

        for ( var i in sandboxBase ) {
            sandbox[ i ] = sandboxBase[ i ];
        }

        var out = parrot.render( contents, { sandbox: sandbox, cache: 0 } );
        parrot.clearCache(); // this shouldn't be needed

        callback( null, out );
    } );
}

function renderToFile( templatePath, variables, path, callback ) {
    render( templatePath, variables, function( err, data ) {
        if ( err ) {
            if ( callback ) {
                callback( err );
            }
            else {
                throw err;
            }
        }

        fs.writeFile( path, data, "utf8", function( err ) {
            callback( err, data )
        } );
    } );
}

exports.render = render;
exports.renderToFile = renderToFile;
exports.sandboxBase = sandboxBase;
