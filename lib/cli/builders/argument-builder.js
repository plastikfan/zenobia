
const R = require('ramda');
const Jaxine = require('jaxine');

/**
 * @function buildArguments
 * @description: Builds all Argument definitions which appear in the XML config at
 *    /Application/Cli/Arguments/Argument.
 *
 * @param {XMLNode} argumentsNode
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @returns a native object representing all Argument definitions available for use by
 *    the commands defined in config.
 */
function buildArguments (argumentsNode, getOptions) {
  let parentNode = argumentsNode.parentNode;
  let argumentNodes = Jaxine.buildElement(argumentsNode, parentNode, getOptions);
  let normalisedArguments = normaliseArguments(argumentNodes);

  return normalisedArguments;
}

/**
 * @function normaliseArguments
 * @description: Normalises the argument definitions as built by the generic builder.The
 *    generic builder composes the arguments as a list in an array as its children.The
 *    arguments object is not in an easily consumable form.The normalisation process
 *    iterates the member of the "_children" array, and turns that array into a map keyed
 *    by the argument name.This allows an argument to be looked up by name.
 *
 * @param {Object} commandArguments: The native object built by the generic builder that represents
 *    all the command argument definitions (Argument). The format of the input is illustrated
 *    by the following example (contrast this with the example in the return result) eg:
 *    (Note how "_children" is just an array)
 * {
  'type': 'string',
  '_': 'Arguments',
  '_children': [{
    'name': 'filesys',
    'alias': 'fs',
    'optional': 'true',
    'describe': 'The file system as defined in config as FileSystem',
    '_': 'Argument'
  }, {
    'name': 'path',
    'alias': 'p',
    'optional': 'true',
    'describe': 'Full path. The path specified has the highest priority. All the other fields have to make sense in content of the path.',
    '_': 'Argument'
  }, {
 *
 * @returns {Object} Native object with arguments in "_children" in normalised form eg:
 *    (Note how "filesys" is a key into it argument definition)
 *{
   'type': 'string',
   '_': 'Arguments',
   '_text': 'Implemented via a member plugin to resolve member into members 1-4?',
   '_children': {
     'filesys': {
       'name': 'filesys',
       'alias': 'fs',
       'optional': 'true',
       'describe': 'The file system as defined in config as FileSystem',
       '_': 'Argument'
     },
     'path': {
       'name': 'path',
       'alias': 'p',
       'optional': 'true',
       'describe': 'Full path. The path specified has the highest priority. All the other fields have to make sense in content of the path.',
       '_': 'Argument'
     },
     ...
 */
function normaliseArguments (commandArguments) {
  let normalisedArguments = R.omit(['_children'], commandArguments);
  let children = commandArguments['_children'];
  let normalisedChildren = {};

  R.forEach((child) => {
    if (child.name && child.name !== '') {
      if (!R.includes(child.name, R.keys(normalisedChildren))) {
        normalisedChildren[child.name] = child;
      } else {
        let existingArg = normalisedChildren[child.name];
        throw new Error(
          `Argument "${child.name}" (${JSON.stringify(child)}) already defined as "${JSON.stringify(existingArg)}"`);
      }
    } else {
      throw new Error(`Found Argument without a valid name: "${JSON.stringify(child)}"`);
    }
  }, children);
  normalisedArguments['_children'] = normalisedChildren;

  return normalisedArguments;
}

module.exports = {
  buildArguments: buildArguments
};
