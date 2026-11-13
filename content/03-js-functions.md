---
id: js-3
week: 1
session: 3
lang: js
title: Functions
minutes: 60
summary: Package code into reusable functions, pass data in, and get results back.
goals: Write and call functions with parameters | Understand the difference between `return` and `console.log` | Write arrow functions | Know where a variable can be used (scope) | Pass functions to other functions
---

=== step: Why functions?
A **function** is a named, reusable piece of code. Instead of copying the same lines again and again, you write them once and **call** the function whenever you need it.

```js
function sayHello() {
  console.log("Hello!");
  console.log("Nice to see you.");
}

sayHello();
sayHello();
```

+++ guide
Two separate things happen here:

1. **Declaring** the function: `function sayHello() { ... }` defines it. Nothing runs yet.
2. **Calling** it: `sayHello()` runs the code inside. The brackets `()` are what make it run.

Writing `sayHello` without brackets just refers to the function itself without running it. You will use that later in this session.
+++

=== step: Parameters and arguments
Functions get more useful when you pass information in. **Parameters** are the names in the definition; **arguments** are the actual values you pass when you call it.

```js
function greet(name, timeOfDay) {
  console.log(`Good ${timeOfDay}, ${name}!`);
}

greet("Ada", "morning");
greet("Linus", "evening");
greet("Grace");
```

+++ guide
The last call passed only one argument, so `timeOfDay` was `undefined`. JavaScript doesn't complain about missing arguments, which is another thing TypeScript will check for you later.
+++

=== step: Returning a value
`return` sends a value back to whoever called the function. The call itself then **becomes** that value, so you can store it or use it in a bigger expression.

```js
function add(a, b) {
  return a + b;
}

const sum = add(2, 3);
console.log(sum);
console.log(add(10, add(1, 1)));
```

+++ guide
`return` also ends the function immediately. Any code after it in the same block never runs.

A very common beginner mix-up: `console.log` only **shows** a value on screen; `return` **gives it back** to the code. A function that only logs can't be used in calculations:

```js
function addAndLog(a, b) {
  console.log(a + b);
}

const result = addAndLog(2, 3);   // prints 5...
console.log(result);              // ...but result is undefined
```

A function without a `return` gives back `undefined`.
+++

=== quiz
? What gets printed by the last line?
```js static
function double(n) {
  console.log(n * 2);
}
const x = double(4);
console.log(x);
```
- `8`
* `undefined`
- `null`
- `4`
> `double` prints 8, but it has no `return`, so it gives back `undefined`. That is what `x` holds.

=== step: Default parameter values
You can give a parameter a default, used when no argument is passed.

```js
function greet(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}

console.log(greet("Ada"));
console.log(greet("Ada", "Welcome"));
```

=== step: Arrow functions
There is a shorter way to write functions, called **arrow functions**. You will see these everywhere in modern JavaScript and TypeScript.

```js
// A normal function declaration
function square(n) {
  return n * n;
}

// The same thing as an arrow function stored in a const
const squareArrow = (n) => {
  return n * n;
};

// If the body is a single expression, drop the braces and "return"
const squareShort = (n) => n * n;

console.log(square(4), squareArrow(4), squareShort(4));
```

+++ guide
The short form returns the expression automatically. This is called an **implicit return**. As soon as you add curly braces, you need to write `return` yourself.

More examples:

```js
const isAdult = (age) => age >= 18;
const fullName = (first, last) => `${first} ${last}`;
const rollDice = () => Math.floor(Math.random() * 6) + 1;

console.log(isAdult(20), fullName("Ada", "Lovelace"), rollDice());
```

Both styles work. Many people use `function` for main, named functions and arrows for short helpers, especially ones passed to other functions.
+++

=== quiz
? What does `const f = (x) => { x * 2 };` return when you call `f(5)`?
- `10`
* `undefined`
- `5`
- An error
> With curly braces there is no implicit return. You need `{ return x * 2; }`, or drop the braces: `(x) => x * 2`.

=== step: Scope: where variables live
A variable created inside a function, or inside any `{ }` block, only exists **inside** it. That area is its **scope**.

```js
const planet = "Earth";      // outside any block: usable everywhere below

function describe() {
  const moon = "the Moon";   // only exists inside describe
  console.log(`${planet} has ${moon}`);
}

describe();
console.log(planet);
console.log(moon);           // error: moon is not defined out here
```

+++ guide
This is a good thing. It means two functions can each have a variable called `total` without interfering with each other.

Blocks such as `if` and loops create a scope too, when you use `let` or `const`:

```js
if (true) {
  const secret = 42;
}
// secret doesn't exist here
```

As a rule, keep variables in the smallest scope that works.
+++

=== step: Functions are values
In JavaScript, a function is a value like a number or a string. You can store it in a variable and **pass it to another function**. This idea powers a lot of JavaScript, including next week's array methods.

```js
function repeat(times, action) {
  for (let i = 1; i <= times; i++) {
    action(i);
  }
}

repeat(3, (n) => console.log(`Round ${n}`));

const shout = (n) => console.log(`ROUND ${n}!!!`);
repeat(2, shout);
```

