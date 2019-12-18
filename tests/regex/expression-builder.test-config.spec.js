// import datum from './expression-builder.test-config.xml';
/* tslint:disable:no-useless-escape */
const datum = '<?xml version="1.0"?>';

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
  const Impl = require('../../lib/regex/expression-builder.impl');

  const options = {
    id: 'name'
  };
  const getTestOptions = (el) => options;

  describe('expression-builder: buildExpressions (test config)', () => {
    context('given: a config with various expressions and expression groups', () => {
      it('should: return a map object with loaded expressions"', () => {
        const applicationNode = XHelpers.selectFirst('/Application', document);
        if (applicationNode) {
          const expressions = Builder.buildExpressions(applicationNode, getTestOptions);

          const keys = R.keys(expressions);
          expect(keys.length).to.equal(34);
          expect(keys).to.include('alpha-num-expression');
        } else {
          assert.fail('Couldn\'t get Application node.');
        }
      });
    });
  }); // expression-builder: buildExpressions (test config)

  describe('expression-builder.impl: evaluate (test config)', () => {
    context('given: a config with various expressions and expression groups', () => {
      it('should: evaluate all built expressions"', () => {
        const applicationNode = XHelpers.selectFirst('/Application', document);
        if (applicationNode) {
          const expressions = Builder.buildExpressions(applicationNode, getTestOptions);

          R.forEach((expressionName) => {
            const expression = Impl.evaluate(expressionName, expressions, options);

            const regexpObj = expression.$regexp;
            expect(regexpObj).to.be.a('regexp');

            const source = regexpObj.source;
            expect(source).to.be.a('string');
          })(R.keys(expressions));
        } else {
          assert.fail('Couldn\'t get Application node.');
        }
      });
    });
  }); // expression-builder.impl: evaluate (test config)
})(datum);
