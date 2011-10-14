var fs = require( 'fs' );

var eachFileOrDirectory = function(directory, fileHandler, completeHandler) {
  var filesToCheck = 0;
  var checkedFiles = [];
  var checkedStats = [];

  directory = (directory) ? directory : './';

  var fullFilePath = function(dir, file) {
    return dir.replace(/\/$/, '') + '/' + file;
  };

  var checkComplete = function() {
    if (filesToCheck == 0 && completeHandler) {
      completeHandler(null, checkedFiles, checkedStats);
    }
  };

  var onFileOrDirectory = function(fileOrDirectory) {
    filesToCheck++;
    fs.stat(fileOrDirectory, function(err, stat) {
      filesToCheck--;
      if (err) return fileHandler(err);
      checkedFiles.push(fileOrDirectory);
      checkedStats.push(stat);
      fileHandler(null, fileOrDirectory, stat);
      if (stat.isDirectory()) {
        onDirectory(fileOrDirectory);
      }
      checkComplete();
    });
  };

  var onDirectory = function(dir) {
    filesToCheck++;
    fs.readdir(dir, function(err, files) {
      filesToCheck--;
      if (err) return fileHandler(err);
      files.forEach(function(file, index) {
        file = fullFilePath(dir, file);
        onFileOrDirectory(file);
      });
      checkComplete();
    });
  }

  onFileOrDirectory(directory);
};

/**
 * Recursivly, asynchronously traverse the file system calling the provided 
 * callback for each file (non-directory) found.
 *
 * Traversal will begin on the provided path.
 */
var eachFile = function(path, callback, completeHandler) {
  var files = [];
  var stats = [];

  eachFileOrDirectory(path, function(err, file, stat) {
    if (err) return callback(err);
    if (!stat.isDirectory()) {
      files.push(file);
      stats.push(stat);
      if (callback) callback(null, file, stat);
    }
  }, function(err) {
    if (err) return completeHandler(err);
    if (completeHandler) completeHandler(null, files, stats);
  });
};

var allFileContents = function( path, callback ) {
    var filesRead = [];
    var allFiles = null;
    var contents = "";

    eachFile( path, function( err, file ) {
        if ( err ) {
            throw err;
        }

        if ( file.split( '/' ).pop()[ 0 ] == "." ) {
            filesRead.push( file );
            return;
        }

        fs.readFile( file, 'utf8', function( err, data ) {
            if ( err ) {
                throw err;
            }

            contents += data;
            filesRead.push( data );
            if ( !filesRead ) {
                filesRead = [];
            }
            if ( allFiles && filesRead.length == allFiles.length ) {
                callback( contents );
            }
        } );
    },
    function( err, files ) {
        if ( err ) {
            throw err;
        }

        allFiles = files;
        if ( allFiles.length == filesRead.length ) {
            callback( contents );
        }
    } );
}

exports.eachFileOrDirectory = eachFileOrDirectory;
exports.eachFile = eachFile;
exports.allFileContents = allFileContents;
