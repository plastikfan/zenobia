
const Jaxine = require('jaxine');

const buildOptions = {
  id: 'name',
  descendants: {
    by: 'index',
    throwIfCollision: true,
    throwIfMissing: true
  }
};

const argumentOptionsMap = {
  'DEFAULT': {},
  'Argument': {
    id: 'name'
  },
  'Arguments': buildOptions
};

const getArgumentOptions = (el) => {
  return (argumentOptionsMap[el] || argumentOptionsMap['DEFAULT']);
};

/**
 * @function buildArguments
 * @description: Builds all Argument definitions which appear in the XML config at
 *    /Application/Cli/Arguments/Argument.
 *
 * @param {XMLNode} argumentsNode
 * @returns a native object representing all Argument definitions available for use by
 *    the commands defined in config.
 */
function buildArguments (argumentsNode) {
  let parentNode = argumentsNode.parentNode;
  let argumentNodes = Jaxine.buildElement(argumentsNode, parentNode, getArgumentOptions);

  return argumentNodes;
}

module.exports = {
  buildArguments: buildArguments
};
