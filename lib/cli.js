#!/bin/sh
// 2>/dev/null exec "$(command -v nodejs || command -v node)" "$0" "$@"

var fs = require('fs')
var path = require('path')
var errOut = require('./error')
var splitter = require('./splitter')
var args = require('./args').parseArgs()

var outPath = args.outputDir || path.resolve(path.dirname(args.source))
var paths = {}

// Find a suitable name for the output config (if none is specified)
if (!args.config) {
  args.config = path.basename(args.source, path.extname(args.source))
  args.config += '.split.ovpn'
}

// Make correct paths to files if they are not already absolute
['caCert', 'userCert', 'privateKey', 'tlsAuth', 'config'].forEach(function (i) {
  paths[i] = path.resolve(outPath, args[i])
})

fs.readFile(args.source, {encoding: 'utf8'}, function (readErr, source) {
  // Exit if running into errors opening the specified file
  if (readErr) {
    errOut(readErr)
    return
  }

  // Run source through splitter
  splitter.split(source.toString(), args, function (splitErr, contents, missing) {
    // Exit if we ran into any error, warn if we found any missing parts
    if (splitErr) {
      errOut({code: 1, message: splitErr})
      return
    } else if (missing.length) {
      console.warn(
        'Warning: could not find ' + missing.join(', ') + ' - '
        + 'configuration might not work as expected'
      )
    }

    splitter.writeToFiles(contents, paths, args.overwrite, function (writeErr) {
      if (writeErr && writeErr.code === 'EEXIST') {
        console.error(
          'File already exists, use --overwrite to overwrite '
          + '[' + writeErr.path + ']'
        )
      } else if (writeErr) {
        errOut(writeErr)
      }
    })
  })
})
