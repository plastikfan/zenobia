
/// <reference path='../../declarations.d.ts'/>

import * as Jaxine from 'jaxine';

const buildOptions = {
  id: 'name',
  descendants: {
    by: 'index',
    throwIfCollision: true,
    throwIfMissing: true
  }
};

const argumentOptionsMap: any = {
  DEFAULT: {},
  Argument: {
    id: 'name'
  },
  Arguments: buildOptions
};

const getArgumentOptions = (el: string): {} => {
  return (argumentOptionsMap[el] || argumentOptionsMap.DEFAULT);
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
export function buildArguments (argumentsNode: Node) {
  const parentNode = argumentsNode.parentNode;
  const argumentNodes = Jaxine.buildElement(argumentsNode, parentNode, getArgumentOptions);

  return argumentNodes;
}
