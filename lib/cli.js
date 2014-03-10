#!/bin/sh
// 2>/dev/null; exec "$(command -v nodejs || command -v node)" "$0" "$@"

'use strict';

var fs       = require('fs'),
    path     = require('path'),
    errOut   = require('./error'),
    args     = require('./args').parseArgs(),
    splitter = require('./splitter'),
    outPath  = args.outputDir || path.resolve(path.dirname(args.source)),
    paths    = {};

// Find a suitable name for the output config (if none is specified)
if (!args.config) {
    args.config  = path.basename(args.source, path.extname(args.source));
    args.config += '.split.ovpn';
}

// Make correct paths to files if they are not already absolute
['caCert', 'userCert', 'privateKey', 'tlsAuth', 'config'].forEach(function(i) {
    paths[i] = path.resolve(outPath, args[i]);
});

fs.readFile(args.source, { 'encoding': 'utf8' }, function(err, source) {
    // Exit if running into errors opening the specified file
    if (err) {
        return errOut(err);
    }

    // Run source through splitter
    splitter.split(source, args, function(err, contents, missing) {
        // Exit if we ran into any error, warn if we found any missing parts
        if (err) {
            return errOut({ code: 1, message: err });
        } else if (missing.length) {
            console.warn(
                'Warning: could not find ' + missing.join(', ') + ' - ' +
                'configuration might not work as expected'
            );
        }

        splitter.writeToFiles(contents, paths, args.overwrite, function(err) {
            if (err && err.code === 'EEXIST') {
                console.error(
                    'File already exists, use --overwrite to overwrite ' +
                    '[' + err.path + ']'
                );
            } else if (err) {
                return errOut(err);
            }
        });
    });
});