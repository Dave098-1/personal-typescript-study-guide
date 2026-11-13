---
id: ts-3
week: 3
session: 3
lang: ts
title: Unions and narrowing
minutes: 60
summary: Say "this or that" with union types, then prove to TypeScript which one you have.
goals: Write union and literal types | Narrow with `typeof`, `in`, `instanceof` and equality checks | Handle `null` and `undefined` with `?.` and `??` | Model data with discriminated unions | Make the compiler check you handled every case
---

=== step: Union types
A **union** says a value can be one of several types. Write it with `|`, read as "or".

```ts
function formatId(id: string | number): string {
  return `ID-${id}`;
}

console.log(formatId(42));
console.log(formatId("abc"));
console.log(formatId(true));   // error: boolean isn't string or number
```

+++ guide
Unions are everywhere in real code: an ID that can be a number or a string, a value that can be a result or `null`, a status that is one of a few options.
+++

=== step: Narrowing with typeof
With a union, TypeScript only lets you do things that work for **every** member. To do something specific, first **narrow** the type with a check. Inside the check, TypeScript knows which one you have.

```ts
function double(value: string | number) {
  // value.toUpperCase();   // error: numbers don't have toUpperCase

  if (typeof value === "string") {
    return value.repeat(2);   // here value is a string
  }
  return value * 2;           // here it must be a number
}

console.log(double("ha"));
console.log(double(21));
```

+++ guide
TypeScript follows the flow of your code. After the `if` returns, it knows that only `number` is left. This is called **control flow analysis**, and it's what makes TypeScript feel smart rather than strict.

Other checks TypeScript understands:

- `Array.isArray(x)` for arrays
- `x instanceof Date` for class instances
- `"key" in x` for objects with a particular property
- `x === null`, `x === "admin"` and other equality checks
- simple truthiness: `if (x) { ... }`
+++

=== step: Literal types
A type can be an **exact value**. Combine literal types in a union to make a list of allowed options.

```ts
type Direction = "up" | "down" | "left" | "right";
type Size = "S" | "M" | "L";
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

function move(direction: Direction) {
  console.log(`Moving ${direction}`);
}

move("up");
move("north");    // error: not one of the allowed values

let shirt: Size = "M";
shirt = "XXL";    // error
```

+++ guide
This replaces a whole category of bugs, like misspelled status strings ("cancelled" vs "canceled"), with compile-time errors. Your editor will also autocomplete the allowed values.
+++

=== quiz
? Given `type Status = "open" | "closed";`, which assignment is an error?
- `const s: Status = "open";`
- `const s: Status = "closed";`
* `const s: Status = "Open";`
- `let s: Status = "closed"; s = "open";`
> Literal types are exact, and case-sensitive. `"Open"` is not `"open"`.

=== step: null and undefined
With TypeScript's `strict` mode (always on in this course, and on in all new projects), `null` and `undefined` aren't allowed unless the type says so. That means you must deal with "missing" values explicitly.

```ts
function findUser(id: number): string | undefined {
  const users: Record<number, string> = { 1: "Ada", 2: "Linus" };
  return users[id];
}

const user = findUser(3);
console.log(user.toUpperCase());     // error: user might be undefined

if (user !== undefined) {
  console.log(user.toUpperCase());   // fine: narrowed to string
} else {
  console.log("No such user");
}
```

+++ guide
This single feature prevents the most common runtime error in JavaScript: "Cannot read properties of undefined".

`Array.prototype.find` returns `T | undefined` for the same reason. The item might not be there.
+++

=== step: Optional chaining and nullish coalescing
Two operators make missing values easy to handle:

- `a?.b` gives `undefined` instead of crashing if `a` is `null` or `undefined`.
- `a ?? b` gives `b` if `a` is `null` or `undefined`; otherwise `a`.

