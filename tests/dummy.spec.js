
(function () {
  const chai = require('chai');
  chai.use(require('dirty-chai'));
  const expect = chai.expect;
  // const assert = chai.assert;

  describe('dummy', () => {
    context('given:', () => {
      it('should:', () => {
        expect(1).to.equal(1);
      });
    });
  });
})();
