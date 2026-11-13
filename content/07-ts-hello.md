---
id: ts-1
week: 3
session: 1
lang: ts
title: Hello, TypeScript
minutes: 60
summary: See what TypeScript adds to JavaScript, write your first type annotations, and read type errors.
goals: Explain what TypeScript does and when it does it | Annotate variables, parameters and return values | Let type inference do most of the work | Type arrays and tuples | Choose between `any` and `unknown`
---

=== step: The bug TypeScript catches
Here is some JavaScript with a bug. Press **Run**.

```js
function totalPrice(price, quantity) {
  return price * quantity;
}

const fromForm = "3";           // values from forms are always strings
console.log(totalPrice(9.99, fromForm));
console.log(totalPrice(9.99));  // forgot an argument
```

+++ guide
The first call happens to work, by luck, because `*` converts the string. The second gives `NaN`. Neither one warns you. In a real app, this kind of bug can sit unnoticed until a customer sees "NaN" on their invoice.

Now the same code in TypeScript, with types on the parameters. Run it:
+++

+++ slide
Now the same code in TypeScript. Run it:
+++

```ts
function totalPrice(price: number, quantity: number): number {
  return price * quantity;
}

const fromForm = "3";
console.log(totalPrice(9.99, fromForm));
console.log(totalPrice(9.99));
```

+++ guide
TypeScript reports both problems, with the line number, **before** the code runs. In a code editor like VS Code, these show up as red squiggles while you type.
+++

=== step: What TypeScript actually is
TypeScript is JavaScript plus **type annotations**. Running it is a two-step process:

1. The TypeScript **compiler** checks your types and reports errors.
2. It then **removes the types**, leaving plain JavaScript, which is what actually runs.

Types never exist while the program runs. They are a safety check while you write it.

+++ guide
That's why this site shows type errors and *then* still runs the code: by default the compiler still produces JavaScript even when it finds errors. In a real project you'd fix every error before shipping.

Every JavaScript program is already almost valid TypeScript. Everything you learned in weeks 1 and 2 still applies. You're just adding information.

In a real project you install TypeScript with `npm install typescript` and run the compiler with `npx tsc`. Tools like Vite, Next.js and Node.js (version 22.6 and later) can also run TypeScript files directly. On this site, it all happens in your browser.
+++

=== step: Your first annotations
Add a type after a variable name with a colon. The basic types are the ones you already know: `string`, `number`, `boolean`.

```ts
let username: string = "ada";
let age: number = 36;
let isAdmin: boolean = false;

age = 37;          // fine
age = "old";       // error: a string is not a number

console.log(username, age, isAdmin);
```

+++ guide
Type names are lowercase: `string`, not `String`. The capitalised versions exist, but they mean something different and you should avoid them.
+++

=== step: Type inference
You don't need to annotate everything. When you give a variable a value straight away, TypeScript **infers** its type from that value.

```ts
let city = "Oslo";      // inferred as string
let year = 2026;        // inferred as number

city = 42;              // still an error, even without an annotation

const pi = 3.14;        // const: inferred as exactly 3.14
console.log(city, year, pi);
```

+++ guide
In practice:

- **Don't** annotate variables that get a value immediately. Inference does it, and extra annotations are noise.
- **Do** annotate function parameters. TypeScript can't guess what callers will pass.
- Annotating return types is optional, but it's a good habit for important functions. It documents intent and catches mistakes inside the function.

If you hover over a variable in VS Code, it shows you the inferred type.
+++

=== quiz
? `let count = 10;` What type does TypeScript give `count`?
- `any`
* `number`
- `10`
- No type until you write one
> TypeScript infers `number` from the starting value. With `const count = 10` it would infer the exact value `10`, because a const can never change.

=== step: Typing functions
Annotate each parameter, and optionally the return type after the brackets.

```ts
function greet(name: string, excited: boolean = false): string {
  return excited ? `Hello, ${name}!` : `Hello, ${name}.`;
}

const add = (a: number, b: number): number => a + b;

function logMessage(message: string): void {
  console.log(message);
}

console.log(greet("Ada"));
console.log(add(2, 3));
logMessage(greet("Linus", true));
console.log(greet(42));
```

+++ guide
- `void` means "returns nothing useful". Use it for functions that just do something, like logging.
- Optional parameters get a `?`: `function greet(name: string, title?: string)`. Inside the function, `title` is `string | undefined`. More on that `|` in two sessions.
- A parameter with a default value (`excited = false`) is automatically optional, and its type is inferred from the default.
+++

=== step: Reading type errors
Type errors can look scary but follow a pattern: **"Type X is not assignable to type Y"** means "you gave me an X, but I needed a Y".

```ts
function square(n: number): number {
  return n * n;
}

const result: string = square(4);
square("4");
const total = square(2, 3);
```

+++ guide
Read the three errors:

1. `square(4)` returns a `number`, but `result` was declared as a `string`.
2. `"4"` is a string, but the parameter needs a number.
3. `square` takes 1 argument, but got 2.

Always read the **first** error first. Later errors are often side effects of earlier ones.
+++

=== step: Arrays and tuples
Write an array type as `type[]`. Every item must match.

```ts
const scores: number[] = [90, 72, 85];
const names: string[] = ["Ada", "Linus"];
const inferred = [true, false];      // boolean[]

scores.push(100);       // fine
scores.push("100");     // error

const doubled = scores.map((s) => s * 2);   // TypeScript knows this is number[]
console.log(doubled);

// A tuple: fixed length, a type for each position
const point: [number, number] = [3, 4];
const entry: [string, number] = ["age", 36];
console.log(point[0] + point[1], entry[0]);
```

