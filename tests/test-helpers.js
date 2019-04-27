
function logIfFailed (result, widget) {
  if (!result) {
    console.log(`FAILURE!: ${widget}!`);
  }

  return result;
}

function logIfFailedStringify (result, widget) {
  if (!result) {
    console.log(`FAILURE!: ${JSON.stringify(widget)}`);
  }

  return result;
}

// https://stackoverflow.com/questions/152483/is-there-a-way-to-print-all-methods-of-an-object-in-javascript
//
function getMethods (obj) {
  var result = [];
  for (var id in obj) {
    try {
      if (typeof (obj[id]) === 'function') {
        result.push(id + ': ' + obj[id].toString());

        console.log('function: ' + id);
      }
    } catch (err) {
      result.push(id + ': inaccessible');
    }
  }
  return result;
}

function getEverything (obj) {
  var result = [];
  for (var id in obj) {
    try {
      result.push(id + ': ' + obj[id].toString());
      if (typeof (obj[id]) === 'function') {
        console.log('function: ' + id);
      } else {
        console.log('property: ' + id);
      }
    } catch (err) {
      result.push(id + ': inaccessible');
    }
  }
  return result;
}

module.exports = {
  logIfFailed: logIfFailed,
  logIfFailedStringify: logIfFailedStringify,
  getMethods: getMethods,
  getEverything: getEverything
};
