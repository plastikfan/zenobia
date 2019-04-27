
const xpath = require('xpath');
const R = require('ramda');
const Jaxine = require('jaxine');
const Select = require('../../utils/xml/selection-utilities');

/**
 * @function buildNamedCommand
 * @description: Builds the specific concrete command which appear in the XML config at
 *    /Application/Cli/Commands. Also performs Command specific checking
 *    like ensuring that any Command built does not include both "describe"
 *    "abstract" attributes (ie this scenario would imply an abstract command
 *    is going to be invoked directly, which can't happen.). A concrete Command
 *    is one that does not contain an "abstract" attribute. The "inherits" array
 *    is converted from a csv as its defined in config to an array. The Arguments
 *    built are non normalised, so will contain ArgumentRefs which subsequently
 *    need to be resolved into their definitions.
 * @param {XMLNode} commandsNode: the XML node which is the immediate parent of
 *    the Command available at: /Application/Cli/Commands.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @returns {Array of single Object} representing the concrete Command defined eg:
 *[{
     'name': 'fix',
     'source': 'filesystem-source',
     '_': 'Command',
     '_children': [{
           '_': 'Arguments',
           '_children': [{
             'name': 'loglevel',
             '_': 'ArgumentRef'
           }, {
             'name': 'logfile',
             '_': 'ArgumentRef'
           }]
         }, {
           '_': 'Arguments',
           '_children': [{
             'name': 'whatif',
             '_': 'ArgumentRef'
           }]
         }, {
  ...]
 */
function buildNamedCommand (commandName, commandsNode, getOptions) {
  const commandNode = Select.selectElementNodeById('Command', 'name', commandName, commandsNode);

  if (commandNode || commandNode !== {}) {
    let element = Jaxine.buildElement(commandNode, commandsNode, getOptions);
    element = postBuildCommand(element);

    return [element];
  } else {
    throw new Error(`Failed to find Command with name: "${commandName}"`);
  }
}

/**
 * @function buildCommands
 * @description: Builds all concrete commands which appear in the XML config at
 *    /Application/Cli/Commands. Also performs Command specific checking
 *    like ensuring that any Command built does not include both "describe"
 *    "abstract" attributes (ie this scenario would imply an abstract command
 *    is going to be invoked directly, which can't happen.). A concrete Command
 *    is one that does not contain an "abstract" attribute. The "inherits" array
 *    is converted from a csv as its defined in config to an array. The Arguments
 *    built are non normalised, so will contain ArgumentRefs which subsequently
 *    need to be resolved into their definitions.
 *
 * @param {XMLNode} commandsNode: the XML node which is the immediate parent of
 *    all Commands available at: /Application/Cli/Commands.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options (@property:"id", @property:"recurse", @property: "discards").
 * @returns {Array} containing all concrete Commands defined eg:
 *[{
     'name': 'fix',
     'source': 'filesystem-source',
     '_': 'Command',
     '_children': [{
           '_': 'Arguments',
           '_children': [{
             'name': 'loglevel',
             '_': 'ArgumentRef'
           }, {
             'name': 'logfile',
             '_': 'ArgumentRef'
           }]
         }, {
           '_': 'Arguments',
           '_children': [{
             'name': 'whatif',
             '_': 'ArgumentRef'
           }]
         }, {
 */
function buildCommands (commandsNode, getOptions) {
  const concreteCommands = xpath.select(
    './/Command[not(@abstract)]',
    commandsNode
  ) || {};

  if (concreteCommands.length === 0) {
    throw new Error('Bad configuration: No Commands found');
  }

  let commands = R.map((cmdNode) => {
    return postBuildCommand(Jaxine.buildElement(cmdNode, commandsNode, getOptions));
  }, concreteCommands);

  return commands;
}

/**
 * @function postBuildCommand
 * @description: Performs all actions required after the element is built by jaxine
 *
 * @param {Object} element
 * @returns {Object} in a pre normalised form, ie, it still needs to be normalised
 *    via normaliseCommands.
 */
function postBuildCommand (element) {
  // Transform the @inherits attribute from a csv into an array
  //
  const keys = R.keys(element);
  if (R.includes('inherits', keys)) {
    element['inherits'] = R.split(',', element['inherits']);
  }

  // Abstract commands can't have a description
  //
  if (R.includes('abstract', keys) && R.includes('describe', keys)) {
    throw new Error('Abstract commands can\'t have a describe attribute.');
  }

  return element;
}