+++ guide
You may also see `Array<number>`, which means the same as `number[]`.

Notice that in `scores.map((s) => s * 2)` you didn't write a type for `s`. TypeScript already knows `scores` holds numbers, so it knows `s` is a number. This is called **contextual typing**, and it's why TypeScript code is usually much less cluttered than you'd expect.
+++

=== step: any and unknown
Sometimes you don't know a value's type, for example data parsed from JSON.

- `any` switches type checking **off**. Anything goes, and you lose all protection.
- `unknown` means "could be anything, so **check before you use it**". It's the safe choice.

```ts
const a: any = JSON.parse('"hello"');
a.toFixed(2);          // no error from TypeScript... but it crashes when run

const u: unknown = JSON.parse('"hello"');
u.toUpperCase();       // error: you must check what it is first

if (typeof u === "string") {
  console.log(u.toUpperCase());   // fine: inside this if, u is a string
}
```

+++ guide
Avoid `any`. Each `any` is a hole in your safety net, and they spread: anything you get from an `any` value is also `any`.

That `typeof` check is called **narrowing**. TypeScript understands it and treats `u` as a string inside the `if`. Narrowing is a big topic, coming in session 3.

Note that there's a runtime error in the output here: `a.toFixed is not a function`. TypeScript couldn't warn you, because you told it to stop checking.
+++

=== quiz
? Which is the safer type for a value you know nothing about?
- `any`
* `unknown`
- `object`
- `never`
> `unknown` forces you to check the value before you use it. `any` turns type checking off.

=== exercise: Add the types
This function works, but its parameters have no types, so TypeScript complains that they are implicitly `any`. Add types to the parameters **and** a return type.

```ts starter
function fullName(first, last) {
  return `${first} ${last}`;
}

console.log(fullName("Ada", "Lovelace"));
```

```js tests
test('fullName("Ada", "Lovelace") is "Ada Lovelace"', () => expect(fullName("Ada", "Lovelace")).toBe("Ada Lovelace"));
```

```ts solution
function fullName(first: string, last: string): string {
  return `${first} ${last}`;
}

console.log(fullName("Ada", "Lovelace"));
```

+++ hint
`function fullName(first: string, last: string): string { ... }`
+++

=== exercise: Fix the type errors
Run this to see the type errors, then fix them. Change the **values or code**, not the type annotations, so that everything is consistent.

```ts starter
let count: number = "3";
const names: string[] = ["Ada", "Linus", 7];

function isLong(text: string): boolean {
  return text.length;
}

const longName = isLong(names[0]);
console.log(count, names, longName);
```

```js tests
test("count is the number 3", () => expect(count).toBe(3));
test("names has three strings", () => expect(names.every((n) => typeof n === "string") && names.length === 3).toBe(true));
test('isLong("Ada") is false (3 characters is not long)', () => expect(isLong("Ada")).toBe(false));
test('isLong("Margaret") is true', () => expect(isLong("Margaret")).toBe(true));
```

```ts solution
let count: number = 3;
const names: string[] = ["Ada", "Linus", "Grace"];

function isLong(text: string): boolean {
  return text.length > 5;
}

const longName = isLong(names[0]);
console.log(count, names, longName);
```

+++ hint
`"3"` in quotes is a string. A list of `string[]` can't contain the number `7`.
+++
+++ hint
`text.length` is a number, but the function promises a boolean. Return a comparison instead, like `text.length > 5`.
+++

=== exercise: Typed average
Write `average(numbers: number[]): number`. Return `0` for an empty array.

```ts starter
// Write average here


console.log(average([2, 4, 9]));
```

```js tests
test("average([2, 4, 9]) is 5", () => expect(average([2, 4, 9])).toBe(5));
test("average([]) is 0", () => expect(average([])).toBe(0));
```

```ts solution
function average(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }
  const total = numbers.reduce((sum, n) => sum + n, 0);
  return total / numbers.length;
}

console.log(average([2, 4, 9]));
```

+++ hint
`function average(numbers: number[]): number { ... }`. The body is the same as the JavaScript version from week 2.
+++

=== exercise: Parse a list of numbers
Write `parseNumbers(input: string): number[]` that turns text like `"4, 8,15"` into `[4, 8, 15]`. Skip any part that isn't a number.

```ts starter
function parseNumbers(input: string): number[] {
  // Your code here

}

console.log(parseNumbers("4, 8,15"));
console.log(parseNumbers("1, two, 3"));
```

```js tests
test('"4, 8,15" gives [4, 8, 15]', () => expect(parseNumbers("4, 8,15")).toEqual([4, 8, 15]));
test('"1, two, 3" gives [1, 3]', () => expect(parseNumbers("1, two, 3")).toEqual([1, 3]));
test('"42" gives [42]', () => expect(parseNumbers("42")).toEqual([42]));
```

```ts solution
function parseNumbers(input: string): number[] {
  return input
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => !Number.isNaN(n));
}

console.log(parseNumbers("4, 8,15"));
console.log(parseNumbers("1, two, 3"));
```

+++ hint
`input.split(",")` gives you the parts. `part.trim()` removes the spaces around each one.
+++
+++ hint
`map` each part to `Number(...)`, then `filter` out the `NaN`s with `Number.isNaN`.
+++
