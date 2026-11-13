---
id: js-1
week: 1
session: 1
lang: js
title: Hello, JavaScript
minutes: 60
summary: Run your first code, store values in variables, and do maths and text with them.
goals: Run code and print results with `console.log` | Tell numbers, strings and booleans apart | Store values with `let` and `const` | Build text with template literals
---

=== step: What JavaScript is
JavaScript is the programming language of the web. Every website you use runs it, and it also runs servers, apps and tools.

TypeScript, the goal of this course, is JavaScript **plus types**. So we learn JavaScript first. Everything you learn in weeks 1 and 2 still works in TypeScript.

Press **Run** on the code below. Then change the text between the quotes and run it again.

```js
console.log("Hello, world!");
```

+++ guide
`console.log(...)` prints whatever you put between the brackets. It is the main way you will see what your code is doing. Programmers use it all the time, not just beginners.

Each line of code is a **statement**, an instruction for the computer. Statements run from top to bottom, one after another. The semicolon `;` at the end marks where a statement finishes. JavaScript often lets you leave it out, but we will always write it, which avoids a few rare surprises.
+++

+++ tip
You can also press **Ctrl + Enter** (or **⌘ + Enter** on a Mac) inside any editor to run it.
+++

=== step: Printing and comments
`console.log` can print several things at once if you separate them with commas. Lines that start with `//` are **comments**. JavaScript ignores them; they are notes for humans.

```js
// This line is a comment. It does nothing.
console.log("I am", 30, "years old");
console.log(2 + 3);

/* A comment can also
   span several lines like this. */
console.log("Done");
```

+++ guide
Notice that `2 + 3` printed `5`. JavaScript worked out the sum before printing. Anything that produces a value (like `2 + 3`) is called an **expression**.

Use comments to explain *why* code does something. Don't use them to repeat what the code obviously says.
+++

=== step: Values and their types
Every value in JavaScript has a **type**. The three you will use most:

| Type | Examples | Used for |
| --- | --- | --- |
| `number` | `42`, `3.14`, `-7` | counting, maths, money, measurements |
| `string` | `"hello"`, `'Ada'` | text of any kind |
| `boolean` | `true`, `false` | yes/no answers |

`typeof` tells you the type of a value. Try it:

```js
console.log(typeof 42);
console.log(typeof "42");
console.log(typeof true);
console.log(typeof 3.5);
```

+++ guide
Strings can use double quotes `"..."` or single quotes `'...'`. Pick one and stay consistent. There is a third kind using backticks, which you will meet soon.

`42` and `"42"` look alike but are different types. One is a number you can do maths with, the other is text that happens to contain digits. This difference causes many bugs, and catching bugs like it is a big part of why TypeScript exists.

JavaScript has no separate type for whole numbers and decimals. Both are just `number`.
+++

=== quiz
? What does `typeof "42"` give you?
- `"number"`
* `"string"`
- `"boolean"`
- `"42"`
> The quotes make it a string, even though it contains digits.

=== step: Variables with let and const
A **variable** is a name that holds a value, so you can use it later. Create one with `const` or `let`:

```js
const name = "Ada";
let score = 10;

console.log(name, "has", score, "points");

score = score + 5;   // let can be changed later
console.log(name, "now has", score, "points");
```

+++ guide
- `const` means the variable can **not** be reassigned. Use it by default.
- `let` means you can give the variable a new value later. Use it only when you actually need to change the value.
- You may see `var` in older code. It is the old way of making variables and has confusing rules. Don't use it.

The `=` sign does not mean "equals" like in maths. It means "store the value on the right in the name on the left". So `score = score + 5` means "take the current score, add 5, and store the result back in score".
+++

Now see what happens when you try to change a `const`:

```js
const birthYear = 1990;
birthYear = 1991;
console.log(birthYear);
```

+++ guide
You get a `TypeError: Assignment to constant variable.` Errors are normal and useful. Read the message: it usually tells you exactly what went wrong. The program stops at the line with the error, so the `console.log` never runs.
+++

