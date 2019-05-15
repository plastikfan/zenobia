
const Jaxine = require('jaxine');
const Select = require('../utils/xml/selection-utilities');
const R = require('ramda');
const defaultSpec = Jaxine.specs.default;

// Ideally, this spec would be a throwing spec. However, the facility for Jaxine to perform indexBy/groupBy
// came after this facility was built into Zenobia. Retro fitting this requires a lot of working re-writing
// tests, for which the payback is little to none.
//
const buildOptions = {
  id: 'name',
  recurse: 'inherits',
  discards: ['inherits', 'abstract'],
  descendants: {
    by: 'index',
    throwIfCollision: false,
    throwIfMissing: false
  }
};

const expressionOptionsMap = {
  'DEFAULT': {
    id: 'name'
  },
  'Expression': buildOptions,
  'Expressions': buildOptions
};

const getExpressionOptions = (el) => {
  return (expressionOptionsMap[el] || expressionOptionsMap['DEFAULT']);
};

/**
 * @function buildExpressionGroup
 * @description: Builds all the expressions for a named expression group.
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

    const getOptions = (el) => {
      return ((el === 'Expressions') || (el === 'Expression')) ? options : {};
    };

    if (expressionsGroupNode) {
      let expressionsGroup = Jaxine.buildElement(expressionsGroupNode, parentNode, getOptions);
      return expressionsGroup;
    } else {
      throw new Error(`Bad configuration: No <Expressions "${id}"="${groupName}">s found`);
    }
  } else {
    throw new Error('No "id" field specified in Expression(s) option');
  }
}

/**
 * @function express
 * @description: Composes the regexs from the Pattern elements. To avoid excessive building
 *    of regexs, they are memoized and stored as a new property (reg) on object representing the
 *    Expression element. Also, the "eg" attributes are collated and stored in the Expression
 *    object as an "eg" property.
 *
 * @param {Object} expressions: a map object keyed by regular expression name (<Expression @name>)
 *    which maps to the corresponding expression object previously built.
 * @param {Object} options: can contain:
 *  - "id": attribute through which an element is identified (must be unique and
 *    normally defaults to "name")
 */
function express (expressions, options) {

}

/**
 * @function evaluate
 * @description: Builds the regular expressions out of fragments defined in Expression/Pattern.
 *
 * @param {Object} expression: Plain JSON object that represents the built Expression element,
 *    where each pattern cn contain either a text field, or a link field, but not both. Also
 *    the Expression object may have an eg field, which must also be collated. The
 *    Expression object is of the form:
 *
 *'common-album-expression': {
   'name': 'common-album-expression',
   '_': 'Expression',
   '_children': [{
         'eg': 'MOVIE',
         '_': 'Pattern',
         '_text': '(?:MOVIE)?'
       }, {
         'eg': ' - ',
         'link': 'spaced-dash-expression',
         '_': 'Pattern'
       }, { ...
 * @param {String} expressionName: the name of the expression to be built
 * @param {Object} expressions: a map object keyed by regular expression name (<Expression @name>)
 *    which maps to the corresponding expression object previously built.
 * @param {String[]} [previouslySeen=[]] : Used internally to guard against circular references,
 *    via Pattern @link.
 * @throws exceptions in the following circumstances:
 *    - expressionName is falsey
 *    - id missing from options
 *    - no Expression for the expressionName specified
 *    - Expression element has no child Pattern elements defined
 *    - Expression contain both local text and a link attribute
 *    - Circular reference detected via link attribute
 *    - Expression does not contain either local text or a link attribute
 *    - Regular expression built is not valid
 * @returns: a new version of expression with new fields populated
 */
function evaluate (expressionName, expressions, previouslySeen = []) {
  if (!expressionName) {
    throw new Error('Expression name not specified');
  }

  const expressionId = getExpressionOptions('Expression') || '';
  if (expressionId === '') {
    throw new Error('No identifier found for Expression');
  }

  if (!R.includes(expressionName, R.keys(expressions))) {
    throw new Error(`Expression (${expressionId}="${expressionName}") not found`);
  }
  const expression = expressions[expressionName];
  const patterns = R.filter((o) => R.equals(R.prop('_', o), 'Pattern'),
    R.prop(defaultSpec.labels.descendants, expression));

  if (R.isEmpty(patterns)) {
    throw new Error(`Expression (${expressionId}="${expressionName}") does not contain any Patterns`);
  }

  const textLabel = defaultSpec.labels.text;

  // Build the regular expression text
  //
  const expressionText = R.reduce((acc, pattern) => {
    const text = R.cond([
      [R.both(R.has(textLabel), R.has('link')), () => {
        throw new Error(`Expression (${expressionId}="${expressionName}"), contains a Pattern with both a link and text`);
      }],
      [R.has(textLabel), R.prop(textLabel)],
      [R.has('link'), (o) => {
        const link = R.prop('link', o);
        if (R.includes(link, previouslySeen)) {
          throw new Error(`Circular reference detected, element '${link}', has already been encountered.`);
        }

        const linkedExpression = evaluate(link, expressions, R.append(expressionName, previouslySeen));
        const linkedText = R.prop('$regexp', linkedExpression).source;
        return linkedText;
      }],
      [R.T, () => {
        throw new Error(`Expression (${expressionId}="${expressionName}") contains a Pattern without a link or regex text`);
      }]
    ])(pattern);
    return acc + text;
  }, '')(patterns);

  let updatedExpression;
  try {
    updatedExpression = R.set(R.lensProp('$regexp'), new RegExp(expressionText))(expression);
    // console.log(`evaluate - TEXT: ${expressionText}`);
  } catch (error) {
    throw new Error(`Expression (${expressionId}="${expressionName}") invalid regular expression: ${expressionText}`);
  }

  // Build the collection of named capturing groups. We can do this by parsing the collated
  // regular expression text (rather than depending on a user specified definition of a "groups"
  // attribute). Named capturing groups of the form: ?<groupName>
  //
  const captureGroupsRegExp = new RegExp('\\?<(?<captureGroup>[a-zA-Z]+)>', 'g');
  let captures = [];
  let capture;
  while ((capture = captureGroupsRegExp.exec(expressionText)) !== null) {
    captures = R.append(capture.groups['captureGroup'], captures);
  }

  if (!R.isEmpty(captures)) {
    updatedExpression = R.set(R.lensProp('$namedGroups'), captures)(updatedExpression);
  }

  // Now build up the "eg" text. There are 2 ways the "eg" Text can be composed:
  // 1) The single "eg" attribute instance on the Expression
  // 2) The collection of "eg" values on all of the Patterns inside the Expression
  // If Expression contains an "eg", this will be used and overrides the Pattern instances
  //    otherwise, the Patterns' "eg" instances will be collated and used.
  //
  if (R.has('eg', updatedExpression)) {
    updatedExpression = R.set(R.lensProp('$eg'), R.prop('eg', updatedExpression))(updatedExpression);
  } else {
    // Do Pattern eg collation ...
    //
    const egPatterns = R.filter(R.has('eg'))(patterns);

    const egText = R.reduce((acc, pattern) => {
      const text = R.prop('eg')(pattern);
      return acc + text;
    }, '')(egPatterns);

    updatedExpression = R.set(R.lensProp('$eg'), egText)(updatedExpression);
    // console.log(`evaluate - egTEXT: ${egText}`);
  }
  return updatedExpression;
}

module.exports = {
  buildExpressionGroup: buildExpressionGroup,
  express: express,
  evaluate: evaluate,
  getExpressionOptions: getExpressionOptions
};