+++ guide
A function that you pass into another function is often called a **callback**. Notice we passed `shout` without brackets: we hand over the function itself, and `repeat` decides when to call it.
+++

=== step: Closures: functions that remember
A function created inside another function can use the outer function's variables, and keeps access to them **even after the outer function has finished**. This is called a **closure**.

```js
function makeCounter() {
  let count = 0;
  return () => {
    count++;
    return count;
  };
}

const counter = makeCounter();
console.log(counter());
console.log(counter());
console.log(counter());

const other = makeCounter();   // a brand-new, separate count
console.log(other());
```

+++ guide
Each call to `makeCounter` creates a fresh `count` variable. The returned arrow function keeps a private link to it. Nothing else can touch `count` directly, so closures are one way to hide data.

Don't worry if this feels abstract. You will recognise the pattern when you see it, and that is enough for now.
+++

=== exercise: Two small helpers
Write two arrow functions:

- `square` takes a number and returns it multiplied by itself
- `isEven` takes a number and returns `true` if it is even, `false` otherwise

```js starter
// const square = ...

// const isEven = ...

console.log(square(5));
console.log(isEven(4), isEven(7));
```

```js tests
test("square(5) is 25", () => expect(square(5)).toBe(25));
test("square(-3) is 9", () => expect(square(-3)).toBe(9));
test("isEven(4) is true", () => expect(isEven(4)).toBe(true));
test("isEven(7) is false", () => expect(isEven(7)).toBe(false));
test("isEven(0) is true", () => expect(isEven(0)).toBe(true));
```

```js solution
const square = (n) => n * n;

const isEven = (n) => n % 2 === 0;

console.log(square(5));
console.log(isEven(4), isEven(7));
```

+++ hint
`const square = (n) => n * n;`
+++
+++ hint
A number is even when the remainder after dividing by 2 is 0. A comparison already gives `true` or `false`, so you can return it directly.
+++

=== exercise: Greeting with a default
Write a function `greet(name, greeting)` that returns (not prints) a string like `"Hello, Ada!"`. If no greeting is passed, use `"Hello"`.

```js starter
function greet(name, greeting) {
  // Your code here

}

console.log(greet("Ada"));
console.log(greet("Linus", "Hi"));
```

```js tests
test('greet("Ada") returns "Hello, Ada!"', () => expect(greet("Ada")).toBe("Hello, Ada!"));
test('greet("Linus", "Hi") returns "Hi, Linus!"', () => expect(greet("Linus", "Hi")).toBe("Hi, Linus!"));
```

```js solution
function greet(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}

console.log(greet("Ada"));
console.log(greet("Linus", "Hi"));
```

+++ hint
Give the parameter a default: `function greet(name, greeting = "Hello")`.
+++
+++ hint
Use `return` with a template literal: `` return `${greeting}, ${name}!`; ``
+++

=== exercise: Apply it twice
Write `applyTwice(fn, value)`. It takes a function and a value, calls the function on the value, then calls the function **again on the result**, and returns that final result.

For example, with `addThree = (n) => n + 3`, `applyTwice(addThree, 10)` is `16`.

```js starter
function applyTwice(fn, value) {
  // Your code here

}

const addThree = (n) => n + 3;
console.log(applyTwice(addThree, 10));
console.log(applyTwice((s) => s + "!", "Hi"));
```

```js tests
test("applyTwice(addThree, 10) is 16", () => expect(applyTwice((n) => n + 3, 10)).toBe(16));
test("works with strings", () => expect(applyTwice((s) => s + "!", "Hi")).toBe("Hi!!"));
test("works with doubling", () => expect(applyTwice((n) => n * 2, 5)).toBe(20));
```

```js solution
function applyTwice(fn, value) {
  return fn(fn(value));
}

const addThree = (n) => n + 3;
console.log(applyTwice(addThree, 10));
console.log(applyTwice((s) => s + "!", "Hi"));
```

+++ hint
`fn(value)` calls the function once. What happens if you pass that result into `fn` again?
+++

=== exercise: A counter with a closure
Write `makeCounter(start)`. It returns a function. Each time that function is called, it returns the next number, beginning with `start`.

```js static
const next = makeCounter(5);
next(); // 5
next(); // 6
next(); // 7
```

```js starter
function makeCounter(start) {
  // Your code here

}

const next = makeCounter(5);
console.log(next(), next(), next());
```

```js tests
test("first call returns the start value", () => expect(makeCounter(5)()).toBe(5));
test("counts up by one each call", () => {
  const c = makeCounter(10);
  c();
  c();
  expect(c()).toBe(12);
});
test("counters are independent", () => {
  const a = makeCounter(0);
  const b = makeCounter(100);
  a(); a();
  expect(b()).toBe(100);
  expect(a()).toBe(2);
});
```

```js solution
function makeCounter(start) {
  let current = start;
  return () => {
    const value = current;
    current++;
    return value;
  };
}

const next = makeCounter(5);
console.log(next(), next(), next());
```

+++ hint
Create a `let` variable inside `makeCounter`, then `return` an arrow function that uses and changes it.
+++
+++ hint
The first call must return `start` itself, so remember the current value before you add 1.
+++
