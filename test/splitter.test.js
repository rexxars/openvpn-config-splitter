/* eslint-disable max-nested-callbacks, id-length, no-sync */
var fs = require('fs')
var path = require('path')
var test = require('tape')
var mockfs = require('mock-fs')
var splitter = require('../')

var readOpts = {encoding: 'utf8'}
var config = fs.readFileSync(path.join(__dirname, 'fixtures', 'example.ovpn'), readOpts)
var altConfig = fs.readFileSync(path.join(__dirname, 'fixtures', 'alternative.ovpn'), readOpts)

var filenames = {
  caCert: 'caCert.test',
  userCert: 'userCert.test',
  privateKey: 'privateKey.test',
  tlsAuth: 'tlsAuth.test'
}

test('splitter returns valid new config file', function (t) {

  splitter.split(config, filenames, function (err, res) {
    t.error(err, 'should not error')

    t.equal(573, res.caCert.length, 'caCert should have expected length')
    t.equal(573, res.userCert.length, 'userCert should have expected length')
    t.equal(581, res.privateKey.length, 'privateKey should have expected length')
    t.equal(650, res.tlsAuth.length, 'tlsAuth should have expected length')

    t.equal(0, res.caCert.indexOf('-----BEGIN CERTIFICATE-----'), 'caCert should start with signature')
    t.equal(28, res.caCert.indexOf('caCert'), 'caCert should contain our inserted string')

    t.equal(0, res.userCert.indexOf('-----BEGIN CERTIFICATE-----'), 'userCert should start with signature')
    t.equal(28, res.userCert.indexOf('userCert'), 'userCert should contain our inserted string')

    t.equal(0, res.privateKey.indexOf('-----BEGIN RSA PRIVATE KEY-----'), 'privateKey should start with signature')
    t.equal(32, res.privateKey.indexOf('privateKey'), 'privateKey should contain our inserted string')

    t.equal(0, res.tlsAuth.indexOf('#\n# 2048 bit OpenVPN static key (Server Agent)'), 'tlsAuth should start with signature')
    t.ok(res.tlsAuth.indexOf('db6ff2ffe2df7b8cfc0d9542bdce27dc') > -1, 'tlsAuth should contain given string')

    t.ok(res.config.match(/^ca caCert\.test$/m), 'config should contain caCert entry')
    t.ok(res.config.match(/^cert userCert\.test$/m), 'config should contain userCert entry')
    t.ok(res.config.match(/^key privateKey\.test$/m), 'config should contain privateKey entry')
    t.ok(res.config.match(/^tls-auth tlsAuth\.test/m), 'config should contain tlsAuth entry')
    t.ok(res.config.match(/^tls-auth tlsAuth\.test 1$/m), 'tlsAuth entry should end with correct key direction')

    t.end()
  })
})

test('splitter returns valid new config file for alt syntax', function (t) {

  splitter.split(altConfig, filenames, function (err, res) {
    t.error(err, 'should not error')

    t.equal(573, res.caCert.length, 'caCert should have expected length')
    t.equal(573, res.userCert.length, 'userCert should have expected length')
    t.equal(581, res.privateKey.length, 'privateKey should have expected length')
    t.equal(601, res.tlsAuth.length, 'tlsAuth should have expected length')

    t.equal(0, res.caCert.indexOf('-----BEGIN CERTIFICATE-----'), 'caCert should start with signature')
    t.equal(28, res.caCert.indexOf('caCert'), 'caCert should contain our inserted string')

    t.equal(0, res.userCert.indexOf('-----BEGIN CERTIFICATE-----'), 'userCert should start with signature')
    t.equal(28, res.userCert.indexOf('userCert'), 'userCert should contain our inserted string')

    t.equal(0, res.privateKey.indexOf('-----BEGIN RSA PRIVATE KEY-----'), 'privateKey should start with signature')
    t.equal(32, res.privateKey.indexOf('privateKey'), 'privateKey should contain our inserted string')

    t.equal(0, res.tlsAuth.indexOf('-----BEGIN OpenVPN Static key V1-----'))
    t.ok(res.tlsAuth.indexOf('db6ff2ffe2df7b8cfc0d9542bdce27dc') > -1, 'tlsAuth should contain given string')

    t.ok(res.config.match(/^ca caCert\.test$/m), 'config should contain caCert entry')
    t.ok(res.config.match(/^cert userCert\.test$/m), 'config should contain userCert entry')
    t.ok(res.config.match(/^key privateKey\.test$/m), 'config should contain privateKey entry')
    t.ok(res.config.match(/^tls-auth tlsAuth\.test/m), 'config should contain tlsAuth entry')
    t.ok(res.config.match(/^tls-auth tlsAuth\.test 1$/m), 'tlsAuth entry should end with correct key direction')

    t.end()
  })
})

test('splitter should work with absolute paths', function (t) {
  var paths = {}
  for (var key in filenames) {
    if (filenames.hasOwnProperty(key)) {
      paths[key] = '/some/path/' + filenames[key]
    }
  }

  splitter.split(config, paths, function (err, res) {
    t.error(err, 'should not error')

    t.ok(res.config.match(/^ca \/some\/path\/caCert\.test$/m), 'config should contain absolute caCert entry')
    t.ok(res.config.match(/^cert \/some\/path\/userCert\.test$/m), 'config should contain absolute userCert entry')
    t.ok(res.config.match(/^key \/some\/path\/privateKey\.test$/m), 'config should contain absolute privateKey entry')
    t.ok(res.config.match(/^tls-auth \/some\/path\/tlsAuth\.test 1$/m), 'config should contain absolute tlsAuth entry')

    t.end()
  })
})

