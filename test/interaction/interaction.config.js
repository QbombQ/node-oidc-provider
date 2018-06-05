const { clone } = require('lodash');
const config = clone(require('../default.config'));

config.features = { sessionManagement: true };

module.exports = {
  config,
  client: {
    client_id: 'client',
    client_secret: 'secret',
    redirect_uris: ['https://client.example.com/cb'],
  },
};
