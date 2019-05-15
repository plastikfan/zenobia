
const xpath = require('xpath');
const R = require('ramda');
const Impl = require('./expression-builder.impl');
const defaultSpec = require('jaxine').specs.default;

/**
 * @function: buildExpressions
 * @description: Builds all regular expression in the document (parentNode). Expressions
 *  that are contained inside an Expression element, are pp
 *
 * @param {XMLNode} parentNode: the xpath node which is the parent under which the requested
 * expression group should reside.
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
   of the Expressions group are the individual regular expressions and are contained inside
   an array.
 */
function buildExpressions (parentNode) {
  const expressionsOptions = Impl.getExpressionOptions('Expressions');
  if (!expressionsOptions) {
    throw new Error('Couldn\'t get options for "Expressions" element');
  }
  const { id = '' } = expressionsOptions;

  validateId(parentNode, ['Expression', 'Expressions'], Impl.getExpressionOptions);

  let expressionGroupNodes = xpath.select(
    `.//Expressions[@${id}]`,
    parentNode
  );

  if (expressionGroupNodes.length === 0) {
    throw new Error('Bad configuration: No <Expressions>s found');
  }

  let expressionGroups = {};

  R.forEach((groupNode) => {
    const groupName = groupNode.getAttribute(id);
    const group = Impl.buildExpressionGroup(parentNode, groupName, expressionsOptions);

    if (!R.includes(groupName, R.keys(expressionGroups))) {
      expressionGroups[groupName] = group;
    } else {
      throw new Error(`Expressions with ${id}="${groupName}" already defined`);
    }
  }, expressionGroupNodes);

  return normalise(expressionGroups, Impl.getExpressionOptions);
}

/**
 * @function: validateId
 * @description: Checks that id's of named elements are valid
 *
 * @param {XMLNode} parentNode: the xpath node which is the parent under which the requested
 * @param {Array} elementNames: Array containing the names of elements to be validated
 * expression group should reside.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options ("id", "recurse", "discards").
 * @throws: if id anomaly is found
 */
function validateId (parentNode, elementNames, getOptions) {
  if (elementNames.length && elementNames.length > 0) {
    elementNames.forEach((elementName) => {
      const options = getOptions(elementName);
      const {
        id = ''
      } = options;

      if (id !== '') {
        const elementsWithoutIdResult = xpath.select(`.//${elementName}[not(@${id})]`, parentNode);

        if (elementsWithoutIdResult.length > 0) {
          const first = elementsWithoutIdResult[0];
          throw new Error(`Found at least 1 ${elementName} without ${id} attribute, first: ${first}`);
        }

        const elementsWithEmptyIdResult = xpath.select(`.//${elementName}[@${id}=""]`, parentNode);

        if (elementsWithEmptyIdResult.length > 0) {
          const first = elementsWithEmptyIdResult[0];
          throw new Error(`Found at least 1 ${elementName} with empty ${id} attribute, first: ${first}`);
        }
      } else {
        throw new Error(`No "id" field specified in ${elementName} option`);
      }
    });
  }
}

/**
 * @function: normalise
 * @description: The XML representation of regular expressions in the config allows
 *    regular expressions to be grouped. This means that when jaxine is used to
 *    convert the to JSON the result is not a particularly useful for clients to
 *    interact with. Essentially all clients need is the ability to specify a
 *    regular expression name and get back an expression. However, the normalise only
 *    creates a map of expression names to expression objects. These expression objects
 *    here are not built into fully fledged regular expressions.
 *
 * @param {Object} expressionGroups: Plain JSON object representing all expressions
 *    in all Expressions groups.
 * @param {callback(el:string)} getOptions: a function that returns the element builder
 *    options ("id", "recurse", "discards").
 * @throws: if duplication definitions found for a regular expression name or id is
 *    not defined for 'Expression' via getOptions.
 * @returns {Object}: Representing normalised expressions which is simply a map object,
 *    from regular expression name to the regular expression object (not regex!).
 */
