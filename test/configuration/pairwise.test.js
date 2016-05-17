'use strict';

const { expect } = require('chai');
const { Provider } = require('../../lib');

describe('Provider configuration', function () {
  it('validates pairwiseSalt presence when pairwise is configured', function () {
    const throws = [
      function () {
        new Provider('http://localhost:3000', { // eslint-disable-line no-new
          subjectTypesSupported: ['pairwise']
        });
      },
      function () {
        new Provider('http://localhost:3000', { // eslint-disable-line no-new
          subjectTypesSupported: ['public', 'pairwise']
        });
      },
    ];

    const notThrows = [
      function () {
        new Provider('http://localhost:3000', { // eslint-disable-line no-new
          subjectTypesSupported: ['public'],
          pairwiseSalt: 'is provided'
        });
      }
    ];

    throws.forEach(function (fn) {
      expect(fn).to.throw(/pairwiseSalt must be configured/);
    });

    notThrows.forEach(function (fn) {
      expect(fn).not.to.throw();
    });
  });
});
