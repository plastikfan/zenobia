
const Jaxine = require('jaxine');
const Select = require('../utils/xml/selection-utilities');

/**
 * @function buildExpressionGroup
 * @description: tbd...
 *
 * @param {XMLNode} parentNode: the xpath node which is the parent under which the requested
 * expression group should reside.
 * @param {string} groupName: the "name" attribute of the expression group to build.
 * @param {Object} options: can contain:
 *  - "id": attribute through which an element is identified (must be unique and
 *    normally defaults to "name")
 *  - "recurse": the attribute value through element recursion occurs (normally
 *    "inherits")
 *  - "discards":
 * @returns: A group of regular expressions returned as a map-like object, keyed by the
 *    names of each expression group eg:
 *{
   'field-type-expressions': {
     'name': 'field-type-expressions',
     '_': 'Expressions',
     '_children': [{
           'name': "person's-name-expression",
           'eg': "Ted O'Neill",
           '_': 'Expression',
           '_children': [{
             '_': 'Pattern',
             '_text': "[a-zA-Z\\s']+"
           }],
           '_text': "must be kept in sync with \"content-person's-name-expression\""
         }
   ...
   In the above example, the returned object is a map, where the first entry is
   keyed by "field-type-expressions" and the value is a 'generic' object. The "_children"
   of the Expressions group are the individual regular expressions.
 */
function buildExpressionGroup (parentNode, groupName, options) {
  const { id = '' } = options;

  if (id !== '') {
    let expressionsGroupNode = Select.selectElementNodeById(
      'Expressions', id, groupName, parentNode);

    if (expressionsGroupNode) {
      let expressionsGroup = Jaxine.buildElement(expressionsGroupNode, parentNode, (el) => {
        return ((el === 'Expressions') || (el === 'Expression')) ? options : {};
      });
      return expressionsGroup;
    } else {
      throw new Error(`Bad configuration: No <Expressions "${id}"="${groupName}">s found`);
    }
  } else {
    throw new Error('No "id" field specified in Expression(s) option');
  }
}

module.exports = {
  buildExpressionGroup: buildExpressionGroup
};
