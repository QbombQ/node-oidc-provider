/* eslint-disable no-console */

const path = require('path');
const url = require('url');

const { set } = require('lodash');
const express = require('express'); // eslint-disable-line import/no-unresolved
const helmet = require('helmet');

const Provider = require('../lib'); // require('oidc-provider');

const Account = require('./support/account');
const { provider: providerConfiguration, clients, keys } = require('./support/configuration');
const { express: routes } = require('./routes');

const { PORT = 3000, ISSUER = `http://localhost:${PORT}`, TIMEOUT } = process.env;
providerConfiguration.findById = Account.findById;

const app = express();
app.use(helmet());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const provider = new Provider(ISSUER, providerConfiguration);

if (TIMEOUT) {
  provider.defaultHttpOptions = { timeout: TIMEOUT };
}

let server;
(async () => {
  await provider.initialize({
    adapter: process.env.MONGODB_URI ? require('./support/heroku_mongo_adapter') : undefined, // eslint-disable-line global-require
    clients,
    keystore: { keys },
  });

  if (process.env.NODE_ENV === 'production') {
    app.enable('trust proxy');
    provider.proxy = true;
    set(providerConfiguration, 'cookies.short.secure', true);
    set(providerConfiguration, 'cookies.long.secure', true);

    app.use((req, res, next) => {
      if (req.secure) {
        next();
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        res.redirect(url.format({
          protocol: 'https',
          host: req.get('host'),
          pathname: req.originalUrl,
        }));
      } else {
        res.status(400).json({
          error: 'invalid_request',
          error_description: 'do yourself a favor and only use https',
        });
      }
    });
  }

  routes(app, provider);
  app.use(provider.callback);
  server = app.listen(PORT, () => {
    console.log(`application is listening on port ${PORT}, check it's /.well-known/openid-configuration`);
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
