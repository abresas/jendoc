var parser = require( './parser' ),
    objecttree = require( './objecttree' ),
    template = require( './template' ),
    Documentation = require( './symbols/documentation' ).Documentation,
    fstraverse = require( './fstraverse' ),
    fs = require( 'fs' );

function generate( path, templateDir, outputDir, fileCallback, endCallback ) {
    fileCallback = fileCallback || function( err ) { if ( err ) { throw err; } };
    endCallback = endCallback || function( err ) { if ( err ) { throw err; } };

    var doc = new Documentation( 'Documentation' );
    var fileQueue = [];

    function fCallback( err, file ) {
        fileCallback( err, file );

        fileQueue.splice( fileQueue.indexOf( file ), 1 );
        if ( fileQueue.length == 0 ) {
            eCallback( err );
        }
    }

    function eCallback( err ) {
        doc.classes = doc.classes.sort( function( a, b ) {
            if ( a.name > b.name ) {
                return 1;
            }
            else if ( a.name < b.name ) {
                return -1;
            }
            else {
                return 0;
            }
        } );
        template.renderToFile( templateDir + "/index.html", { doc: doc }, outputDir + "index.html", function( err ) {
            endCallback( err, doc );
        } );
    }

    fstraverse.eachFile( path, 
        function( err, file ) {
            var filePath, dir;

            if ( file != path ) {
                filePath = file.slice( path.length );
            }
            else {
                filePath = file;
            }

            var dir = filePath.slice( 0, filePath.indexOf( "/", 1 ) );
            if ( filePath.indexOf( "/" ) == -1 ) {
                dir = "";
            }

            fileQueue.push( file );

            if ( err ) {
                return fCallback( err, file );
            }

            parser.parseFile( file, function( err, objectTree ) {
                var classes = doc.addClasses( objectTree );
                var classesProcessed = 0;
                if ( !classes.length ) {
                    return fCallback( null, file );
                }
                classes.forEach( function( classDoc ) {
                    classDoc.file = file;
                    classDoc.directory = dir;
                    template.renderToFile( templateDir + "/class.html", { classDoc: classDoc, doc: doc }, outputDir + classDoc.name + ".html",
                        function( err, html ) {
                            if ( err ) {
                                return fileCallback( err, file );
                            }
                            ++classesProcessed;
                            if ( classesProcessed == classes.length ) {
                                fCallback( null, file );
                            }
                        }
                    );
                } );
            } );
        },
        function( err, files, stats ) {
            if ( fileQueue.length == 0 ) {
                eCallback( err );
            }
        }
    );
}

exports.generate = generate;
exports.parser = parser;
exports.objecttree = objecttree;
exports.template = template;
exports.fstraverse = fstraverse;
