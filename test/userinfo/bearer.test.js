'use strict';

const bootstrap = require('../test_helper');
const { expect } = require('chai');

describe('providing Bearer token', () => {
  const { agent } = bootstrap(__dirname);
  context('invalid requests', () => {
    it('nothing provided', () => {
      return agent.get('/me')
      .expect(400)
      .expect((response) => {
        expect(response.body.error).to.equal('invalid_request');
        expect(response.body.error_description).to.equal('no bearer token provided');
      });
    });

    it('provided twice', () => {
      return agent.get('/me')
      .auth('auth', 'provided')
      .query({ access_token: 'whaaat' })
      .expect(400)
      .expect((response) => {
        expect(response.body.error).to.equal('invalid_request');
        expect(response.body.error_description).to.equal('bearer token must only be provided using one mechanism');
      });
    });

    it('bad Authorization header format (one part)', () => {
      return agent.get('/me')
      .set('Authorization', 'Bearer')
      .expect(400)
      .expect((response) => {
        expect(response.body.error).to.equal('invalid_request');
        expect(response.body.error_description).to.equal('invalid authorization header value format');
      });
    });

    it('bad Authorization header format (more then two parts)', () => {
      return agent.get('/me')
      .set('Authorization', 'Bearer some three')
      .expect(400)
      .expect((response) => {
        expect(response.body.error).to.equal('invalid_request');
        expect(response.body.error_description).to.equal('invalid authorization header value format');
      });
    });

    it('bad Authorization header format (not bearer)', () => {
      return agent.get('/me')
      .set('Authorization', 'Basic some')
      .expect(400)
      .expect((response) => {
        expect(response.body.error).to.equal('invalid_request');
        expect(response.body.error_description).to.equal('invalid authorization header value format');
      });
    });

    it('[query] empty token provided', () => {
      return agent.get('/me')
      .query({ access_token: '' })
      .expect(400)
      .expect((response) => {
        expect(response.body.error).to.equal('invalid_request');
        expect(response.body.error_description).to.equal('no bearer token provided');
      });
    });

    it('[body] empty token provided', () => {
      return agent.post('/me')
      .send('access_token=')
      .expect(400)
      .expect((response) => {
        expect(response.body.error).to.equal('invalid_request');
        expect(response.body.error_description).to.equal('no bearer token provided');
      });
    });
  });
});
