var parser = require( './parser' ),
    objecttree = require( './objecttree' ),
    template = require( './template' ),
    Documentation = require( './symbols/documentation' ).Documentation,
    fstraverse = require( './fstraverse' ),
    fs = require( 'fs' );

function generate( path, templateDir, outputDir, fileCallback, endCallback ) {
    fileCallback = fileCallback || function( err ) { if ( err ) { throw err; } };
    endCallback = endCallback || function( err ) { if ( err ) { throw err; } };

    var doc = new Documentation();

    fstraverse.eachFile( path, 
        function( err, file ) {
            if ( err ) {
                return fileCallback( err, file );
            }

            parser.parseFile( file, function( err, objectTree ) {
                var classes = doc.addClasses( objectTree );
                var classesProcessed = 0;
                if ( !classes.length ) {
                    return fileCallback( null, file );
                }
                classes.forEach( function( classDoc ) {
                    template.renderToFile( templateDir + "/class.html", { classDoc: classDoc, doc: doc }, outputDir + classDoc.name + ".html",
                        function( err, html ) {
                            if ( err ) {
                                return fileCallback( err, file );
                            }
                            ++classesProcessed;
                            if ( classesProcessed == classes.length ) {
                                fileCallback( null, file );
                            }
                        }
                    );
                } );
            } );
        },
        function( err, files, stats ) {
            endCallback( err, doc );
        }
    );
}

exports.generate = generate;
exports.parser = parser;
exports.objecttree = objecttree;
exports.template = template;
exports.fstraverse = fstraverse;
