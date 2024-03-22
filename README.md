## Object Diff 3000

Get the diff of two JSON objects, even deeply nested data structures.

diff(obj1, obj2, config: optional): returns Promise<diff of the two objects>

config options

```
config = {
  attemptSortArrays: boolean,
  strictnessLevel: number // 1, 2, or 3
}
```

`attemptSortArrays`: default is true
when objects include arrays, the order of the items in the arrays matters for the diff.
The diff function will attempt to sort elements in arrays by simply calling Array.sort()
To avoid this, set attemptSortArrays to false.

`strictnessLevel`: default is 1
when comparing values of object keys there are three comparison options.

1. compare on same type. For instance, "some string" and "some other string" are both strings so when strictnessLevel is set to 1 these would be considered equal.
2. loose equality check ==
3. strict equality check ===

## Dependencies

This project has one dependency, lodash.set


## Examples

given

```
const foo = { a: 1, b: 'test' }
const bar = { a: '1', c: false, b: 'test' }

async function doDiff() {
  const diff_fooBar = await diff(foo, bar); // using default (same type) equality check
  console.log("Diff result: ", JSON.stringify(diff_fooBar))
}
```

results in

```
{
  "a": 1,
  "c": false
}
```

given

```
const foo = { a: 1, b: 'test' }
const bar = { a: '1', c: false, b: 'test' }

let config = {
  strictnessLevel: 2 // using == equality check
}

async function doDiff() {
  const diff_fooBar = await diff(foo, bar, config);
  console.log("Diff result: ", JSON.stringify(diff_fooBar))
}
```

results in

```
{
  "c": false
}
```

given

```
const foo = { a: 1, b: 'test' }
const bar = { a: '1', c: false, b: 'test' }

let config = {
  strictnessLevel: 3 // using === equality check
}

async function doDiff() {
  const diff_fooBar = await diff(foo, bar, config);
  console.log("Diff result: ", JSON.stringify(diff_fooBar))
}
```

results in

```
{
  "a": 1,
  "c": false
}
```

given

```
const foo = {
  a: "some field",
  b: {
    c: null,
    d: false,
    e: [
      {
        f: 1,
        g: {
          h: {
            i: [{
              j: {
                k: false
              }
            }],
            l: "test"
          },
        }
      }
    ],
    n: false
  }
}

const bar = {
  a: "some field",
  b: {
    c: null,
    d: false,
    e: [
      {
        f: 1,
        g: {
          h: {
            i: [{
              j: {
                k: false
              }
            }],
            l: "test",
            m: "this guy"
          },
        }
      }
    ],
    n: "how about this guy?"
  },
  c: "test"
}

async function doDiff() {
  const diff_fooBar = await diff(foo, bar);
  console.log("Diff result: ", JSON.stringify(diff_fooBar))
}
```


results in
```
{
  "b": {
    "e": [
      {
        "g": {
          "h": {
            "m": "this guy"
          }
        }
      }
    ],
    "n": false
  },
  "c": "test"
}
```

given

```
const foo = {
  a: "some field",
  b: {
    c: null,
    d: false,
    e: [
      {
        f: 1,
        g: {
          h: {
            i: [{
              j: {
                k: false
              }
            }],
            l: "test"
          },
        }
      }
    ],
    n: false
  }
}

const bar = {
  a: "blah some field",
  b: {
    c: null,
    d: true,
    e: [
      {
        f: 2,
        g: {
          h: {
            i: [{
              j: {
                k: false
              }
            }],
            l: "test",
            m: "this guy"
          },
        }
      },
      {
        f: 3,
        g: {
          h: {
            i: [{
              j: {
                k: true
              }
            }],
            l: "testing one two three",
            m: "other this guy"
          },
        }
      }
    ],
    n: "how about this guy?"
  },
  c: "test"
}

let config = {
  strictnessLevel: 2
}

async function doDiff() {
  const diff_fooBar = await diff(foo, bar, config);
  console.log("Diff result: ", JSON.stringify(diff_fooBar))
}
```

results in

```
{
  "a": "some field",
  "b": {
    "d": false,
    "e": [
      {
        "f": 1,
        "g": {
          "h": {
            "m": "this guy"
          }
        }
      },
      {
        "f": 3,
        "g": {
          "h": {
            "i": [
              {
                "j": {
                  "k": true
                }
              }
            ],
            "l": "testing one two three",
            "m": "other this guy"
          }
        }
      }
    ],
    "n": false
  },
  "c": "test"
}
```