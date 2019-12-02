import datum from './app.zenobia.argument-builder.test.config.xml';

(function (data) {
  const chai = require('chai');
  const expect = chai.expect;
  const assert = chai.assert;

  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();
  const R = require('ramda');

  const XHelpers = require('../../helpers/xml-test-helpers');
  const document = parser.parseFromString(data.toString());
  const Builder = require('../../../lib/cli/builders/argument-builder');

  describe('argument-builder.impl (test config)', () => {
    context('given: a config file with various Arguments defined', () => {
      it('should: build all argument definitions in config', () => {
        const argumentsNode = XHelpers.selectFirst('/Application/Cli/Arguments', document);

        if (argumentsNode) {
          const argumentDefs = Builder.buildArguments(argumentsNode, (el) => {
            return {
              id: 'name'
            };
          });

          if (argumentDefs) {
            const result = R.keys(argumentDefs._children).length;
            expect(result).to.equal(33);
          }
        } else {
          assert.fail('Couldn\'t get Arguments node.');
        }
      });
    });
  });
})(datum);
