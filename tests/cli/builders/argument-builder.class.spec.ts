
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as Jaxom from 'jaxom-ts';
// import * as R from 'ramda';
// import * as xp from 'xpath-ts';
// import 'xmldom-ts';
// const parser = new DOMParser();
// import { ArgumentBuilder } from '../../../lib/cli/builders/argument-builder.class';

describe('argument-builder class', () => {
  context('given: DUFF test', () => {
    it.only('should: be ok', () => {
      const converter = new Jaxom.XpathConverter();
      // const builder = new ArgumentBuilder(converter);

      expect(converter).to.not.be.null();
    });
  });
});
