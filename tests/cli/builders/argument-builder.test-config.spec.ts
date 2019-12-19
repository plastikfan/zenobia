/* tslint:disable:no-useless-escape */

// import { expect, assert, use } from 'chai';
// import dirtyChai = require('dirty-chai');
// use(dirtyChai);
// import * as R from 'ramda';
// import { DOMParser } from 'xmldom';
// const parser = new DOMParser();
// import * as xpath from 'xpath';
// import * as Builder from '../../../lib/cli/builders/argument-builder';

// import data from './app.zenobia.argument-builder.test.config.xml';
// const document = parser.parseFromString(data.toString());

// describe('argument-builder.impl (test config)', () => {
//   context('given: a config file with various Arguments defined', () => {
//     it('should: build all argument definitions in config', () => {
//       const argumentsNode = xpath.select('/Application/Cli/Arguments', document, true);

//       if (argumentsNode instanceof Node) {
//         const argumentDefs = Builder.buildArguments(argumentsNode);

//         if (argumentDefs) {
//           const result = R.keys(argumentDefs._children).length;
//           expect(result).to.equal(33);
//         }
//       } else {
//         assert.fail('Couldn\'t get Arguments node.');
//       }
//     });
//   });
// });
