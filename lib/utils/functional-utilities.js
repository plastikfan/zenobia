
const R = require('ramda');

/**
 * @function transformEach
 * @description: Effectively, this is a combination of map and forEach. Transforms all elements of
 *    an input array using the transformation function specified and produces a single indexable
 *    object as a result. The keys of the resultant map are the elements of the input array and as
 *    the input array should contain a series of unique items.
 *
 * @param {function} transform A function that takes the single element from the input array
 *    returning a transformed value
 * @returns {Object} An map object whose keys are the elements of the input array and values are
 *    the result of transforming the input using the transformer function passed in.
 */
function transformEach (transform) {
  return R.reduce((acc, val) => {
    const o = {};
    o[val] = transform(val);
    return Object.assign(acc, o);
  }, {});
}

/**
 * @function transformEachSpread
 * @description: This is the same as transformEach but with a different implementation using
 *    the spread operator. This function is not really necessary, but serves as an educational
 *    tool for the spread operator.
 *
 * @param {function} transform A function that takes the single element from the input array
 *    returning a transformed value
 * @returns {Object} An map object whose keys are the elements of the input array and values are
 *    the result of transforming the input using the transformer function passed in.
 */
function transformEachSpread (transform) {
  return R.reduce((acc, val) => ({
    ...acc,
    [val]: transform(val)
  }), {});
}

module.exports = {
  transformEach: R.curry(transformEach),
  transformEachSpread: transformEachSpread
};
