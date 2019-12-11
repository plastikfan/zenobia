const xpath = require('xpath');

// Some of the functions defined here, are clones of what is in the implementation. But tests
// should have not be dependent on implementation that is not being tested.
//

// This should only be used when the expect number of nodes returned is 1. element
// names are supposed to be unique, so this should be 1.
// Given an element like this:
//  <Expression name="person's-name-expression" eg="Lara O'Neill">
//
// To get the Expression element whose id(name) is person's-name-expression:
//
// selectElementNodeById('Expression', 'name', 'person\'s-name-expression', <node>)
// Typically, the elementName ('Expression') can be accessed by node.nodeName
//
function selectElementNodeById (elementName, id, name, parentNode) {
  const elementResult = xpath.select(`.//${elementName}[@${id}="${name}"]`, parentNode) || {};
  let elementNode = {};

  if (elementResult && elementResult.length > 0) {
    elementNode = elementResult[0];
  }

  return elementNode;
}

function selectFirst (query, documentNode) {
  const selectionResult = xpath.select(query, documentNode) || {};

  if (selectionResult.length && selectionResult.length > 0) {
    const firstNode = selectionResult[0];
    return firstNode;
  }

  return null;
}

module.exports = {
  selectFirst: selectFirst,
  selectElementNodeById: selectElementNodeById
};
