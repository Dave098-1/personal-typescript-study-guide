---
id: js-6
week: 2
session: 3
lang: js
title: Errors and async code
minutes: 60
summary: Handle errors with `try`/`catch`, and write code that waits for slow things with Promises and `async`/`await`.
goals: Catch and throw errors | Understand why some code runs "later" | Create and use Promises | Write `async` functions with `await` | Run several tasks at once with `Promise.all`
---

=== step: When things go wrong
When JavaScript hits a problem it **throws an error** and stops. You can catch errors with `try` / `catch` so your program can recover.

```js
try {
  const data = JSON.parse("this is not JSON");
  console.log(data);
} catch (error) {
  console.log("Could not read the data:", error.message);
}

console.log("The program keeps going");
```

+++ guide
- Code in `try { }` runs normally.
- If anything inside throws, JavaScript jumps straight to `catch (error) { }`.
- `error.message` holds a human-readable description.

There's also an optional `finally { }` block, which runs whether or not there was an error. It's useful for clean-up, like hiding a loading spinner.
+++

=== step: Throwing your own errors
Use `throw new Error("message")` when your function gets input it can't handle. It's better to fail loudly than to quietly return a wrong answer.

```js
function withdraw(balance, amount) {
  if (amount > balance) {
    throw new Error("Not enough money");
  }
  return balance - amount;
}

console.log(withdraw(100, 30));

try {
  console.log(withdraw(100, 500));
} catch (error) {
  console.log("Failed:", error.message);
} finally {
  console.log("Transaction finished");
}
```

=== step: Code that runs later
Some things take time: loading data from the internet, reading a file, waiting for a timer. JavaScript doesn't stop and wait for them. It carries on, and runs your code **later** when the slow thing is done. This is **asynchronous** code.

`setTimeout(fn, ms)` is the simplest example: run `fn` after `ms` milliseconds.

```js
console.log("1. Order coffee");

setTimeout(() => {
  console.log("3. Coffee is ready");
}, 1000);

console.log("2. Read the news while waiting");
```

+++ guide
The order of output is 1, 2, 3, not 1, 3, 2. `setTimeout` schedules the function and immediately moves on. That surprises everyone at first.

Even `setTimeout(fn, 0)` runs after the rest of the current code. JavaScript finishes what it's doing before it handles anything that was scheduled.
+++

=== quiz
? In what order are the letters printed?
```js static
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
```
- A B C
* A C B
- B A C
- C A B
> Even with a 0 ms delay, the timer callback waits until the current code has finished. So A, then C, then B.

=== step: Promises
A **Promise** is an object that stands for a value you'll have **later**. It either **resolves** (succeeds with a value) or **rejects** (fails with an error).

```js
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function rollDiceSlowly() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll === 1) {
        reject(new Error("Rolled a 1. You lose!"));
      } else {
        resolve(roll);
      }
    }, 500);
  });
}

rollDiceSlowly()
  .then((roll) => console.log("You rolled", roll))
  .catch((error) => console.log("Oops:", error.message));

console.log("Rolling...");
```

+++ guide
Run it a few times. Sometimes it fails.

- `.then(fn)` runs `fn` with the value once the promise resolves.
- `.catch(fn)` runs `fn` with the error if it rejects.

You'll rarely write `new Promise` yourself. Most of the time a library or the browser gives you promises (for example `fetch(url)` returns one), and you just need to use them. And the nicest way to use them is `async`/`await`.
+++

=== step: async and await
`await` pauses an **`async` function** until a promise is done, then gives you its value. Async code then reads top to bottom like normal code.

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function makeBreakfast() {
  console.log("Boiling water...");
  await wait(500);
  console.log("Making tea...");
  await wait(500);
  console.log("Breakfast is ready");
  return "tea";
}

makeBreakfast().then((drink) => console.log("Enjoy your", drink));
```

+++ guide
Things to remember:

- `await` only works inside a function marked `async` (or at the top level of a module, which this site allows).
- An `async` function **always returns a promise**, even if you `return "tea"`. Whoever calls it needs to `await` it or use `.then`.
- Errors in `async` code are caught with ordinary `try`/`catch`.
+++

=== step: A fake web API
Real apps load data from servers. We can't call a real server here, so this `fetchUser` function **pretends**: it waits a little, then returns a user or fails.

```js
const users = { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Linus" } };

function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (users[id]) resolve(users[id]);
      else reject(new Error(`User ${id} not found`));
    }, 300);
  });
}

async function showUser(id) {
  try {
    const user = await fetchUser(id);
    console.log(`Found ${user.name}`);
  } catch (error) {
    console.log(`Problem: ${error.message}`);
  }
}

await showUser(1);
await showUser(99);
```

+++ guide
With a real API you'd write something like:

```js static
const response = await fetch("https://api.example.com/users/1");
const user = await response.json();
```

The structure is exactly the same: `await` the slow thing, and wrap it in `try`/`catch`.
+++

=== step: Doing several things at once
Awaiting one thing after another is slow when the tasks don't depend on each other. `Promise.all` starts them all together and waits for every one.

```js
const wait = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

const start = Date.now();

const [a, b, c] = await Promise.all([
  wait(500, "first"),
  wait(500, "second"),
  wait(500, "third"),
]);