/**
 * @function normaliseCommands
 * @description: Normalises all commands. When built by jaxine, because commands can be
 *    composed of other commands due to inheritance, the Arguments and ArgumentGroups
 *    maybe spread over multiple entries.
 *
 * @param {Array} commands in the following form:
 *[{
     'name': 'with',
     '_': 'ArgumentRef'
   }, {
     'name': 'put',
     '_': 'ArgumentRef'
   }, { ...
 * @param {Object} info normalisation information, which contains "commandArguments" being
 *    a reference to a generic format object built by jaxine whose top level
 *    "_children" attribute contains a map keyed by argument name of ArgumentDefs, eg:
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
       'describe': 'Full path. The path specified has the highest priority.',
       '_': 'Argument'
     },
     ...
 * @returns
 */
function normaliseCommands (commands, info) {
  return R.map((command) => normaliseCommand(command, info), commands);
}

/**
 * @function normaliseCommand
 * @description: Normalises a single command. Normalisation, collates children of
 *    the same element types together.So the "_children" of the Commands are combined.
 *    "_children" is a map of the Element type (in this case Arguments or ArgumentGroups)
 *    to their respective collection. Since Arguments need to be looked up by name,
 *    the "Arguments" entry will map to another map keyed by "name" of the Argument. Since
 *    "ArgumentGroups" are anonymous (they don't have identifier, nor do they need it,
 *    because all any client needs to do with an ArgumentsGroup collection is to iterate it),
 *    the value it stores is an Array: eg:
 *'ArgumentGroups': [{
     '_': 'Conflicts',
     '_children': [{
       'name': 'loglevel',
       '_': 'ArgumentRef'
     }, {
       'name': 'logfile',
       '_': 'ArgumentRef'
     }]
   }, {
     '_': 'Conflicts',
     '_children': [{
           'name': 'name', ...
 *
 * @param {Object} command: The native Command object with unresolved Arguments eg:
 *{
   'name': 'rename',
   'source': 'filesystem-source',
   '_': 'Command',
   '_children': [{
         '_': 'Arguments',
         '_children': [{
           'name': 'with',
           '_': 'ArgumentRef'
         }, {
           'name': 'put',
           '_': 'ArgumentRef'
         }]
       }, {
         '_': 'Arguments',
         '_children': [{
           'name': 'loglevel',
           '_': 'ArgumentRef'
         }, {
           'name': 'logfile',
           '_': 'ArgumentRef'
         }]
       }, {
 * @param {Object} info normalisation information, which contains "commandArguments" being
 *    a reference to a generic format object built by jaxine whose top level
 *    "_children" attribute contains a map keyed by argument name of ArgumentDefs.
 * @returns A native Command object with resolved ArgumentDefs eg:
 *{
   'name': 'rename',
   'source': 'filesystem-source',
   '_': 'Command',
   'describe': 'Rename galleries according to arguments specified.',
   '_children': {
     'Arguments': {
       'with': {
         'name': 'with',
         '_': 'Argument',
         'alias': 'w',
         'optional': 'true',
         'describe': 'replace with'
       },
       'put': {
         'name': 'put',
         '_': 'Argument',
         'alias': 'w',
         'optional': 'true',
         'describe': 'update existing'
       },
 */
function normaliseCommand (command, info) {
  let normalisedCommand = normaliseChildren(command);
  let commandWithResolvedArguments = resolveArguments(normalisedCommand, info);

  return commandWithResolvedArguments;
}

/**
 * @function normaliseChildren
 * @description: Performs normalisation on the children of Command (See the description of
 *    normaliseCommand for more info.)
 *
 * @param {Object} command: The command native object to normalise.
 * @returns a native normalised object (with unresolved Arguments) eg:
 *{
   'name': 'rename',
   'source': 'filesystem-source',
   '_': 'Command',
   'describe': 'Rename galleries according to arguments specified.',
   '_children': {
     'Arguments': [{
       'name': 'with',
       '_': 'ArgumentRef'
     }, {
       'name': 'put',
       '_': 'ArgumentRef'
      ...
     }, {
       'name': 'tree',
       '_': 'ArgumentRef'
     }],
     'ArgumentGroups': [{
           '_': 'Conflicts',
           '_children': [{
             'name': 'loglevel',
             '_': 'ArgumentRef'
           }, {
             'name': 'logfile',
             '_': 'ArgumentRef'
           }]
         }, {
      ...
 */