```ts
interface Address { city: string; zip?: string }
interface Customer { name: string; address?: Address }

const ada: Customer = { name: "Ada", address: { city: "London" } };
const linus: Customer = { name: "Linus" };

console.log(ada.address?.city);              // "London"
console.log(linus.address?.city);            // undefined, no crash
console.log(linus.address?.city ?? "Unknown city");
console.log(ada.address?.zip ?? "no zip");

const count = 0;
console.log(count || 10);   // 10: || treats 0 as missing
console.log(count ?? 10);   // 0: ?? only replaces null/undefined
```

+++ guide
Prefer `??` over `||` for default values. `||` replaces every falsy value, including `0`, `""` and `false`, which are often perfectly valid.

These two operators are plain JavaScript (not TypeScript-only), so you can use them anywhere.
+++

=== step: Discriminated unions
A powerful pattern: a union of object types that share one literal property, the **discriminant** (often called `kind` or `type`). Checking that property narrows to the right shape.

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number }
  | { kind: "rect"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    case "rect":
      return shape.width * shape.height;
  }
}

console.log(area({ kind: "circle", radius: 1 }).toFixed(2));
console.log(area({ kind: "rect", width: 2, height: 5 }));
console.log(area({ kind: "square", radius: 3 }));   // error: squares have size, not radius
```

+++ guide
Inside `case "circle":`, TypeScript knows `shape` has a `radius`, and nothing else. Try typing `shape.width` in that case and you'll get an error.

This pattern models a lot of real situations: API responses (`success` or `error`), app states (`loading`, `loaded`, `failed`), events, and messages.
+++

=== step: Checking every case
If you later add a new shape, you want TypeScript to tell you every place that needs updating. Assigning to the type `never` does exactly that.

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.size ** 2;
    default: {
      const unhandled: never = shape;   // error: triangle isn't handled
      throw new Error("Unknown shape");
    }
  }
}

console.log(area({ kind: "square", size: 3 }));
```

+++ guide
`never` is the type of "can't happen". If every case is handled, `shape` in the `default` branch has type `never` and the assignment is fine. If one is missing, TypeScript points straight at it. Add a `case "triangle":` and the error goes away.
+++

=== step: Type assertions
Sometimes you know more than TypeScript does. `value as Type` tells the compiler to treat a value as a certain type. It does **no checking at runtime**, so if you're wrong, things break later.

```ts
const data: unknown = JSON.parse('{"name": "Ada"}');

const user = data as { name: string };
console.log(user.name);

const wrong = data as { age: number };
console.log(wrong.age.toFixed(1));     // compiles, but crashes when run
```

+++ guide
Prefer narrowing (real checks) over assertions. Use `as` sparingly, for example when you've just validated data in a way TypeScript can't follow. Every `as` is a promise you make to the compiler, and it'll believe you.
+++

=== quiz
? What does `0 ?? 5` give?
* `0`
- `5`
- `undefined`
- `null`
> `??` only falls back when the left side is `null` or `undefined`. `0` is a real value, so it's kept. (`0 || 5` would give 5.)

=== exercise: Format an ID
Write `formatId(id: string | number): string`:

- a **number** is padded to 4 digits with a `#`: `42` becomes `"#0042"`
- a **string** is upper-cased: `"ab12"` becomes `"AB12"`

Use `String(n).padStart(4, "0")` to pad.

```ts starter
function formatId(id: string | number): string {
  // Your code here

}

console.log(formatId(42));
console.log(formatId("ab12"));
```

```js tests
test("42 becomes #0042", () => expect(formatId(42)).toBe("#0042"));
test("12345 becomes #12345", () => expect(formatId(12345)).toBe("#12345"));
test('"ab12" becomes "AB12"', () => expect(formatId("ab12")).toBe("AB12"));
```

```ts solution
function formatId(id: string | number): string {
  if (typeof id === "number") {
    return "#" + String(id).padStart(4, "0");
  }
  return id.toUpperCase();
}

console.log(formatId(42));
console.log(formatId("ab12"));
```

+++ hint
`if (typeof id === "number") { ... }` narrows `id` to a number inside the block.
+++

=== exercise: Move on a grid
Define a type `Direction` that only allows `"up"`, `"down"`, `"left"` and `"right"`. Then finish `move` so it returns the new position. `"up"` makes `y` one bigger, `"right"` makes `x` one bigger.

