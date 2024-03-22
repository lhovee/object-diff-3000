const _set = require('lodash.set');

let diffTracker = {};
let _diffCalledCount = 0
const strictnessLevelsMap = {
  1: 'same data type',
  2: 'loose equality',
  3: 'strict equality'
}
let globalConfig = {
  attemptSortArrays: true,
  strictnessLevel: strictnessLevelsMap[1]
}

/*


when given two object

check the keys of the object to see if they're the same

keys that aren't similar get added to the diff

keys that are similar check the values of the keys for

1. same data type // default
2. loose equality // configurable via options
3. strict equality // configurable via options

based on the above if the values don't pass then they get added to the diff

repeat recursively until the deepest levels of the object have been reached.

*/

async function diff(lhs, rhs, config) {
  if (config && config.strictnessLevel) {
    globalConfig.strictnessLevel = strictnessLevelsMap[config.strictnessLevel];
  }
  if (config && typeof config.attemptSortArrays !== 'undefined') {
    globalConfig.attemptSortArrays = config.attemptSortArrays;
  }
  // kicks off the diffing process
  _diff(lhs, rhs);

  await waitForDiffToConclude();


  return diffTracker;
}

function checkIfComplete() {
  if (_diffCalledCount === 0) {
    return true;
  }
  return setTimeout(() => {
    checkIfComplete();
  }, 100);
}

function waitForDiffToConclude() {
  return new Promise(async (resolve, reject) => {
    await checkIfComplete();
    resolve();
  })
}

function _diff(lhs, rhs, path = "") {
  _diffCalledCount = _diffCalledCount + 1;
  let handled = false;
  handled = handlePrimitives(lhs, rhs, path);
  if (!handled) {
    handled = handleFunctions(lhs, rhs, path);
  };
  if (!handled) {
    handled = handleObjects(lhs, rhs, path);
  }
  if (!handled) {
    handled = handleArrays(lhs, rhs, path);
  }

  _diffCalledCount = _diffCalledCount - 1;
}

function addToDiffTrackerAtPath(val, path) {
  _set(diffTracker, path, val)
}

function checkForArrays(lhs, rhs) {
  const lhsIsArray = Array.isArray(lhs);
  const rhsIsArray = Array.isArray(rhs);
  return {
    lhsIsArray,
    rhsIsArray,
    both: lhsIsArray && rhsIsArray,
    neither: !lhsIsArray && !rhsIsArray
  }
}

function checkForFunctions(lhs, rhs) {
  const lhsIsFunction = typeof lhs === 'function';
  const rhsIsFunction = typeof rhs === 'function';
  return {
    lhsIsFunction,
    rhsIsFunction,
    both: lhsIsFunction && rhsIsFunction,
    neither: !lhsIsFunction && !rhsIsFunction
  }
}

function checkForObjects(lhs, rhs) {
  const lhsIsObject = typeof lhs === 'object' && !Array.isArray(lhs);
  const rhsIsObject = typeof rhs === 'object' && !Array.isArray(rhs);
  return {
    lhsIsObject,
    rhsIsObject,
    both: lhsIsObject && rhsIsObject,
    neither: !lhsIsObject && !rhsIsObject
  }
}

function checkForPrimitives(lhs, rhs) {
  const lhsIsPrimitive = isPrimitive(lhs);
  const rhsIsPrimitive = isPrimitive(rhs);
  return {
    lhsIsPrimitive,
    rhsIsPrimitive,
    both: lhsIsPrimitive && rhsIsPrimitive,
    neither: !lhsIsPrimitive && !rhsIsPrimitive
  }
}

function checkFunctionsForSimilarityBasedOnConfig(lhs, rhs) {
  if (globalConfig.strictnessLevel === strictnessLevelsMap[1]) {
    // lhs and rhs are functions so return true because they're the same type
    return true;
  }
  // when comparing functions loose and strict equality are the same since
  // we're just checking if every character in the toString of the function matches
  return lhs === rhs;
}

function checkValuesForSimilarityBasedOnConfig(lhs, rhs) {
  if (globalConfig.strictnessLevel === strictnessLevelsMap[1]) {
    return typeof lhs === typeof rhs;
  }
  if (globalConfig.strictnessLevel === strictnessLevelsMap[2]) {
    return lhs == rhs;
  }
  return lhs === rhs;
}