function normalise (expressionGroups, getOptions) {
  const expressionId = getOptions('Expression').id;
  if (!expressionId) {
    throw new Error('No identifier found for Expression');
  }

  // Each expression sub-group is already in a normalised form of sorts. The only problem we
  // have to deal with here is the fact that there is a single map per expression group. We
  // have no need to for the sub-group structure, so effectively what we need t do is combine
  // several map objects into one and detecting any potential collisions.
  //
  const combinedExpressionGroupsMap = R.reduce((combinedAcc, groupName) => {
    const expressions = R.prop(defaultSpec.labels.descendants, expressionGroups[groupName]);
    const alreadyDefined = R.intersection(R.keys(expressions), R.keys(combinedAcc));
    if (!R.isEmpty(alreadyDefined)) {
      throw new Error(`These expressions have already been defined: "${R.join(', ', alreadyDefined)}"`);
    }

    const expressionsForThisGroupMap = R.reduce((thisGroupAcc, exprName) => {
      if (R.includes(exprName, R.keys(thisGroupAcc))) {
        throw new Error(`Expression: '${exprName}' already defined`);
      }
      thisGroupAcc[exprName] = expressions[exprName];
      return thisGroupAcc;
    }, {})(R.keys(R.prop(defaultSpec.labels.descendants, expressionGroups[groupName])));

    return R.mergeAll([combinedAcc, expressionsForThisGroupMap]);
  }, {})(R.keys(expressionGroups));

  return combinedExpressionGroupsMap;
}

module.exports = {
  buildExpressions: buildExpressions
};

// const DATA = `<?xml version="1.0"?>
//   <Application name="pez">
//     <Expressions name="test-expressions">
//       <Expression name="single-digit-day-no-expression">
//         <Pattern><![CDATA[(?<d>[1-3]|[0-3]\\d?)]]></Pattern>
//       </Expression>
//       <Expression name="mmm-month-no-expression">
//         <Pattern><![CDATA[(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])]]></Pattern>
//       </Expression>
//       <Expression name="y2k-years-expression">
//         <Pattern><![CDATA[(?<year>20[0-2]\\d)]]></Pattern>
//       </Expression>
//     </Expressions>
//     <Expressions name="test-expressions-2">
//       <Expression name="single-digit-day-no-expression-2">
//         <Pattern><![CDATA[(?<d>[1-3]|[0-3]\\d?)]]></Pattern>
//       </Expression>
//       <Expression name="mmm-month-no-expression-2">
//         <Pattern><![CDATA[(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])]]></Pattern>
//       </Expression>
//     </Expressions>
//   </Application>`;

// const normalise_RESULT = {
//   'single-digit-day-no-expression': {
//     'name': 'single-digit-day-no-expression',
//     '_': 'Expression',
//     '_children': [{
//       '_': 'Pattern',
//       '_text': '(?<d>[1-3]|[0-3]\\d?)'
//     }]
//   },
//   'mmm-month-no-expression': {
//     'name': 'mmm-month-no-expression',
//     '_': 'Expression',
//     '_children': [{
//       '_': 'Pattern',
//       '_text': '(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])'
//     }]
//   },
//   'y2k-years-expression': {
//     'name': 'y2k-years-expression',
//     '_': 'Expression',
//     '_children': [{
//       '_': 'Pattern',
//       '_text': '(?<year>20[0-2]\\d)'
//     }]
//   },
//   'single-digit-day-no-expression-2': {
//     'name': 'single-digit-day-no-expression-2',
//     '_': 'Expression',
//     '_children': [{
//       '_': 'Pattern',
//       '_text': '(?<d>[1-3]|[0-3]\\d?)'
//     }]
//   },
//   'mmm-month-no-expression-2': {
//     'name': 'mmm-month-no-expression-2',
//     '_': 'Expression',
//     '_children': [{
//       '_': 'Pattern',
//       '_text': '(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])'
//     }]
//   }
// };