```ts starter
// type Direction = ...

interface Position {
  x: number;
  y: number;
}

function move(pos: Position, direction: Direction): Position {
  // Your code here

}

console.log(move({ x: 0, y: 0 }, "up"));
console.log(move({ x: 2, y: 5 }, "left"));
```

```js tests
test("up increases y", () => expect(move({ x: 0, y: 0 }, "up")).toEqual({ x: 0, y: 1 }));
test("down decreases y", () => expect(move({ x: 0, y: 0 }, "down")).toEqual({ x: 0, y: -1 }));
test("left decreases x", () => expect(move({ x: 2, y: 5 }, "left")).toEqual({ x: 1, y: 5 }));
test("right increases x", () => expect(move({ x: 2, y: 5 }, "right")).toEqual({ x: 3, y: 5 }));
```

```ts solution
type Direction = "up" | "down" | "left" | "right";

interface Position {
  x: number;
  y: number;
}

function move(pos: Position, direction: Direction): Position {
  switch (direction) {
    case "up":
      return { x: pos.x, y: pos.y + 1 };
    case "down":
      return { x: pos.x, y: pos.y - 1 };
    case "left":
      return { x: pos.x - 1, y: pos.y };
    case "right":
      return { x: pos.x + 1, y: pos.y };
  }
}

console.log(move({ x: 0, y: 0 }, "up"));
console.log(move({ x: 2, y: 5 }, "left"));
```

+++ hint
`type Direction = "up" | "down" | "left" | "right";`
+++
+++ hint
A `switch (direction)` with four `case`s, each returning a new `{ x, y }` object.
+++

=== exercise: Areas of shapes
Finish `area` for this discriminated union. A triangle's area is `base * height / 2`.

```ts starter
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  // Your code here

}

console.log(area({ kind: "rect", width: 3, height: 4 }));
console.log(area({ kind: "triangle", base: 10, height: 3 }));
```

```js tests
test("circle with radius 1", () => expect(area({ kind: "circle", radius: 1 })).toBeCloseTo(Math.PI, 4));
test("3 x 4 rectangle", () => expect(area({ kind: "rect", width: 3, height: 4 })).toBe(12));
test("triangle 10 x 3", () => expect(area({ kind: "triangle", base: 10, height: 3 })).toBe(15));
```

```ts solution
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
  }
}

console.log(area({ kind: "rect", width: 3, height: 4 }));
console.log(area({ kind: "triangle", base: 10, height: 3 }));
```

+++ hint
`switch (shape.kind) { case "circle": ... }`. Inside each case, TypeScript knows which properties exist.
+++

=== exercise: Find the city
Write `getCity(customer: Customer): string` that returns the customer's city, or `"Unknown"` if there is no address or no city. Use `?.` and `??`; no `if` needed.

```ts starter
interface Customer {
  name: string;
  address?: {
    street?: string;
    city?: string;
  };
}

function getCity(customer: Customer): string {
  // Your code here

}

console.log(getCity({ name: "Ada", address: { city: "London" } }));
console.log(getCity({ name: "Linus" }));
```

```js tests
test("returns the city when there is one", () => expect(getCity({ name: "Ada", address: { city: "London" } })).toBe("London"));
test("Unknown when there is no address", () => expect(getCity({ name: "Linus" })).toBe("Unknown"));
test("Unknown when the address has no city", () => expect(getCity({ name: "Grace", address: { street: "Main St" } })).toBe("Unknown"));
```

```ts solution
interface Customer {
  name: string;
  address?: {
    street?: string;
    city?: string;
  };
}

function getCity(customer: Customer): string {
  return customer.address?.city ?? "Unknown";
}

console.log(getCity({ name: "Ada", address: { city: "London" } }));
console.log(getCity({ name: "Linus" }));
```

+++ hint
`customer.address?.city` is either a string or `undefined`.
+++
+++ hint
Add `?? "Unknown"` to supply the fallback.
+++