=== step: Naming things
Variable names can contain letters, digits, `_` and `$`, but can't start with a digit. JavaScript programmers write multi-word names in **camelCase**: first word lowercase, each next word capitalised.

```js
const firstName = "Grace";
const itemsInCart = 3;
const isLoggedIn = true;
console.log(firstName, itemsInCart, isLoggedIn);
```

+++ guide
Good names describe what is inside: `itemsInCart` is better than `n` or `x`. Booleans often start with `is`, `has` or `can`, like `isLoggedIn` or `hasDiscount`, so they read like questions.

Names are case-sensitive: `score` and `Score` are two different variables. Some words, like `let`, `const`, `if` and `function`, are reserved by the language and can't be used as names.
+++

=== step: Doing maths
JavaScript works like a calculator. The usual order of operations applies, and brackets go first.

```js
console.log(10 + 3);   // add
console.log(10 - 3);   // subtract
console.log(10 * 3);   // multiply
console.log(10 / 3);   // divide
console.log(10 % 3);   // remainder after dividing
console.log(2 ** 3);   // power: 2 × 2 × 2
console.log(2 + 3 * 4, (2 + 3) * 4);
```

+++ guide
The remainder operator `%` is more useful than it looks. `n % 2` is `0` for even numbers and `1` for odd ones, which you will use in the next session.

There are short ways to update a variable:

```js
let count = 10;
count += 5;    // same as count = count + 5
count -= 2;    // same as count = count - 2
count *= 2;    // same as count = count * 2
count++;       // add 1
console.log(count);
```

`Math` holds useful helpers: `Math.round(2.6)` is `3`, `Math.floor(2.6)` rounds down to `2`, `Math.max(4, 9, 2)` is `9`, and `Math.random()` gives a random number between 0 and 1.
+++

=== step: Working with text
You can join strings with `+`, but **template literals** are easier. Use backticks `` ` `` and put any expression inside `${ }`.

```js
const city = "Lisbon";
const days = 4;

console.log("I am going to " + city + " for " + days + " days.");
console.log(`I am going to ${city} for ${days} days.`);
console.log(`That is ${days * 24} hours!`);
```

+++ guide
Strings also come with built-in tools, called **methods**, that you call with a dot:

```js
const word = "JavaScript";
console.log(word.length);           // how many characters
console.log(word.toUpperCase());
console.log(word.toLowerCase());
console.log(word.includes("Script"));
console.log(word[0]);                // first character (counting starts at 0)
console.log(word.slice(0, 4));       // characters 0 to 3
```

Counting from `0` is the norm in programming. The first character is at position `0`, the second at `1`, and so on.
+++

=== step: When types mix
JavaScript tries to be helpful when you mix types, and the result is sometimes surprising. With a string involved, `+` joins text instead of adding numbers.

```js
console.log("5" + 3);
console.log("5" - 3);
console.log(Number("5") + 3);
console.log(Number("hello"));
console.log(String(42) + "!");
```

+++ guide
- `"5" + 3` gives `"53"` because `+` with a string means "join".
- `"5" - 3` gives `2` because `-` only works on numbers, so JavaScript converts the string.
- `Number(...)` converts something to a number. If that fails you get `NaN`, short for "Not a Number".
- `String(...)` converts something to a string.

Silent conversions like these are a classic source of bugs. In week 3, TypeScript will warn you about many of them before your code even runs.
+++

=== quiz
? What does `console.log("2" + 2)` print?
- `4`
* `22`
- `"4"`
- An error
> When one side of `+` is a string, JavaScript joins them as text: `"2"` and `"2"` become `"22"`.

=== step: Nothing: undefined and null
Two special values mean "nothing here":

- `undefined` means a value was never set.
- `null` means "empty on purpose", set by a programmer.

```js
let nickname;
console.log(nickname);

let middleName = null;
console.log(middleName);

