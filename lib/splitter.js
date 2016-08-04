var matchers = require('./matchers')
var async = require('async')
var fs = require('fs')

var defaults = {
  caCert: 'ca.crt',
  userCert: 'user.crt',
  privateKey: 'private.key',
  tlsAuth: 'tls.key',
  config: 'config.split.ovpn'
}

var mergeDefaultPaths = function (paths) {
  // Use default paths if not defined
  for (var key in defaults) {
    if (!paths[key]) {
      paths[key] = defaults[key]
    }
  }

  return paths
}

exports.split = function (source, outputPaths, callback) {
  var paths = mergeDefaultPaths(outputPaths)

  // Loop through matchers, running each one and assigning hits to `output`
  var match
  var output = {}
  for (var key in matchers) {
    if (!matchers.hasOwnProperty(key)) {
      continue
    }

    match = matchers[key].exec(source)

    if (!match) {
      continue
    }

    output[key] = match[1].trim()
  }

  // See if we are missing any keys
  var present = Object.keys(output)
  var missing = Object.keys(matchers).filter(function (i) {
    return present.indexOf(i) === -1
  })

  // If we found no recognizable parts, fall back
  if (!present.length) {
    setImmediate(
      callback,
      'Invalid configuration file, found no recognizable parts'
    )
    return
  }

  // See if we can find tls key direction
  var tlsDirMatch = source.match(/key-direction\s+([10])($|\s)/)
  var tlsKeyDir
  if (tlsDirMatch) {
    tlsKeyDir = tlsDirMatch[1]
  }

  // Build config string references to new files
  var refs = ['## -----ADDED BY OPENVPN-CONFIG-SPLITTER-----']
  if (output.caCert) {
    refs.push('ca ' + paths.caCert)
  }

  if (output.userCert) {
    refs.push('cert ' + paths.userCert)
  }

  if (output.privateKey) {
    refs.push('key ' + paths.privateKey)
  }

  if (output.tlsAuth) {
    refs.push(['tls-auth', paths.tlsAuth, tlsKeyDir].join(' ').trim())
  }

  // Create an altered configuration file
  var sigMatch = /(## -----BEGIN \w+ SIGNATURE-----)/
  if (sigMatch.test(source)) {
    output.config = source.replace(sigMatch, refs.join('\n') + '\n\n$1')
  } else {
    output.config = source + '\n\n' + refs.join('\n') + '\n\n'
  }

  // Respond to the callback, include missing parts of the config file
  callback(undefined, output, missing)
}

exports.writeToFiles = function (parts, outPaths, overwrite, cb) {
  var paths = mergeDefaultPaths(outPaths)

  var ow = overwrite
  var callback = cb
  if (typeof ow === 'function') {
    callback = ow
    ow = false
  }

  var tasks = []
  for (var key in parts) {
    if (!parts.hasOwnProperty(key)) {
      continue
    }

    tasks.push(async.apply(
      fs.writeFile,
      paths[key],
      parts[key],
      {flag: ow ? 'w' : 'wx'}
    ))
  }

  async.parallel(tasks, callback)
}
