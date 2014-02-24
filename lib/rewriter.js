'use strict';

var defaults = {
    'caCert': 'ca.crt',
    'userCert': 'user.crt',
    'privateKey': 'client.key',
    'tlsAuth': 'ta.key'
};

module.exports = function(source, parts, options, callback) {
    // If specific locations are not given for files, use defaults
    for (var key in defaults) {
        if (!options[key]) {
            options[key] = defaults[key];
        }
    }

    // Build config string references to new files
    var refs = ['## -----ADDED BY OPENVPN-CONFIG-SPLITTER-----'];
    if (parts.caCert)     { refs.push('ca ' + options.caCert); }
    if (parts.userCert)   { refs.push('cert ' + options.userCert); }
    if (parts.privateKey) { refs.push('key ' + options.privateKey); }
    if (parts.tlsAuth) {
        refs.push([
            'tls-auth',
            options.tlsAuth,
            options.tlsKeyDir || ''
        ].join(' ').trim());
    }

    // Create an altered configuration file
    parts.partsConfig = source.replace(
        /(## -----BEGIN \w+ SIGNATURE-----)/,
        refs.join("\n") + "\n\n$1"
    );

    return parts;
};
