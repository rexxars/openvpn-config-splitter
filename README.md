openvpn-config-splitter
=======================

Splits OpenVPN (.ovpn) files into separate files for private key, user+ca certificates and tls-auth key, for use with network-manager in debian/ubuntu.

## Installation
openvpn-config-splitter can be installed using [npm](https://npmjs.org/):

```
# NPM:
npm install -g openvpn-config-splitter
```

## Usage

### As a CLI-tool
```
# Install globally
$ npm install -g openvpn-config-splitter

# Run it, specifying your unsplit OpenVPN configuration file
$ ovpnsplit path/to/some/config.ovpn

# Config is now split into separate files, new configuration
# linking to the split files has been generated
$ ls path/to/some
ca.crt  client.key  client.ovpn  client.split.ovpn  ta.key  user.crt
```

### As a library
```javascript
var fs         = require('fs'),
    configPath = '/some/path/to',
    splitter   = require('openvpn-config-splitter');

var paths = {
    'caCert': configPath + '/openvpn-ca.crt',
    'userCert': configPath + '/openvpn-user.crt',
    'privateKey': configPath + '/openvpn-private.key',
    'tlsAuth': configPath + '/openvpn-tls.key'
};

fs.readFile(configPath + '/config.ovpn', function(err, originalConfig) {
    if (err) {
        console.error('Could not read file (' + err.path + ')');
        process.exit(1);
    }

    splitter.split(originalConfig, paths, function(err, parts, missing) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        /**
         * `parts` now contain the matched parts of the config + new config
         * (caCert, userCert, privateKey, tlsAuth, config)
         *
         * `missing` is an array containing the parts that were NOT found -
         * use this if you want to warn the user or fall back if you require
         * a specific part to be present
         */

        // Want to write the split files?
        splitter.writeToFiles(parts, paths, function(err) {
            if (err) {
                console.log(err);
                process.exit(1);
            }

            console.log('Hooray, we split the files and wrote them to disk!');
        });

    });
});
```
