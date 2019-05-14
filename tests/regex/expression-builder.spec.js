/* eslint-disable no-useless-escape */

(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const assert = chai.assert;
  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();
  const XHelpers = require('../helpers/xml-test-helpers');
  const Builder = require('../../lib/regex/expression-builder');

  const getTestOptions = (el) => {
    return {
      id: 'name'
    };
  };

  describe('Expression builder', () => {
    context('Expression', () => {
      context('Error handling', () => { // Expression:
        const tests = [{
          given: 'Expression defined within Expressions with duplicated entry',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="field-type-expressions">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'Expression defined within Expressions without @name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="field-type-expressions">
                <Expression nametypo="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'Expression defined within Expressions with empty @name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="field-type-expressions">
                <Expression name="" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        // Expressions:
        {
          given: 'Expression defined within Expressions with duplicated entry',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="field-type-expressions">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
              <Expressions name="field-type-expressions">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'Expression defined within Expressions without @name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions nametypo="field-type-expressions">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'Expression defined within Expressions with empty @name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        }];
        tests.forEach((t) => {
          context(`given: ${t.given}`, () => {
            it('should: throw', () => {
              const document = parser.parseFromString(t.data);
              const applicationNode = XHelpers.selectFirst('/Application', document);

              if (applicationNode) {
                expect(() => {
                  Builder.buildExpressions(applicationNode, getTestOptions);
                }).to.throw();
              } else {
                assert.fail('Couldn\'t get Application node.');
              }
            });
          });
        });
      });
    }); // Expression
  }); // Expression builder
})();
