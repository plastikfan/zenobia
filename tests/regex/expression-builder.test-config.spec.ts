
/* tslint:disable:no-useless-escape */

import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as R from 'ramda';
import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';
import * as fs from 'fs';
import * as Builder from '../../lib/regex/expression-builder';
import * as Impl from '../../lib/regex/expression-builder.impl';

const parser = new DOMParser();

function read (path: string): string {
  return fs.readFileSync(path, 'utf8');
}

// const options = {
//   id: 'name'
// };
// const getTestOptions = (el: string): any => options;

describe('expression-builder (test config)', () => {
  let xml: string;
  let document: Document;

  before(() => {
    try {
      xml = read('./expression-builder.test-config.xml');
      document = parser.parseFromString(xml.toString());
    } catch (err) {
      assert.fail(err);
    }
  });

  context('given: a config with various expressions and expression groups', () => {
    it('should: return a map object with loaded expressions"', () => {
      const applicationNode = xpath.select('/Application', document, true);

      if (applicationNode instanceof Node) {
        const expressions: any = Builder.buildExpressions(applicationNode); // ?? getTestOptions

        const keys = R.keys(expressions);
        expect(keys.length).to.equal(34);
        expect(keys).to.include('alpha-num-expression');
      } else {
        assert.fail('Couldn\'t get Application node.');
      }
    });
  });

  context('given: a config with various expressions and expression groups', () => {
    it('should: evaluate all built expressions"', () => {
      const applicationNode = xpath.select('/Application', document, true);

      if (applicationNode instanceof Node) {
        const expressions = Builder.buildExpressions(applicationNode); // ?? getTestOptions

        R.forEach((expressionName: string) => {
          const expression = Impl.evaluate(expressionName, expressions); // ?? options

          const regexpObj = expression.$regexp;
          expect(regexpObj).to.be.a('regexp');

          const source = regexpObj.source;
          expect(source).to.be.a('string');
        })(R.keys(expressions) as string[]);
      } else {
        assert.fail('Couldn\'t get Application node.');
      }
    });
  });
}); // expression-builder (test config)
