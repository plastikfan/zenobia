
const Jaxine = require('jaxine');
const Select = require('../utils/xml/selection-utilities');
const R = require('ramda');

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
  const fromPatterns = R.memoizeWith(R.identity, (name) => {

  });

  const result = R.map((expr) => {

  })(expressions);

  return result;
}

/**
 * @function evaluate
 * @description:
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
 * @param {Object} options: can contain:
 *  - "id": attribute through which an element is identified (must be unique and
 *    normally defaults to "name")
 * @param {String[]} [previouslySeen=[]] : Used internally to guard against circular references,
 *    via Pattern @link.
 * @throws exceptions in the following circumstances:
 *    - expressionName is falsey
 *    - id missing from options
 *    - no Expression for the expressionName specified
 *    - Expression element has not child Pattern elements defined
 *    - Expression contain both local text and a link attribute
 *    - Circular reference detected via link attribute
 *    - Expression does not contain either local text or a link attribute
 *    - Regular expression built is not valid
 * @returns: a new version of expression with new fields populated
 */
function evaluate (expressionName, expressions, options, previouslySeen = []) {
  if (!expressionName) {
    throw new Error('Expression name not specified');
  }
  const expressionId = options.id || '';
  console.log(`===> EXPRESSION-ID: ${expressionId}`);
  if (expressionId === '') {
    throw new Error('No identifier found for Expression');
  }

  if (!R.includes(expressionName, R.keys(expressions))) {
    throw new Error(`Expression (${expressionId}="${expressionName}") not found`);
  }
  const expression = expressions[expressionName];

  // !!
  // 'content-album-name-expression': {
  //   'name': 'content-album-name-expression',
  //   'eg': "The-Devil's-1st-Daughter!",
  //   '_': 'Expression',
  //   '_children': [{
  //     '_': 'Pattern',
  //     '_text': "[a-zA-Z0-9\\-\\'\\.!]+"
  //   }]
  // },

  const patterns = R.filter((o) => R.equals(R.prop('_', o), 'Pattern'), R.prop('_children', expression));

  if (R.isEmpty(patterns)) {
    throw new Error(`Expression (${expressionId}="${expressionName}") does not contain any Patterns`);
  }

  console.log(`PATTERNS: ${JSON.stringify(patterns)}`);

  // Build the regular expression text
  //
  const expressionText = R.reduce((acc, pattern) => {
    const text = R.cond([
      [R.both(R.has('_text'), R.has('link')), () => {
        throw new Error(`Expression (${expressionId}="${expressionName}"), contains a Pattern with both a link and text`);
      }],
      [R.has('_text'), R.prop('_text')],
      [R.has('link'), (o) => {
        const link = R.prop('link', o);
        if (R.includes(link, previouslySeen)) {
          throw new Error(`Circular reference detected, element '${link}', has already been encountered.`);
        }

        const linkedExpression = evaluate(link, expressions, options, R.append(expressionName, previouslySeen));
        const linkedText = R.prop('$regexp', linkedExpression).source;
        return linkedText;
      }],
      [R.T, () => {
        throw new Error(`Expression (${expressionId}="${expressionName}") contains a Pattern without a link or regex text`);
      }]
    ])(pattern);
    return acc + text;
  }, '')(patterns);

  // Regular Expression text defined may not be valid
  //
  let updatedExpression = R.set(R.lensProp('$regexp'), new RegExp(expressionText))(expression);
  console.log(`evaluate - TEXT: ${expressionText}`);

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
    console.log(`evaluate - egTEXT: ${egText}`);
  }
  return updatedExpression;
}

module.exports = {
  buildExpressionGroup: buildExpressionGroup,
  express: express,
  evaluate: evaluate
};

