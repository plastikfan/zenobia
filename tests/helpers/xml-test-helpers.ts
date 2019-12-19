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
export function selectElementNodeById (elementName: string, id: string, name: string, parentNode: Node) {
  const elementNode = xpath.select(`.//${elementName}[@${id}="${name}"]`, parentNode, true);

  return elementNode;
}
