var argparse = require('argparse')
var pkg = require('../package.json')

var parser = new argparse.ArgumentParser({
  version: pkg.version,
  description: pkg.description,
  addHelp: true
})

parser.addArgument(['source'], {
  help: 'Source configuration file (.ovpn) to split',
})

parser.addArgument(['--output-dir'], {
  help: 'Output directory of split files',
  defaultValue: null,
  dest: 'outputDir',
  required: false
})

parser.addArgument(['--destination-config'], {
  help: 'Filename to output new .ovpn file to',
  defaultValue: null,
  dest: 'config',
  required: false
})

parser.addArgument(['--ca-certificate'], {
  help: 'Filename to output CA-certificate to',
  defaultValue: 'ca.crt',
  dest: 'caCert',
  required: false
})

parser.addArgument(['--user-certificate'], {
  help: 'Filename to output user-certificate to',
  defaultValue: 'user.crt',
  dest: 'userCert',
  required: false
})

parser.addArgument(['--private-key'], {
  help: 'Filename to output private key to',
  defaultValue: 'client.key',
  dest: 'privateKey',
  required: false
})

parser.addArgument(['--tls-auth'], {
  help: 'Filename to output TLS-auth key to',
  defaultValue: 'ta.key',
  dest: 'tlsAuth',
  required: false
})

parser.addArgument(['--overwrite'], {
  help: 'Overwrite any existing certificates, keys and configuration files with the same names',
  action: 'storeTrue',
  defaultValue: false,
  required: false
})

exports.parseArgs = function () {
  return parser.parseArgs()
}
