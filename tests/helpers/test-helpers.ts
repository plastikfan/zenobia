
export function logIfFailed (result: boolean, widget: any): boolean {
  if (!result) {
    console.log(`FAILURE!: ${widget}!`);
  }

  return result;
}

export function logIfFailedStringify (result: boolean, widget: any): boolean {
  if (!result) {
    console.log(`FAILURE!: ${JSON.stringify(widget)}`);
  }

  return result;
}

export type ArrayLike = {
  length: number;
  [key: number]: any
};

// https://stackoverflow.com/questions/152483/is-there-a-way-to-print-all-methods-of-an-object-in-javascript
//
export function getMethods (obj: any): ArrayLike {
  let result = [];
  for (let id in obj) {
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

export function getEverything (obj: any): ArrayLike {
  let result = [];
  for (let id in obj) {
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
