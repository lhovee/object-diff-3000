const { diff } = require("./utils");

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

const bar2 = {
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

async function doDiff() {
  const diff_fooBar = await diff(foo, bar);
  console.log("Diff result: ", JSON.stringify(diff_fooBar))
}

doDiff()

let config = {
  strictnessLevel: 3
}

async function doDiff2() {
  const diff_fooBar = await diff(foo, bar2, config);
  console.log("Diff result: ", JSON.stringify(diff_fooBar))
}

doDiff2()