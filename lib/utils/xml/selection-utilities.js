const xpath = require('xpath');
const R = require('ramda');

function selectFirstElementNode (document, options = {}) {
  let elementNode = null;
  let message = null;

  if (options.query === undefined) {
    message = '"query" missing from options';
    throw new Error(message);
  } else if (typeof options.query !== 'string') {
    message = 'Invalid "query" on options, not a string';
    throw new Error(message);
  }
  const nodes = xpath.select(options.query, document);

  if (nodes !== null) {
    if (options.single !== undefined) {
      if (nodes.length === 1) {
        elementNode = nodes[0];
      } else if (nodes.length > 0) {
        message = `Bad configuration: Found multiple elements, but "single" specified for query: "${options.query}".`;
      } else {
        message = `Bad configuration: Missing element for query: "${options.query}".`;
      }
    } else {
      if (nodes.length > 0) {
        elementNode = nodes[0];
      }
    }
  }

  return elementNode;
}

function selectFirst (query, contextNode) {
  const nodeResult = xpath.select(query, contextNode) || {};

  if (nodeResult.length && nodeResult.length > 0) {
    const singleNode = nodeResult[0];
    return singleNode;
  }

  return null;
}

function collectLocalAttributes (contextNode) {
  const attributeNodes = xpath.select('@*', contextNode) || [];

  // Attribute nodes have name and value properties on them
  //
  const nvpair = R.props(['name', 'value']);
  const bag = R.fromPairs(R.map(nvpair, attributeNodes));

  return bag;
}

function selectElementNodeById (elementName, id, name, parentNode) {
  const elementResult = xpath.select(`.//${elementName}[@${id}="${name}"]`, parentNode) || {};
  let elementNode = {};

  if (elementResult && elementResult.length > 0) {
    elementNode = elementResult[0];
  }

  return elementNode;
}

module.exports = {
  selectFirstElementNode: selectFirstElementNode,
  selectFirst: selectFirst,
  collectLocalAttributes: collectLocalAttributes,
  selectElementNodeById: selectElementNodeById
};
