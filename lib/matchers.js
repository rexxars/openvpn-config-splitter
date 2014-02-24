'use strict';

module.exports = {
    'caCert': /<ca>([\s\S]*?)<\/ca>/,
    'userCert': /<cert>([\s\S]*?)<\/cert>/,
    'privateKey': /<key>([\s\S]*?)<\/key>/,
    'tlsAuth': /<tls-auth>([\s\S]*?)<\/tls-auth>/
};