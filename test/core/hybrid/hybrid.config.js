'use strict';

module.exports = {
  config: {
    cookies: {
      long: {
        signed: false
      },
      short: {
        signed: false
      }
    },
    responseTypesSupported: ['none', 'code id_token', 'code token', 'code id_token token'],
    scopes: ['openid'],
    subjectTypesSupported: ['public'],
    tokenEndpointAuthMethodsSupported: ['client_secret_basic', 'client_secret_post']
  },
  client: {
    client_id: 'client',
    client_secret: 'secret',
    grant_types: ['implicit', 'authorization_code'],
    response_types: ['code id_token', 'code token', 'code id_token token'],
    redirect_uris: ['https://client.example.com/cb'],
  },
  certs: [
    require('../../default.sig.key')
  ]
};