console.log(typeof undefined, typeof null);
```

+++ guide
`typeof null` printing `"object"` is a famous mistake from the first version of JavaScript that can never be fixed without breaking old websites. Just remember that `null` is its own thing.

You now know JavaScript's basic types: `number`, `string`, `boolean`, `undefined` and `null`. Objects and arrays come in week 2.
+++

=== quiz
? Which line causes an error?
```js static
let a = 1;
const b = 2;
a = 3;
b = 4;
```
- `let a = 1;`
- `const b = 2;`
- `a = 3;`
* `b = 4;`
> `b` was declared with `const`, so it can't be reassigned. Changing `a` is fine because it was declared with `let`.

=== exercise: Introduce yourself
Create two variables:

- a `const` called `myName` holding your name (a string)
- a `let` called `age` holding your age (a number)

Then print exactly this sentence using a template literal, with your own values:

`My name is Sam and I am 31 years old.`

```js starter
// Create your variables here


// Print the sentence here

```

```js tests
test("myName is a string", () => expect(myName).toBeType("string"));
test("age is a number", () => expect(age).toBeType("number"));
test("the sentence is printed exactly", () =>
  expect($logs).toContain(`My name is ${myName} and I am ${age} years old.`));
```

```js solution
const myName = "Sam";
let age = 31;

console.log(`My name is ${myName} and I am ${age} years old.`);
```

+++ hint
A template literal uses backticks: `` `My name is ${myName} ...` ``
+++
+++ hint
Watch the details: the full stop at the end, and the spaces around the values.
+++

=== exercise: Fix the bugs
This code should print `20`, but it has two bugs. Run it, read the error, and fix it. Keep the variable names the same.

```js starter
const score = 10;
score = score + 5;

const bonus = "5";
const total = score + bonus;

console.log(total);
```

```js tests
test("score ends up as 15", () => expect(score).toBe(15));
test("total is the number 20", () => expect(total).toBe(20));
```

```js solution
let score = 10;
score = score + 5;

const bonus = 5;
const total = score + bonus;

console.log(total);
```

+++ hint
The first error is about `const`. Which keyword lets a variable change?
+++
+++ hint
Once that is fixed, the output is `155` instead of `20`. Look at the type of `bonus`.
+++

=== exercise: Temperature converter
A `celsius` variable is given. Create a `const` called `fahrenheit` using the formula

**F = C × 9 / 5 + 32**

Then print a line like `25°C is 77°F`.

```js starter
const celsius = 25;

// Your code here

```

```js tests
test("fahrenheit is 77", () => expect(fahrenheit).toBe(77));
test("prints '25°C is 77°F'", () => expect($logs).toContain("25°C is 77°F"));
```

```js solution
const celsius = 25;

const fahrenheit = celsius * 9 / 5 + 32;
console.log(`${celsius}°C is ${fahrenheit}°F`);
```

+++ hint
`const fahrenheit = celsius * 9 / 5 + 32;`
+++

=== exercise: Hours, minutes, seconds
`totalSeconds` holds a duration. Work out how many whole `hours`, `minutes` and `seconds` that is, and store each in a `const` with those names.

For 3725 seconds the answer is 1 hour, 2 minutes and 5 seconds.

```js starter
const totalSeconds = 3725;

// Your code here

console.log(`${hours}h ${minutes}m ${seconds}s`);
```

```js tests
test("hours is 1", () => expect(hours).toBe(1));
test("minutes is 2", () => expect(minutes).toBe(2));
test("seconds is 5", () => expect(seconds).toBe(5));
```

```js solution
const totalSeconds = 3725;

const hours = Math.floor(totalSeconds / 3600);
const minutes = Math.floor((totalSeconds % 3600) / 60);
const seconds = totalSeconds % 60;

console.log(`${hours}h ${minutes}m ${seconds}s`);
```

+++ hint
There are 3600 seconds in an hour. `Math.floor` rounds down to a whole number.
+++
+++ hint
`%` gives the remainder. `totalSeconds % 3600` is the seconds left over after taking out the whole hours.
+++
