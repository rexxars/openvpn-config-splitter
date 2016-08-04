var errno = require('errno')

module.exports = function (err) {
  var str = 'Error: '

  // If it's a libuv error then get the description from errno
  if (errno.errno[err.errno]) {
    str += errno.errno[err.errno].description
  } else {
    str += err.message
  }

  // If it's an fs error then it'll have a 'path' property
  if (err.path) {
    str += ' [' + err.path + ']'
  }

  console.log(str)
  process.exit(err.code || 1)
}