function handleArrays(lhs, rhs, path) {
  const arrayCheck = checkForArrays(lhs, rhs);
  if (arrayCheck.neither) {
    // lhs and rhs must be objects or functions
    // exit without doing anything
    return false;
  }
  if (arrayCheck.both) {
    // the goal is to send val of lhs/rhs at index to _diff
    // if one array is longer than the other than we send the higher indices to the diff tracker at updated path
    if (globalConfig.attemptSortArrays) {
      // mutating a function argument is an anti-pattern, but if this works then it's preferrable
      lhs = lhs.sort();
      rhs = rhs.sort();
    }
    // if the arrays aren't the same length then we want to send the extra items to the diffTracker

    // given lhs [1] rhs [1, 2, 3]
    const longerArray = lhs.length > rhs.length ? lhs : rhs;
    const shorterArray = lhs.length > rhs.length ? rhs : lhs;
    // 3 - 1 = 2
    const differenceInLength = longerArray.length - shorterArray.length;
    const extraItems = longerArray.splice(shorterArray.length, differenceInLength);
    extraItems.forEach((extraItem, index) => {
      const indexOfItemInLongerArray = shorterArray.length + index;
      const updatedPath = updatePathForArray(path, indexOfItemInLongerArray);
      addToDiffTrackerAtPath(extraItem, updatedPath);
    })
    // iterate through both arrays and send items to _diff
    shorterArray.forEach((item, index) => {
      const updatedPath = updatePathForArray(path, index);
      _diff(item, longerArray[index], updatedPath);
    })
    
    return true;
  }
  // we shouldn't ever get here. lhs and rhs should've been handled by now
  throw Error('something went wrong');
}

function handleFunctions(lhs, rhs, path) {
  const functionCheck = checkForFunctions(lhs, rhs);
  if (functionCheck.neither) {
    // lhs and rhs must be objects or arrays
    // exit without doing anything
    return false;
  }
  if (functionCheck.both) {
    const valuesSame = checkFunctionsForSimilarityBasedOnConfig(lhs.toString(), rhs.toString());
    if (!valuesSame) {
      // maybe which side gets added to the diff should be configurable?
      addToDiffTrackerAtPath(lhs, path)
    }
    return true;
  }
  // one or the other isn't a function
  // maybe which side gets added to the diff should be configurable?
  addToDiffTrackerAtPath(lhs, path)
  return true;
}

function handlePrimitives(lhs, rhs, path) {
  const primtiveCheck = checkForPrimitives(lhs, rhs);
  if (primtiveCheck.neither) {
    return false;
  }
  if (primtiveCheck.both) {
    const valuesSame = checkValuesForSimilarityBasedOnConfig(lhs, rhs);
    if (!valuesSame) {
      // maybe which side gets added to the diff should be configurable?
      addToDiffTrackerAtPath(lhs, path)
    }
  }
  if (primtiveCheck.lhsIsPrimitive && !primtiveCheck.rhsIsPrimitive) {
    // send rhs to diffTracker
    addToDiffTrackerAtPath(rhs, path);
  }
  if (primtiveCheck.rhsIsPrimitive && !primtiveCheck.lhsIsPrimitive) {
    // send lhs to diffTracker
    addToDiffTrackerAtPath(lhs, path);
  }
  return true;
}

function handleObjects(lhs, rhs, path) {
  const objectCheck = checkForObjects(lhs, rhs);
  if (objectCheck.neither) {
    // lhs and rhs must be arrays or functions
    // exit without doing anything
    return false;
  }
  if (objectCheck.both) {
    const keysLhs = Object.keys(lhs);
    const keysRhs = Object.keys(rhs);
    keysLhs.forEach((lhsKey) => {
      const updatedPath = updatePathForObject(path, lhsKey);
      if (keysRhs.includes(lhsKey)) {
        _diff(lhs[lhsKey], rhs[lhsKey], updatedPath)
      } else {
        // lhsKey doesn't appear in rhs
        addToDiffTrackerAtPath(lhs[lhsKey], updatedPath)
      }
    })
    // iterate through keysRhs that aren't in keysLhs 
    const filteredRhsKeys = keysRhs.filter((rhsKey) => !keysLhs.includes(rhsKey));
    filteredRhsKeys.forEach((rhsKey) => {
      const updatedPath = updatePathForObject(path, rhsKey);
      // rhsKey doesn't appear in lhs
      addToDiffTrackerAtPath(rhs[rhsKey], updatedPath);
    })
    return true;
  }
  // one is an object but the other is either an array or a function
  // maybe which side gets added to the diff should be configurable?
  addToDiffTrackerAtPath(lhs, path);
  return true;
}

const _primitiveTypes = ["string", "number", "undefined", "boolean", "bigint", "symbol"];
function isPrimitive(val) {
  return _primitiveTypes.includes(typeof val) || val === null;
}

function updatePathForArray(path, index) {
  return path + `.[${index}]`;
}

function updatePathForObject(path, key) {
  if (path) {
    return path + '.' + `${key}`;
  }
  return key;
}

module.exports = {
  diff
}