test('splitter returns error if no recognized parts could be found in config', function (t) {
  t.plan(2)

  var dummy = ['# Blah', '<something>', 'moo', '</something>', 'foo']
  splitter.split(dummy.join('\n'), {}, function (err, res) {
    t.ok(err, 'first argument should be an error')
    t.equal(undefined, res, 'results argument should be undefined')
  })
})

test('splitter extracts correct ca from config', function (t) {
  t.plan(4)

  var dummy = ['# Blah', '<ca>', 'correct-ca', '</ca>', 'foo']
  splitter.split(dummy.join('\n'), {}, function (err, res) {
    t.error(err, 'should not give any errors on valid input')
    t.equal('correct-ca', res.caCert, 'should get correct ca from line-breaked string')
  })

  splitter.split(dummy.join(''), {}, function (err, res) {
    t.error(err, 'should not give any errors on valid input')
    t.equal('correct-ca', res.caCert, 'should get correct ca from no-whitespace string')
  })
})

test('splitter extracts correct user cert from config', function (t) {
  t.plan(4)

  var dummy = ['# Blah', '<cert>', 'correct-cert', '</cert>', 'foo']
  splitter.split(dummy.join('\n'), {}, function (err, res) {
    t.error(err, 'should not give any errors on valid input')
    t.equal('correct-cert', res.userCert, 'should get correct cert from line-breaked string')
  })

  splitter.split(dummy.join(''), {}, function (err, res) {
    t.error(err, 'should not give any errors on valid input')
    t.equal('correct-cert', res.userCert, 'should get correct cert from no-whitespace string')
  })
})

test('splitter extracts correct private key from config', function (t) {
  t.plan(4)

  var needle = 'some kind of key - the correct one, hopefully'
  var dummy = ['# Blah', '<key>', needle, '</key>', 'foo']
  splitter.split(dummy.join('\n'), {}, function (err, res) {
    t.error(err, 'should not give any errors on valid input')
    t.equal(needle, res.privateKey, 'should get correct key from line-breaked string')
  })

  splitter.split(dummy.join(''), {}, function (err, res) {
    t.error(err, 'should not give any errors on valid input')
    t.equal(needle, res.privateKey, 'should get correct key from no-whitespace string')
  })
})

test('splitter extracts correct tls auth key from config', function (t) {
  t.plan(4)

  var needle = 'TEE TO THE ELL TO THE ESS'
  var dummy = ['# Blah', '<tls-auth>', needle, '</tls-auth>', 'foo']
  splitter.split(dummy.join('\n'), {}, function (err, res) {
    t.error(err, 'should not give any errors on valid input')
    t.equal(needle, res.tlsAuth, 'should get correct tls key from line-breaked string')
  })

  splitter.split(dummy.join(''), {}, function (err, res) {
    t.error(err, 'should not give any errors on valid input')
    t.equal(needle, res.tlsAuth, 'should get correct tls key from no-whitespace string')
  })
})

test('writer overwrites files if told to', function (t) {
  var contents = {
    'caCert.test': 'ca',
    'userCert.test': 'user',
    'privateKey.test': 'privatekey',
    'tlsAuth.test': 'tls'
  }

  mockfs({'/some/path': contents})

  var paths = {}
  for (var key in filenames) {
    if (filenames.hasOwnProperty(key)) {
      paths[key] = '/some/path/' + filenames[key]
    }
  }

  splitter.split(config, paths, function (splitErr, parts) {
    if (splitErr) {
      throw splitErr
    }

    splitter.writeToFiles(parts, paths, true, function (err) {
      t.error(err, 'error argument should be empty')

      for (var contentKey in contents) {
        if (contents.hasOwnProperty(contentKey)) {
          t.notEqual(
            contents[contentKey],
            fs.readFileSync('/some/path/' + contentKey, {encoding: 'utf8'}),
            'contents of ' + contentKey + ' should have changed'
          )
        }
      }

      mockfs.restore()
      t.end()
    })
  })

})

test('writer does not overwrite files by default', function (t) {
  var contents = {
    'caCert.test': 'ca',
    'userCert.test': 'user',
    'privateKey.test': 'privatekey',
    'tlsAuth.test': 'tls'
  }

  mockfs({'/some/path': contents})

  var paths = {}
  for (var key in filenames) {
    if (filenames.hasOwnProperty(key)) {
      paths[key] = '/some/path/' + filenames[key]
    }
  }

  splitter.split(config, paths, function (splitErr, parts) {
    if (splitErr) {
      throw splitErr
    }

    splitter.writeToFiles(parts, paths, function (err) {
      t.equal('EEXIST', err.code, 'error should have EEXIST code')
      for (var contentKey in contents) {
        if (contents.hasOwnProperty(contentKey)) {
          t.equal(
            contents[contentKey],
            fs.readFileSync('/some/path/' + contentKey, {encoding: 'utf8'}),
            'contents of ' + contentKey + ' should not have changed'
          )
        }
      }

      // Write tasks are still ongoing in the background, since async.parallel
      // returns once it encounters an error, but can't stop the ongoing tasks
      // So we need to wait before we restore the filesystem from mock state
      setImmediate(function () {
        mockfs.restore()
        t.end()
      })
    })
  })

})