function normaliseChildren (command) {
  let groupByElement = R.groupBy((child) => {
    return child['_'];
  });

  let reduceByChildren = R.reduce((acc, value) => {
    return R.concat(acc, value['_children']);
  }, []);

  let normalisedCommand = R.omit(['_children'], command);

  let children = command['_children'];
  let renameGroupByElementChildrenObj = groupByElement(children);
  let adaptedChildren = {};

  R.forEachObjIndexed((value, key) => {
    if (!R.includes(key, R.keys(adaptedChildren))) {
      adaptedChildren[key] = reduceByChildren(value);
    } else {
      throw new Error(`Command "${key}" already defined."`);
    }
  }, renameGroupByElementChildrenObj);

  // Now punch in the new children
  //
  normalisedCommand['_children'] = adaptedChildren;
  return normalisedCommand;
}

/**
 * @function resolveArguments
 * @description: Resolves all ArgumentRefs to Arguments using the info object passed in.
 *
 * @param {Object} command: The native command object with unresolved Arguments (ie, the arguments
 *    are all just ArgumentRef's)
 * @param {Object} info normalisation information, which contains "commandArguments" being
 *    a reference to a generic format object built by jaxine whose top level
 *    "_children" attribute contains a map keyed by argument name of ArgumentDefs.
 * @returns A native Command object with resolved Arguments eg:
 *{
   'name': 'rename',
   'source': 'filesystem-source',
   '_': 'Command',
   'describe': 'Rename galleries according to arguments specified.',
   '_children': {
     'Arguments': {
       'with': {
         'name': 'with',
         '_': 'Argument',
         'alias': 'w',
         'optional': 'true',
         'describe': 'replace with'
       },
       'put': {
         'name': 'put',
         '_': 'Argument',
         'alias': 'w',
         'optional': 'true',
         'describe': 'update existing'
       },
  ...
     'ArgumentGroups': [{
           '_': 'Conflicts',
           '_children': [{
             'name': 'loglevel',
             '_': 'ArgumentRef'
           }, {
             'name': 'logfile',
             '_': 'ArgumentRef'
           }]
         }, {
  ...
 */
function resolveArguments (command, info) {
  const { commandArguments } = info;
  const argumentDefsChildren = commandArguments['_children'];

  if (R.where({ '_children': R.is(Object) }, command)) {
    let children = command['_children'];

    if (R.where({ 'Arguments': R.is(Array) }, children)) {
      let argumentRefs = children['Arguments'];

      // We can't use R.map, because we lose out on our index-ability (R.map yields an array!)
      //
      let resolved = {};
      R.forEach((argRef) => {
        if (argRef.name && R.includes(argRef.name, R.keys(argumentDefsChildren))) {
          // Now merge the Ref with the Def, where the Def takes precedence and
          // ensuring that the element type '_' is changed from "ArgumentRef" to
          // "Argument".
          //
          resolved[argRef.name] = R.mergeAll([argRef, argumentDefsChildren[argRef.name]]);
        } else {
          throw new Error(`command-builder.resolveArguments: No definition available for argument: "${argRef.name}"`);
        }
      }, argumentRefs);

      let resolvedValues = R.values(resolved);
      let argRefValues = R.values(argumentRefs);

      let joined = R.innerJoin((res, argsRef) => res.name === argsRef.name,
        resolvedValues, argRefValues);

      if (joined.length === R.keys(resolved).length) {
        command = R.assocPath(['_children', 'Arguments'], resolved, command);
      } else {
        // TODO: Perform a cross reference to find out which argument definition
        // is missing.
        //
        throw new Error(
          `command-builder.resolveArguments: Argument definition missing for command: "${command.name}"`);
      }
    } else {
      throw new Error(`command-builder.resolveArguments: "Arguments" is missing from "_children" of command: "${command.name}"`);
    }
  } else {
    throw new Error(`command-builder.resolveArguments: "_children" is missing from command: "${command.name}"`);
  }

  return command;
}

module.exports = {
  buildNamedCommand: buildNamedCommand,
  buildCommands: buildCommands,
  normaliseCommands: normaliseCommands
};