const K = {
  "person's-name-expression": {
    'name': "person's-name-expression",
    'eg': "Ted O'Neill",
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': "[a-zA-Z\\s']+"
    }]
  },
  "content-person's-name-expression": {
    'name': "content-person's-name-expression",
    'eg': "Ted O'Neill",
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': "[a-zA-Z\\-']+"
    }]
  },
  "person's-forename-expression": {
    'name': "person's-forename-expression",
    'eg': 'Ted',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': "[a-zA-Z']+"
    }]
  },
  "album's-name-expression": {
    'name': "album's-name-expression",
    'eg': "The Devil's 1st Daughter!",
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': "[a-zA-Z0-9\\s\\'\\.!]+"
    }]
  },
  'content-album-name-expression': {
    'name': 'content-album-name-expression',
    'eg': "The-Devil's-1st-Daughter!",
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': "[a-zA-Z0-9\\-\\'\\.!]+"
    }]
  },
  "meta-body-album's-name-expression": {
    'name': "meta-body-album's-name-expression",
    'eg': "the-devil's-1st-daughter!",
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': "[a-z0-9\\-\\'\\.!]+"
    }]
  },
  'alpha-num-expression': {
    'name': 'alpha-num-expression',
    'eg': 'abc123',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '[a-zA-Z0-9]+'
    }]
  },
  'mini-salutation-expression': {
    'name': 'mini-salutation-expression',
    'eg': 'v',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '[ve]+'
    }]
  },
  'salutation-expression': {
    'name': 'salutation-expression',
    'eg': 'Vol',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '[Vol|vol|Ed|ed]'
    }]
  },
  'label-code-expression': {
    'name': 'label-code-expression',
    'eg': '99',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': 'a-zA-Z0-9{1,8}]'
    }]
  },
  'content-item-no-expression': {
    'name': 'content-item-no-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '\\d{1,4}'
    }]
  },
  'spaced-dash-expression': {
    'name': 'spaced-dash-expression',
    'eg': ' - ',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '\\s*-\\s*'
    }]
  },
  'spaced-dash-tilde-expression': {
    'name': 'spaced-dash-tilde-expression',
    'eg': ' ~ ',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '\\s*[-~]\\s*'
    }]
  },
  'common-album-expression': {
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
    }, {
      'groups': 'primaryname',
      '_': 'Pattern',
      '_text': '(?<primaryname>'
    }, {
      'eg': 'Neo Trinity',
      'link': "person's-name-expression",
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }, {
      '_': 'Pattern',
      '_text': '(?:\\('
    }, {
      'groups': 'akaname',
      '_': 'Pattern',
      '_text': '(?<akaname>'
    }, {
      'link': "person's-name-expression",
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }, {
      '_': 'Pattern',
      '_text': '\\))?'
    }, {
      'eg': ' - ',
      'link': 'spaced-dash-expression',
      '_': 'Pattern'
    }, {
      'groups': 'header',
      '_': 'Pattern',
      '_text': '(?:(?<header>'
    }, {
      'eg': 'Sentinels',
      'link': 'alpha-num-expression',
      '_': 'Pattern'
    }, {
      'eg': ', ',
      '_': 'Pattern',
      '_text': ',\\s*)?'
    }, {
      '_': 'Pattern',
      '_text': '(?<prefix>'
    }, {
      'eg': 'Vol',
      'link': 'salutation-expression',
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }, {
      '_': 'Pattern',
      '_text': '\\s+'
    }, {
      '_': 'Pattern',
      '_text': '(?<setcode>'
    }, {
      'eg': '99',
      'link': 'label-code-expression',
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }, {
      'eg': ' - ',
      'link': 'spaced-dash-expression',
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')?'
    }, {
      'groups': 'galleryname',
      '_': 'Pattern',
      '_text': '(?<galleryname>'
    }, {
      'eg': 'The One That Got Away',
      'link': "album's-name-expression",
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }, {
      '_': 'Pattern',
      '_text': '(?:'
    }, {
      'eg': ' ~ ',
      'link': 'spaced-dash-tilde-expression',
      '_': 'Pattern'
    }, {
      'groups': 'member1',
      '_': 'Pattern',
      '_text': '(?<member1>'
    }, {
      'eg': '',
      'link': "person's-name-expression",
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')(?:\\s*&\\s*'
    }, {
      'groups': 'member2',
      '_': 'Pattern',
      '_text': '(?<member2>'
    }, {
      'eg': '',
      'link': "person's-name-expression",
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')(?:\\s*&\\s*'
    }, {
      'groups': 'member3',
      '_': 'Pattern',
      '_text': '(?<member3>'
    }, {
      'eg': '',
      'link': "person's-name-expression",
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')(?:\\s*&\\s*'
    }, {
      'groups': 'member4',
      '_': 'Pattern',
      '_text': '(?<member4>'
    }, {
      'eg': '',
      'link': "person's-name-expression",
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')?)?$'
    }]
  },
  'iso-date-expression': {
    'name': 'iso-date-expression',
    'eg': '2016-06-23',
    '_': 'Expression',
    '_children': [{
      'groups': 'year,mm,dd',
      '_': 'Pattern',
      '_text': '(?<year>\\d{4})-(?<mm>\\d{2})-(?<dd>\\d{2})\\d'
    }]
  },
  'missing-date-expression': {
    'name': 'missing-date-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '9999-00-00'
    }]
  },
  'y2k-years-expression': {
    'name': 'y2k-years-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '(?<year>20[0-2]\\d)'
    }]
  },
  'mm-month-no-expression': {
    'name': 'mm-month-no-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '(?<mm>[0|1]\\d)'
    }]
  },
  'mmm-month-no-expression': {
    'name': 'mmm-month-no-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])'
    }]
  },
  'day-no-expression': {
    'name': 'day-no-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '(?<dd>[1-3]|[0-3]\\d?)'
    }]
  },
  'single-digit-day-no-expression': {
    'name': 'single-digit-day-no-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '(?<d>[1-3]|[0-3]\\d?)'
    }]
  },
  'staging-date-expression': {
    'name': 'staging-date-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '(?:'
    }, {
      'link': 'iso-date-expression',
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': '|'
    }, {
      'link': 'missing-date-expression',
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }]
  },
  'named-months-expression': {
    'name': 'named-months-expression',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '(?<mmm>['
    }, {
      '_': 'Pattern',
      '_text': 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|'
    }, {
      '_': 'Pattern',
      '_text': 'january|february|march|april|june|july|august|september|october|november|december|'
    }, {
      '_': 'Pattern',
      '_text': 'sept'
    }, {
      '_': 'Pattern',
      '_text': '])'
    }]
  },
  'meta-date-expression': {
    'name': 'meta-date-expression',
    '_': 'Expression',
    '_children': [{
      'eg': '2',
      'link': 'single-digit-day-no-expression',
      '_': 'Pattern'
    }, {
      'eg': ' ',
      '_': 'Pattern',
      '_text': '\\s'
    }, {
      'eg': 'jun',
      'link': 'mmm-month-no-expression',
      '_': 'Pattern'
    }, {
      'eg': ' ',
      '_': 'Pattern',
      '_text': '\\s'
    }, {
      'eg': '2016',
      'link': 'y2k-years-expression',
      '_': 'Pattern'
    }]
  },
  'movie-file-expression': {
    'name': 'movie-file-expression',
    'eg': 'movie.abc.the-matrix.neo.23 jun 2016.mp4',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '[\\.mov|\\.avi|\\.mp4]$'
    }]
  },
  'image-file-expression': {
    'name': 'image-file-expression',
    'eg': 'the-matrix-001.jpg',
    '_': 'Expression',
    '_children': [{
      '_': 'Pattern',
      '_text': '[\\.jpe?g|\\.png|\\.gif]$'
    }]
  },
  'short-code-expression': {
    'name': 'short-code-expression',
    '_': 'Expression',
    '_children': [{
      'link': 'alpha-num-expression',
      '_': 'Pattern'
    }]
  },
  'staging-header-expression': {
    'name': 'staging-header-expression',
    '_': 'Expression',
    '_children': [{
      'eg': 'ABC',
      'link': 'short-code-expression',
      '_': 'Pattern'
    }, {
      'eg': '-',
      '_': 'Pattern',
      '_text': '-(?:'
    }, {
      'eg': '2016',
      'link': 'y2k-years-expression',
      '_': 'Pattern'
    }, {
      'eg': '-',
      '_': 'Pattern',
      '_text': '-'
    }, {
      'eg': '06',
      'link': 'mm-month-no-expression',
      '_': 'Pattern'
    }, {
      'eg': '-',
      '_': 'Pattern',
      '_text': '-'
    }, {
      'eg': '23',
      'link': 'day-no-expression',
      '_': 'Pattern'
    }, {
      'eg': '|',
      '_': 'Pattern',
      '_text': '|'
    }, {
      'eg': '9999-00-00',
      'link': 'missing-date-expression',
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }, {
      'eg': ' - ',
      'link': 'spaced-dash-expression',
      '_': 'Pattern'
    }]
  },
  'staging-album-expression': {
    'name': 'staging-album-expression',
    'eg': 'ABC-2016-06-23 - MOVIE - Neo Trinity - Sentinels, Vol 99 - The One That Got Away ~ Tampa & Mae',
    '_': 'Expression',
    '_children': [{
      'eg': 'ABC-2016-06-23 - ',
      'link': 'staging-header-expression',
      '_': 'Pattern'
    }, {
      'eg': 'Sentinels, Vol 99 - The One That Got Away ~ Tampa & Mae',
      'link': 'common-album-expression',
      '_': 'Pattern'
    }, {
      'name': 'staging-album-yield',
      'open': '{',
      'close': '}',
      '_': 'Yield',
      '_children': [{
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '{short}-{year}-{mm-month}-{dd-day}'
      }, {
        'contains-content': '*.mov,*.avi,*.mp4',
        '_': 'Placeholder',
        '_text': '- MOVIE'
      }, {
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '-'
      }, {
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '{star-name}'
      }, {
        'is-present': 'aka-name',
        '_': 'Placeholder',
        '_text': '({aka-name}) -'
      }, {
        'is-present': 'header',
        '_': 'Placeholder',
        '_text': '{header},'
      }, {
        'is-present': 'prefix,setcode',
        '_': 'Placeholder',
        '_text': '{prefix} {setcode} -'
      }, {
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '{galleryname}'
      }, {
        'is-present': 'member1',
        '_': 'Placeholder',
        '_text': '~ {member1}'
      }, {
        'is-present': 'member2',
        '_': 'Placeholder',
        '_text': '& {member2}'
      }, {
        'is-present': 'member3',
        '_': 'Placeholder',
        '_text': '& {member3}'
      }, {
        'is-present': 'member4',
        '_': 'Placeholder',
        '_text': '& {member4}'
      }]
    }]
  },
  'archive-album-expression': {
    'name': 'archive-album-expression',
    '_': 'Expression',
    '_children': [{
      'eg': 'MOVIE - Neo Trinity - Sentinels, Vol 99 - The One That Got Away ~ Tampa & Mae',
      'link': 'common-album-expression',
      '_': 'Pattern'
    }]
  },
  'meta-salutation-expression': {
    'name': 'meta-salutation-expression',
    '_': 'Expression',
    '_children': [{
      'eg': '_',
      '_': 'Pattern',
      '_text': '^_?'
    }, {
      'eg': 'cover',
      'csv': 'meta-csv',
      '_': 'Pattern'
    }, {
      'eg': '.',
      '_': 'Pattern',
      '_text': '\\.'
    }, {
      'eg': 'movie.',
      '_': 'Pattern',
      '_text': '(movie.)?'
    }]
  },
  'meta-body-expression': {
    'name': 'meta-body-expression',
    'eg': 'abc.the-one-that-got-away.neo_v99.23 jun 2016.jpg',
    '_': 'Expression',
    '_children': [{
      'eg': 'abc',
      'link': 'short-code-expression',
      '_': 'Pattern'
    }, {
      'eg': '.',
      '_': 'Pattern',
      '_text': '\\.'
    }, {
      'eg': 'the-one-that-got-away',
      'link': "meta-body-album's-name-expression",
      '_': 'Pattern'
    }, {
      'eg': '.',
      '_': 'Pattern',
      '_text': '\\.'
    }, {
      'eg': 'neo',
      'link': "person's-forename-expression",
      '_': 'Pattern'
    }, {
      'eg': '_',
      '_': 'Pattern',
      '_text': '_'
    }, {
      '_': 'Pattern',
      '_text': '(?<mini>'
    }, {
      'eg': 's',
      'link': 'mini-salutation-expression',
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }, {
      'eg': '99',
      'link': 'label-code-expression',
      '_': 'Pattern'
    }, {
      'eg': '.',
      '_': 'Pattern',
      '_text': '\\.'
    }, {
      'eg': '99',
      'link': 'meta-date-expression',
      '_': 'Pattern'
    }, {
      'eg': '.',
      '_': 'Pattern',
      '_text': '\\.'
    }, {
      '_': 'Pattern',
      '_text': '(?<filesuffix>'
    }, {
      'eg': '.jpg',
      'link': 'image-file-expression',
      '_': 'Pattern'
    }, {
      '_': 'Pattern',
      '_text': ')'
    }]
  },
  'meta-file-expression': {
    'name': 'meta-file-expression',
    'eg': 'cover.movie.abc.the-one-that-got-away.neo_v99.23 jun 2016.jpg',
    '_': 'Expression',
    '_children': [{
      'link': 'meta-salutation-expression',
      '_': 'Pattern'
    }, {
      'link': 'meta-body-expression',
      '_': 'Pattern'
    }, {
      'name': 'meta-file-yield',
      'open': '{',
      'close': '}',
      '_': 'Yield',
      '_children': [{
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '{meta}.'
      }, {
        'is-present': 'movie',
        '_': 'Placeholder',
        '_text': 'movie.'
      }, {
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '{short}.'
      }, {
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '{galleryname}.'
      }, {
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '{metaforename}_'
      }, {
        'is-present': 'mini,label-code',
        '_': 'Placeholder',
        '_text': '{mini}'
      }, {
        'is-present': 'mini,label-code',
        '_': 'Placeholder',
        '_text': '{label-code}.'
      }, {
        'is-present': 'meta-date',
        '_': 'Placeholder',
        '_text': '{meta-date}.'
      }, {
        'ordinal': 'mandatory',
        '_': 'Placeholder',
        '_text': '{filesuffix}'
      }]
    }]
  }
};
