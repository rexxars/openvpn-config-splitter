'use strict';

var matchers = require('./matchers'),
    async    = require('async'),
    fs       = require('fs');

var defaults = {
    caCert: 'ca.crt',
    userCert: 'user.crt',
    privateKey: 'private.key',
    tlsAuth: 'tls.key',
    config: 'config.split.ovpn'
};

var mergeDefaultPaths = function(paths) {
    // Use default paths if not defined
    for (var key in defaults) {
        if (!paths[key]) {
            paths[key] = defaults[key];
        }
    }

    return paths;
};

exports.split = function(source, paths, callback) {
    paths = mergeDefaultPaths(paths);

    // Loop through matchers, running each one and assigning hits to `output`
    var match, key, output = {};
    for (key in matchers) {
        match = matchers[key].exec(source);

        if (!match) {
            continue;
        }

        output[key] = match[1].trim();
    }

    // See if we are missing any keys
    var present = Object.keys(output),
        missing = Object.keys(matchers).filter(function(i) {
            return present.indexOf(i) === -1;
        });

    // If we found no recognizable parts, fall back
    if (!present.length) {
        return setImmediate(
            callback,
            'Invalid configuration file, found no recognizable parts'
        );
    }

    // See if we can find tls key direction
    var tlsDirMatch = source.match(/key-direction\s+([10])($|\s)/), tlsKeyDir;
    if (tlsDirMatch) {
        tlsKeyDir = tlsDirMatch[1];
    }

    // Build config string references to new files
    var refs = ['## -----ADDED BY OPENVPN-CONFIG-SPLITTER-----'];
    if (output.caCert)     { refs.push('ca ' + paths.caCert); }
    if (output.userCert)   { refs.push('cert ' + paths.userCert); }
    if (output.privateKey) { refs.push('key ' + paths.privateKey); }
    if (output.tlsAuth)    {
        refs.push(['tls-auth', paths.tlsAuth, tlsKeyDir].join(' ').trim());
    }

    // Create an altered configuration file
    output.config = source.replace(
        /(## -----BEGIN \w+ SIGNATURE-----)/,
        refs.join("\n") + "\n\n$1"
    );

    // Respond to the callback, include missing parts of the config file
    callback(undefined, output, missing);
};

exports.writeToFiles = function(parts, paths, overwrite, callback) {
    paths = mergeDefaultPaths(paths);

    if (typeof overwrite === 'function') {
        callback  = overwrite;
        overwrite = false;
    }

    var tasks = [];
    for (var key in parts) {
        tasks.push(async.apply(
            fs.writeFile,
            paths[key],
            parts[key],
            { flag: overwrite ? 'w' : 'wx' }
        ));
    }

    async.parallel(tasks, callback);
};