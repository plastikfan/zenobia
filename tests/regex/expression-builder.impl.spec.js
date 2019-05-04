(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  const assert = chai.assert;
  const R = require('ramda');
  const DOMParser = require('xmldom').DOMParser;
  const parser = new DOMParser();

  const XHelpers = require('../helpers/xml-test-helpers');
  const Builder = require('../../lib/regex/expression-builder');
  const Impl = require('../../lib/regex/expression-builder.impl');

  const getTestOptions = (el) => {
    return {
      id: 'name'
    };
  };

  describe('Expression Builder', () => {
    context('evaluate', () => {
      const tests = [{
        given: 'an expression with a single Pattern with local regex text and Expression "eg" text',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX',
        expectedEgText: 'Ted'
      },
      {
        given: 'an expression with a multiple Patterns with local regex text and Pattern "eg" text',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression">
                <Pattern eg="ONE"><![CDATA[THIS IS A REG EX]]></Pattern>
                <Pattern eg="-TWO"><![CDATA[.SOME-MORE]]></Pattern>
                <Pattern eg="-THREE"><![CDATA[.EVEN-MORE]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX.SOME-MORE.EVEN-MORE',
        expectedEgText: 'ONE-TWO-THREE'
      },
      {
        given: 'an expression with a multiple Patterns with local regex text and other child elements',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
                <Pattern><![CDATA[.SOME-MORE]]></Pattern>
                <Pattern><![CDATA[.EVEN-MORE]]></Pattern>
                <Yield name="staging-album-yield" open="{" close="}">
                  <Placeholder is-present="member1"><![CDATA[ ~ {member1}]]></Placeholder>
                  <Placeholder is-present="member2"><![CDATA[ & {member2}]]></Placeholder>
                  <Placeholder is-present="member3"><![CDATA[ & {member3}]]></Placeholder>
                  <Placeholder is-present="member4"><![CDATA[ & {member4}]]></Placeholder>
                </Yield>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX.SOME-MORE.EVEN-MORE'
      },
      {
        given: 'an expression with a single Pattern which links to another pattern',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression">
                <Pattern link="spaced-dash-expression"/>
              </Expression>
              <Expression name="spaced-dash-expression">
                <Pattern><![CDATA[THIS IS A LINKED REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A LINKED REG EX'
      },
      {
        given: 'an expression with multiple Patterns and links',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="single-digit-day-no-expression">
                <Pattern><![CDATA[DAY]]></Pattern>
              </Expression>
              <Expression name="mmm-month-no-expression">
                <Pattern><![CDATA[MONTH]]></Pattern>
              </Expression>
              <Expression name="y2k-years-expression">
                <Pattern><![CDATA[YEAR]]></Pattern>
              </Expression>
              <Expression name="meta-date-expression">
                <Pattern eg="2" link="single-digit-day-no-expression"/>
                <Pattern eg=" " ><![CDATA[\\s]]></Pattern>
                <Pattern eg="jun" link="mmm-month-no-expression"/>
                <Pattern eg=" " ><![CDATA[\\s]]></Pattern>
                <Pattern eg="2016" link="y2k-years-expression"/>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'meta-date-expression',
        expectedRegexText: 'DAY\\sMONTH\\sYEAR'
      },
      {
        given: 'an expression with a single Pattern with a single capture group',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="y2k-years-expression">
                <Pattern><![CDATA[(?<year>20[0-2]\\d)]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'y2k-years-expression',
        expectedRegexText: '(?<year>20[0-2]\\d)',
        expectedCaptureGroups: ['year']
      },
      {
        given: 'an expression with a single Pattern with multiple capture groups',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="y2k-years-expression">
                <Pattern><![CDATA[(?<year>20[0-2]\\d)(?<mm>[0|1]\\d)(?<dd>[1-3]|[0-3]\\d?)]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'y2k-years-expression',
        expectedRegexText: '(?<year>20[0-2]\\d)(?<mm>[0|1]\\d)(?<dd>[1-3]|[0-3]\\d?)',
        expectedCaptureGroups: ['year', 'mm', 'dd']
      },
      {
        given: 'an expression with multiple capture groups across multiple linked Patterns',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="single-digit-day-no-expression">
                <Pattern><![CDATA[(?<d>[1-3]|[0-3]\\d?)]]></Pattern>
              </Expression>
              <Expression name="mmm-month-no-expression">
                <Pattern><![CDATA[(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])]]></Pattern>
              </Expression>
              <Expression name="y2k-years-expression">
                <Pattern><![CDATA[(?<year>20[0-2]\\d)]]></Pattern>
              </Expression>
              <Expression name="meta-date-expression">
                <Pattern eg="2" link="single-digit-day-no-expression"/>
                <Pattern eg=" " ><![CDATA[\\s]]></Pattern>
                <Pattern eg="jun" link="mmm-month-no-expression"/>
                <Pattern eg=" " ><![CDATA[\\s]]></Pattern>
                <Pattern eg="2016" link="y2k-years-expression"/>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'meta-date-expression',
        expectedRegexText: '(?<d>[1-3]|[0-3]\\d?)\\s(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])\\s(?<year>20[0-2]\\d)',
        expectedCaptureGroups: ['d', 'mmm', 'year']
      }];

      tests.forEach((t) => {
        context(`given: ${t.given}`, () => {
          it('should: evaluate regular expression text successfully', () => {
            const document = parser.parseFromString(t.data);
            const applicationNode = XHelpers.selectFirst('/Application', document);

            if (applicationNode) {
              let expressions = Builder.buildExpressions(applicationNode, getTestOptions);

              const expression = Impl.evaluate(t.expressionName, expressions, getTestOptions('Expression'));
              const expressionObject = R.prop('$regexp')(expression);
              expect(expressionObject.source).to.equal(t.expectedRegexText);

              if (R.has('expectedEgText', t)) {
                const egText = R.prop('$eg')(expression);
                expect(egText, `Failed to extract "eg" text successfully`).to.equal(t.expectedEgText);
              }

              if (R.has('expectedCaptureGroups', t)) {
                const namedGroups = R.prop('$namedGroups')(expression);
                expect(namedGroups, `Failed to extract named capture groups successfully`).to.deep.equal(t.expectedCaptureGroups);
              }

              console.log(`RESULT: ${JSON.stringify(expression)}`);
            } else {
              assert.fail('Couldn\'t get Application node.');
            }
          });
        });
      });
    }); // evaluate

    //  *    - expressionName is falsey
    //  *    - id missing from options
    //  *    - no Expression for the expressionName specified
    //  *    - Expression element has not child Pattern elements defined
    //  *    - Expression contain both local text and a link attribute
    //  *    - Circular reference detected via link attribute
    //  *    - Expression does not contain either local text or a link attribute
    //  *    - Regular expression built is not valid

    context('evaluate errors', () => {
      const tests = [
        {
          given: 'evaluate invoked with empty expression name',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="test-expressions">
                <Expression name="forename-expression" eg="Ted">
                  <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`,
          expressionName: '',
          expectedRegexText: 'THIS IS A REG EX'
        },
        {
          given: 'evaluate invoked with undefined expression name',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="test-expressions">
                <Expression name="forename-expression" eg="Ted">
                  <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`,
          expressionName: undefined,
          expectedRegexText: 'THIS IS A REG EX'
        },
        // {
        //   given: 'evaluate invoked with options without an "id"',
        //   data: `<?xml version="1.0"?>
        //     <Application name="pez">
        //       <Expressions name="test-expressions">
        //         <Expression name="forename-expression" eg="Ted">
        //           <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
        //         </Expression>
        //       </Expressions>
        //     </Application>`,
        //   expressionName: '',
        //   expectedRegexText: 'THIS IS A REG EX',
        //   getOptions: (el) => ({ description: 'missing id' })
        // },
        {
          given: 'evaluate invoked with undefined expression name',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="test-expressions">
                <Expression name="forename-expression" eg="Ted">
                  <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`,
          expressionName: 'this-expression-does-not-exist',
          expectedRegexText: 'THIS IS A REG EX'
        }
      ];

      tests.forEach((t) => {
        context(`given: ${t.given}`, () => {
          it('should: throw', () => {
            const document = parser.parseFromString(t.data);
            const applicationNode = XHelpers.selectFirst('/Application', document);

            if (applicationNode) {
              // const getOptions = R.has('getOptions', t) ? t.getOptions : getTestOptions;
              let expressions = Builder.buildExpressions(applicationNode, getTestOptions);

              expect(() => {
                Impl.evaluate(t.expressionName, expressions, getTestOptions('Expression'));
              }).to.throw();
            } else {
              assert.fail('Couldn\'t get Application node.');
            }
          });
        });
      });
    }); // evaluate errors
  }); // Expression Builder
})();