console.log(a, b, c);
console.log(`Took about ${Math.round((Date.now() - start) / 100) * 100} ms, not 1500`);
```

+++ guide
If any of the promises rejects, `Promise.all` rejects too. If you want every result whether it failed or not, there's `Promise.allSettled`.
+++

=== quiz
? What does an `async` function always return?
- Whatever value you `return`
* A Promise
- `undefined`
- A callback
> Even `async function f() { return 5; }` returns a Promise that resolves to 5. You need `await f()` to get the 5.

=== step: Week 2 done
You now know the core of JavaScript: values, variables, decisions, loops, functions, arrays, objects, errors and async code. That's the language TypeScript is built on.

Next week you add **types**. You'll find that TypeScript mostly asks you to write down things you already know, like "this parameter is a number", and in return it catches whole categories of bugs before your code ever runs.

=== exercise: Safe division
Write `divide(a, b)` that returns `a / b`, but **throws** an `Error` with the message `"Cannot divide by zero"` when `b` is `0`.

```js starter
function divide(a, b) {
  // Your code here

}

console.log(divide(10, 2));

try {
  divide(1, 0);
} catch (error) {
  console.log("Caught:", error.message);
}
```

```js tests
test("divide(10, 2) is 5", () => expect(divide(10, 2)).toBe(5));
test("throws when dividing by zero", () => expect(() => divide(1, 0)).toThrow("Cannot divide by zero"));
```

```js solution
function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}

console.log(divide(10, 2));

try {
  divide(1, 0);
} catch (error) {
  console.log("Caught:", error.message);
}
```

+++ hint
`if (b === 0) { throw new Error("Cannot divide by zero"); }`
+++

=== exercise: Parse a number safely
Write `toNumber(text)` that converts a string to a number. If the result is `NaN`, return `0` instead. Use `Number(text)` and `Number.isNaN(...)`.

```js starter
function toNumber(text) {
  // Your code here

}

console.log(toNumber("42"));
console.log(toNumber("hello"));
```

```js tests
test('toNumber("42") is 42', () => expect(toNumber("42")).toBe(42));
test('toNumber("3.5") is 3.5', () => expect(toNumber("3.5")).toBe(3.5));
test('toNumber("hello") is 0', () => expect(toNumber("hello")).toBe(0));
```

```js solution
function toNumber(text) {
  const n = Number(text);
  if (Number.isNaN(n)) {
    return 0;
  }
  return n;
}

console.log(toNumber("42"));
console.log(toNumber("hello"));
```

+++ hint
`const n = Number(text);` then check `Number.isNaN(n)`.
+++

=== exercise: Get a user's name
`fetchUser(id)` is given. It returns a Promise for a user object, or rejects if the user doesn't exist.

Write an **async** function `getUserName(id)` that returns the user's `name`, or the string `"Unknown"` if fetching fails.

```js starter
const users = { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Linus" } };
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (users[id]) resolve(users[id]);
      else reject(new Error(`User ${id} not found`));
    }, 100);
  });
}

// Write getUserName here


console.log(await getUserName(1));
console.log(await getUserName(42));
```

```js tests
test("getUserName(1) resolves to 'Ada'", async () => expect(await getUserName(1)).toBe("Ada"));
test("getUserName(2) resolves to 'Linus'", async () => expect(await getUserName(2)).toBe("Linus"));
test("an unknown id gives 'Unknown'", async () => expect(await getUserName(42)).toBe("Unknown"));
test("it returns a Promise", () => expect(getUserName(1) instanceof Promise).toBe(true));
```

```js solution
const users = { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Linus" } };
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (users[id]) resolve(users[id]);
      else reject(new Error(`User ${id} not found`));
    }, 100);
  });
}

async function getUserName(id) {
  try {
    const user = await fetchUser(id);
    return user.name;
  } catch (error) {
    return "Unknown";
  }
}

console.log(await getUserName(1));
console.log(await getUserName(42));
```

+++ hint
Start with `async function getUserName(id) { ... }`.
+++
+++ hint
Inside, `await fetchUser(id)` in a `try` block, and `return "Unknown"` in the `catch` block.
+++

=== exercise: Load them all
Using the same `fetchUser`, write an async function `getNames(ids)` that fetches all the users **at the same time** with `Promise.all` and returns an array of their names, in the same order as `ids`.

```js starter
const users = { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Linus" }, 3: { id: 3, name: "Grace" } };
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (users[id]) resolve(users[id]);
      else reject(new Error(`User ${id} not found`));
    }, 300);
  });
}

// Write getNames here


console.log(await getNames([3, 1, 2]));
```

```js tests
test("returns names in order", async () => expect(await getNames([3, 1, 2])).toEqual(["Grace", "Ada", "Linus"]));
test("runs the requests at the same time", async () => {
  const start = Date.now();
  await getNames([1, 2, 3]);
  expect(Date.now() - start < 600).toBe(true);
});
```

```js solution
const users = { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Linus" }, 3: { id: 3, name: "Grace" } };
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (users[id]) resolve(users[id]);
      else reject(new Error(`User ${id} not found`));
    }, 300);
  });
}

async function getNames(ids) {
  const found = await Promise.all(ids.map((id) => fetchUser(id)));
  return found.map((user) => user.name);
}

console.log(await getNames([3, 1, 2]));
```

+++ hint
`ids.map((id) => fetchUser(id))` gives you an array of promises.
+++
+++ hint
`await Promise.all(thatArray)` gives you an array of users. Then `map` them to names.
+++
