
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as R from 'ramda';
import * as xpath from 'xpath';
import { DOMParser } from 'xmldom';
const parser = new DOMParser();

import * as Builder from '../../../lib/cli/builders/argument-builder';

describe('Argument builder', () => {
  context('given: a correctly defined argument', () => {
    it('should: build arguments successfully', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Arguments>
              <Argument name="director" alias="dn" optional="true"
                describe="Director name">
              </Argument>
            </Arguments>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const argumentsNode = xpath.select('/Application/Cli/Arguments', document, true);

      if (argumentsNode instanceof Node) {
        const argumentDefs = Builder.buildArguments(argumentsNode);

        if (argumentDefs) {
          const directorArg = R.path(['_children', 'director'])(argumentDefs);
          const result = R.whereEq({
            _: 'Argument',
            name: 'director',
            alias: 'dn',
            optional: 'true',
            describe: 'Director name'
          })(directorArg);
          expect(result).to.be.true();
        } else {
          assert.fail('Built Arguments is empty');
        }
      } else {
        assert.fail('Couldn\'t get Arguments node.');
      }
    });
  });

  context('Error handling', () => {
    interface IUnitTestInfo {
      given: string;
      data: string;
    }

    const tests: IUnitTestInfo[] = [
      {
        given: 'Argument definition with duplicated entry',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Arguments>
                <Argument name="path" alias="p" optional="true"
                  describe="Full path">
                </Argument>
                <Argument name="path" alias="p" optional="true"
                  describe="Full path (DUPLICATE)">
                </Argument>
              </Arguments>
            </Cli>
          </Application>`
      },
      {
        given: 'missing @name attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Arguments>
                <Argument alias="p" optional="true"
                  describe="Full path">
                </Argument>
              </Arguments>
            </Cli>
          </Application>`
      }
    // TODO: The following test should be re-enabled, once bug #12 (throwIfMissing not working)
    // on Jaxine is fixed.
    // {
    //   given: 'empty @name attribute',
    //   data: `<?xml version="1.0"?>
    //     <Application name="pez">
    //       <Cli>
    //         <Arguments>
    //           <Argument name="" alias="p" optional="true"
    //             describe="Full path">
    //           </Argument>
    //         </Arguments>
    //       </Cli>
    //     </Application>`
    // }
    ];

    tests.forEach((t: IUnitTestInfo) => {
      context(`given: ${t.given}`, () => {
        it('should: throw', () => {
          const document = parser.parseFromString(t.data);
          const argumentsNode = xpath.select('/Application/Cli/Arguments', document, true);

          if (argumentsNode instanceof Node) {
            expect(() => {
              Builder.buildArguments(argumentsNode);
            }).to.throw();
          } else {
            assert.fail('Couldn\'t get Arguments node.');
          }
        });
      });
    });
  });
}); // Argument builder
