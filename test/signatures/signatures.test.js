'use strict';

const {
  provider, agent, AuthenticationRequest, wrap
} = require('../test_helper')(__dirname);
const { parse: parseLocation } = require('url');
const { v4: uuid } = require('node-uuid');
const { decode } = require('../../lib/helpers/jwt');
const { expect } = require('chai');

const AuthorizationCode = provider.get('AuthorizationCode');

provider.setupClient();
provider.setupClient({
  client_id: 'client-sig-none',
  client_secret: 'secret',
  response_types: ['code'],
  grant_types: ['authorization_code'],
  id_token_signed_response_alg: 'none',
  redirect_uris: ['https://client.example.com/cb'],
});
provider.setupClient({
  client_id: 'client-sig-HS256',
  client_secret: 'atleast32byteslongforHS256mmkay?',
  response_types: ['code'],
  grant_types: ['authorization_code'],
  id_token_signed_response_alg: 'HS256',
  redirect_uris: ['https://client.example.com/cb'],
});
provider.setupCerts();

describe('token hashes in id_token', function () {
  let client;
  before(function * () {
    client = yield provider.get('Client').find('client');
  });

  before(agent.login);

  after(function * () {
    client.idTokenSignedResponseAlg = 'RS256';
  });

  it('responds with a access_token and code (half of sha512)', function () {
    client.idTokenSignedResponseAlg = 'RS512';
    const auth = new AuthenticationRequest({
      response_type: 'code id_token token',
      scope: 'openid'
    });

    return wrap({ agent, auth, verb: 'get', route: '/auth' })
    .expect(302)
    .expect(auth.validateFragment)
    .expect(auth.validateClientLocation)
    .expect(function (response) {
      const { query: { id_token } } = parseLocation(response.headers.location, true);
      const { payload } = decode(id_token);
      expect(payload).to.contain.keys('at_hash', 'c_hash');
      expect(payload.at_hash).to.have.lengthOf(43);
    });
  });

  it('responds with a access_token and code (half of sha384)', function () {
    client.idTokenSignedResponseAlg = 'RS384';
    const auth = new AuthenticationRequest({
      response_type: 'code id_token token',
      scope: 'openid'
    });

    return wrap({ agent, auth, verb: 'get', route: '/auth' })
    .expect(302)
    .expect(auth.validateFragment)
    .expect(auth.validateClientLocation)
    .expect(function (response) {
      const { query: { id_token } } = parseLocation(response.headers.location, true);
      const { payload } = decode(id_token);
      expect(payload).to.contain.keys('at_hash', 'c_hash');
      expect(payload.at_hash).to.have.lengthOf(32);
    });
  });

  it('responds with a access_token and code (half of sha256)', function () {
    client.idTokenSignedResponseAlg = 'RS256';
    const auth = new AuthenticationRequest({
      response_type: 'code id_token token',
      scope: 'openid'
    });

    return wrap({ agent, auth, verb: 'get', route: '/auth' })
    .expect(302)
    .expect(auth.validateFragment)
    .expect(auth.validateClientLocation)
    .expect(function (response) {
      const { query: { id_token } } = parseLocation(response.headers.location, true);
      const { payload } = decode(id_token);
      expect(payload).to.contain.keys('at_hash', 'c_hash');
      expect(payload.at_hash).to.have.lengthOf(22);
    });
  });
});

describe('when id_token_signed_response_alg=none', function () {
  beforeEach(function * () {
    const ac = new AuthorizationCode({
      accountId: 'accountIdentity',
      acr: provider.configuration('acrValues[0]'),
      authTime: new Date() / 1000 | 0,
      clientId: 'client-sig-none',
      grantId: uuid(),
      redirectUri: 'https://client.example.com/cb',
      scope: 'openid',
    });

    return agent.post('/token')
      .auth('client-sig-none', 'secret')
      .type('form')
      .send({
        redirect_uri: 'https://client.example.com/cb',
        grant_type: 'authorization_code',
        code: yield ac.save()
      })
      .expect(200)
      .expect((response) => {
        this.idToken = response.body.id_token;
      });
  });

  it('issues an unsigned id_token', function () {
    const components = this.idToken.split('.');
    expect(components).to.have.lengthOf(3);
    expect(components[2]).to.equal('');
    expect(decode(this.idToken)).to.have.deep.property('header.alg', 'none');
  });

  it('the unsigned token can be used as id_token_hint', function () {
    const auth = new AuthenticationRequest({
      response_type: 'code',
      scope: 'openid',
      prompt: 'none',
      id_token_hint: this.idToken
    });
    auth.client_id = 'client-sig-none';

    return wrap({ agent, auth, route: '/auth', verb: 'get' })
    .expect(302)
    .expect(auth.validatePresence(['error', 'error_description', 'state']))
    .expect(auth.validateState)
    .expect(auth.validateClientLocation)
    .expect(auth.validateError('login_required'))
    .expect(auth.validateErrorDescription('id_token_hint and authenticated subject do not match'));
  });
});

describe('when id_token_signed_response_alg=HS256', function () {
  beforeEach(function * () {
    const ac = new AuthorizationCode({
      accountId: 'accountIdentity',
      acr: provider.configuration('acrValues[0]'),
      authTime: new Date() / 1000 | 0,
      clientId: 'client-sig-HS256',
      grantId: uuid(),
      redirectUri: 'https://client.example.com/cb',
      scope: 'openid',
    });

    return agent.post('/token')
      .auth('client-sig-HS256', 'atleast32byteslongforHS256mmkay?')
      .type('form')
      .send({
        redirect_uri: 'https://client.example.com/cb',
        grant_type: 'authorization_code',
        code: yield ac.save()
      })
      .expect(200)
      .expect((response) => {
        this.idToken = response.body.id_token;
      });
  });

  it('issues an HS256 signed id_token', function () {
    const components = this.idToken.split('.');
    expect(components).to.have.lengthOf(3);
    expect(components[2]).not.to.equal('');
    expect(decode(this.idToken)).to.have.deep.property('header.alg', 'HS256');
  });

  it('the HS256 signed token can be used as id_token_hint', function () {
    const auth = new AuthenticationRequest({
      response_type: 'code',
      scope: 'openid',
      prompt: 'none',
      id_token_hint: this.idToken
    });
    auth.client_id = 'client-sig-HS256';

    return wrap({ agent, auth, route: '/auth', verb: 'get' })
    .expect(302)
    .expect(auth.validatePresence(['error', 'error_description', 'state']))
    .expect(auth.validateState)
    .expect(auth.validateClientLocation)
    .expect(auth.validateError('login_required'))
    .expect(auth.validateErrorDescription('id_token_hint and authenticated subject do not match'));
  });
});
