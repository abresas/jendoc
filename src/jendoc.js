var parser = require( './parser' ),
    objecttree = require( './objecttree' ),
    template = require( './template' ),
    Documentation = require( './symbols/documentation' ).Documentation,
    fstraverse = require( './fstraverse' ),
    fs = require( 'fs' );

function generate( path, templateDir, outputDir, fileCallback, endCallback ) {
    fileCallback = fileCallback || function( err ) { if ( err ) { throw err; } };
    endCallback = endCallback || function( err ) { if ( err ) { throw err; } };

    fstraverse.getFileList( path, function( err, files ) {
        // console.log( files );
        if ( err ) {
            return endCallback( err );
        }

        var processed = [];
        for ( var i = 0; i < files.length; ++i ) {
            var file = files[ i ];
            generateFromFile( file, templateDir, outputDir, 
                function( err, doc ) {
                    if ( err ) {
                        return fileCallback( err );
                    }
                    doc.totalFiles = files.length;
                    fileCallback( err, doc );
                    processed.push( file );
                    // console.log( 'gen ' + processed.length + ' ' + files.length + ' ' + file );
                    if ( processed.length == files.length ) {
                        endCallback( null );
                    }
                }
            );
        }
    } );
}

function generateFromFile( path, templateDir, outputDir, callback ) {
    fs.readFile( path, 'utf8', function( err, source ) {
        generateFromSource( source, templateDir, outputDir, callback );
    } );
}

function generateFromSource( source, templateDir, outputDir, callback ) {
    if ( !templateDir ) {
        throw 'please specify documentation template';
    }

    var objectTree = parser.parse( source )
    var doc = Documentation.createFromObjectTree( objectTree );

    doc.classesWaiting = doc.classes.length;

    // console.log( 'classes length: ' + doc.classes.length );

    for ( var i = 0; i < doc.classes.length; ++i ) {
        var classDoc = doc.classes[ i ];
        template.renderToFile( templateDir + "/class.html", { classDoc: classDoc, doc: doc }, outputDir + classDoc.name + ".html",
            function( err, html ) {
                if ( err ) {
                    return callback( err, doc );
                }
                --doc.classesWaiting;
                if ( !doc.classesWaiting ) {
                    callback( null, doc );
                }
            }
        );
        // template.render( template + "/class.html", { classDoc: classDoc, doc: doc }, callback );
    }

    if ( !doc.classesWaiting ) {
        callback( null, doc );
    }
}

exports.generate = generate;
exports.generateFromSource = generateFromSource;
exports.parser = parser;
exports.objecttree = objecttree;
exports.template = template;
