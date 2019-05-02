import datum from './expression-builder.test-config.xml';

(function (data) {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const assert = chai.assert;

  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();
  const R = require('ramda');

  const XHelpers = require('../helpers/xml-test-helpers');
  const document = parser.parseFromString(data.toString());
  const Builder = require('../../lib/regex/expression-builder');

  describe('expression-builder: buildExpressions (test config)', () => {
    context('given: a config with various expressions and expression groups', () => {
      it('should: return a map object with loaded expressions"', () => {
        const applicationNode = XHelpers.selectFirst('/Application', document);
        if (applicationNode) {
          let expressions = Builder.buildExpressions(applicationNode, (el) => {
            return {
              id: 'name'
            };
          });

          const keys = R.keys(expressions);
          expect(keys.length).to.equal(33);
          expect(keys).to.include('alpha-num-expression');
        } else {
          assert.fail('Couldn\'t get Application node.');
        }
      });
    });
  }); // expression-builder: buildExpressions (test config)

  describe('Normalise expressions', () => {

  });
})(datum);
