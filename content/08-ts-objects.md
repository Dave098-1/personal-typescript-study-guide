---
id: ts-2
week: 3
session: 2
lang: ts
title: Describing objects
minutes: 60
summary: Describe the shape of your data with type aliases and interfaces, including optional and read-only properties.
goals: Write object types inline, with `type` and with `interface` | Mark properties optional (`?`) or `readonly` | Extend interfaces to build bigger types | Type functions and dictionaries
---

=== step: Object types
In JavaScript you can put anything into an object. In TypeScript you describe the **shape** an object must have: which properties, and what type each one is.

```ts
const book: { title: string; pages: number } = {
  title: "Dune",
  pages: 412,
};

console.log(book.title.toUpperCase());
console.log(book.author);     // error: no such property
book.pages = "many";          // error: wrong type
```

+++ guide
TypeScript now knows exactly what's in `book`. That means your editor can autocomplete property names, and typos like `book.titel` are caught immediately.

Writing the shape inline gets long and repetitive, though. Next, we give the shape a name.
+++

=== step: Naming a shape with type
A **type alias** gives a name to a type, so you can reuse it.

```ts
type Book = {
  title: string;
  author: string;
  pages: number;
};

const dune: Book = { title: "Dune", author: "Frank Herbert", pages: 412 };
const emma: Book = { title: "Emma", author: "Jane Austen" };   // error: pages is missing

function describe(book: Book): string {
  return `${book.title} by ${book.author}`;
}

console.log(describe(dune));
```

+++ guide
By convention, type names start with a capital letter: `Book`, `User`, `OrderItem`.

`type` can name any type, not just objects: `type Id = string;` or `type Score = number;`. You'll use that a lot next session with unions.
+++

=== step: Interfaces
An **interface** is another way to name an object shape. For objects, it does almost the same job as `type`.

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

function welcome(user: User): string {
  return `Welcome back, ${user.name}!`;
}

const ada: User = { id: 1, name: "Ada", email: "ada@example.com" };
console.log(welcome(ada));
console.log(welcome({ id: 2, name: "Linus" }));
```

+++ guide
**`type` or `interface`?** Both work, and teams argue about it. A simple rule that works well:

- Use `interface` for object shapes, especially ones that other shapes build on.
- Use `type` for everything else: unions, tuples, function types and aliases.

Whichever you choose, be consistent within a project.
+++

=== step: Optional and readonly properties
- `?` after a name makes the property **optional**: it may be missing.
- `readonly` means it can be set when the object is created, but not changed after.

```ts
interface Product {
  readonly id: number;
  name: string;
  price: number;
  description?: string;
}

const lamp: Product = { id: 1, name: "Lamp", price: 30 };   // no description: fine

lamp.price = 25;     // fine
lamp.id = 2;         // error: id is readonly

console.log(lamp.description);              // undefined
console.log(lamp.description.length);       // error: it might be undefined
console.log(lamp.description?.length);      // safe: ?. stops if it's undefined
```

+++ guide
Because `description` is optional, its type is really `string | undefined`. TypeScript won't let you use it as a string until you've handled the `undefined` case. The `?.` operator (optional chaining) gives back `undefined` instead of crashing when the value on its left is missing. More on this next session.
+++

=== quiz
? `interface Pet { name: string; age?: number }`. Which object is **not** a valid `Pet`?
- `{ name: "Rex" }`
- `{ name: "Rex", age: 3 }`
* `{ age: 3 }`
- `{ name: "Rex", age: undefined }`
> `name` is required. Only `age` is optional.

=== step: Extending interfaces
An interface can **extend** another, taking all its properties and adding more.

```ts
interface Animal {
  name: string;
  legs: number;
}

interface Pet extends Animal {
  owner: string;
}

const dog: Pet = { name: "Rex", legs: 4, owner: "Ada" };

function intro(animal: Animal): string {
  return `${animal.name} has ${animal.legs} legs`;
}

console.log(intro(dog));   // a Pet is also an Animal
```

+++ guide
Notice that `intro` asks for an `Animal`, and we passed a `Pet`. That's allowed because a `Pet` has everything an `Animal` needs. TypeScript checks **shapes**, not names. This is called **structural typing**: if it has the right properties, it fits.

With `type`, you do the same thing using `&` (an **intersection**):

```ts
type Animal = { name: string; legs: number };
type Pet = Animal & { owner: string };

const cat: Pet = { name: "Tom", legs: 4, owner: "Grace" };
console.log(cat);
```
+++

=== step: Excess properties
When you write an object literal directly where a type is expected, TypeScript also checks you didn't add **extra** properties. Usually that means you made a typo.

```ts
interface Settings {
  theme: string;
  fontSize: number;
}

const s: Settings = {
  theme: "dark",
  fontsize: 14,     // typo! error: did you mean fontSize?
};
console.log(s);
```

=== step: Typing functions
A function's type describes its parameters and return value, written with an arrow.

```ts
type MathOp = (a: number, b: number) => number;

const add: MathOp = (a, b) => a + b;        // a and b are inferred as number
const multiply: MathOp = (a, b) => a * b;

function calculate(op: MathOp, x: number, y: number): number {
  return op(x, y);
}

console.log(calculate(add, 3, 4));
console.log(calculate(multiply, 3, 4));
console.log(calculate((a, b) => a - b, 10, 4));
```

+++ guide
Objects can include methods in their types too:

```ts
interface Counter {
  count: number;
  increment(): void;
  add(amount: number): number;
}

const c: Counter = {
  count: 0,
  increment() { this.count++; },
  add(amount) { this.count += amount; return this.count; },
};

c.increment();
console.log(c.add(5));
```
+++

=== step: Dictionaries with Record
When an object is used as a lookup table with keys you don't know in advance, describe it with `Record<KeyType, ValueType>`.

```ts
const stock: Record<string, number> = {
  apples: 5,
  pears: 0,
};

stock.plums = 12;          // any string key is fine
stock.kiwis = "lots";      // error: values must be numbers

for (const [fruit, count] of Object.entries(stock)) {
  console.log(fruit, count);
}

type Day = "mon" | "tue" | "wed";
const hours: Record<Day, number> = { mon: 8, tue: 6, wed: 7 };
console.log(hours.tue);
```

+++ guide
The second example uses a **union of strings** as the key type, so the object must have exactly those three keys. You'll learn about unions next session.

You may also see the older syntax `{ [key: string]: number }`, called an index signature. It means the same as `Record<string, number>`.
+++

=== quiz
? Why is it fine to pass a `Pet` (with `name`, `legs` and `owner`) to a function that wants an `Animal` (with `name` and `legs`)?
- Because `Pet` and `Animal` have similar names
* Because a `Pet` has every property an `Animal` needs
- Because TypeScript ignores extra properties in all cases
- It isn't fine; it's an error
> TypeScript compares shapes. Any value with at least the required properties fits. (Extra properties are only flagged when you write an object literal directly.)

=== exercise: Products
Create an `interface Product` with `name` (string), `price` (number) and `inStock` (boolean) so the code below has no type errors. Then finish `formatProduct` so it returns text like:

- `Lamp: $19.99 (in stock)`
- `Desk: $150.00 (sold out)`

Use `price.toFixed(2)` to show two decimals.

```ts starter
// Define the Product interface here


function formatProduct(p: Product): string {
  // Your code here

}

const lamp: Product = { name: "Lamp", price: 19.99, inStock: true };
const desk: Product = { name: "Desk", price: 150, inStock: false };
console.log(formatProduct(lamp));
console.log(formatProduct(desk));
```

```js tests
test("formats an in-stock product", () =>
  expect(formatProduct({ name: "Lamp", price: 19.99, inStock: true })).toBe("Lamp: $19.99 (in stock)"));
test("formats a sold-out product", () =>
  expect(formatProduct({ name: "Desk", price: 150, inStock: false })).toBe("Desk: $150.00 (sold out)"));
```

```ts solution
interface Product {
  name: string;
  price: number;
  inStock: boolean;
}

function formatProduct(p: Product): string {
  const status = p.inStock ? "in stock" : "sold out";
  return `${p.name}: $${p.price.toFixed(2)} (${status})`;
}

const lamp: Product = { name: "Lamp", price: 19.99, inStock: true };
const desk: Product = { name: "Desk", price: 150, inStock: false };
console.log(formatProduct(lamp));
console.log(formatProduct(desk));
```

+++ hint
`interface Product { name: string; price: number; inStock: boolean; }`
+++
+++ hint
A ternary picks the status: `p.inStock ? "in stock" : "sold out"`. In a template literal, a dollar sign followed by `${...}` is written `$${...}`.
+++

=== exercise: Optional email
The `Contact` interface below has an **optional** `email`. Finish `contactLine` so it returns:

- `Ada <ada@example.com>` when there is an email
- `Linus (no email)` when there isn't

```ts starter
interface Contact {
  name: string;
  email?: string;
}

function contactLine(contact: Contact): string {
  // Your code here

}

console.log(contactLine({ name: "Ada", email: "ada@example.com" }));
console.log(contactLine({ name: "Linus" }));
```

```js tests
test("shows the email when present", () =>
  expect(contactLine({ name: "Ada", email: "ada@example.com" })).toBe("Ada <ada@example.com>"));
test("says (no email) when missing", () => expect(contactLine({ name: "Linus" })).toBe("Linus (no email)"));
```

```ts solution
interface Contact {
  name: string;
  email?: string;
}

function contactLine(contact: Contact): string {
  if (contact.email) {
    return `${contact.name} <${contact.email}>`;
  }
  return `${contact.name} (no email)`;
}

console.log(contactLine({ name: "Ada", email: "ada@example.com" }));
console.log(contactLine({ name: "Linus" }));
```

+++ hint
Check `if (contact.email) { ... }` first.
+++

=== exercise: Extend an interface
Create an interface `Employee` that **extends** `Person` and adds `role` (string) and `salary` (number). Then write `raise(employee: Employee, percent: number): Employee` that returns a **new** employee with the salary increased by that percent.

```ts starter
interface Person {
  name: string;
  age: number;
}

// interface Employee ...


// function raise ...


const sam: Employee = { name: "Sam", age: 30, role: "Developer", salary: 50000 };
console.log(raise(sam, 10));
```

```js tests
const sam2 = { name: "Sam", age: 30, role: "Developer", salary: 50000 };
test("raises the salary by 10%", () => expect(raise(sam2, 10).salary).toBeCloseTo(55000));
test("keeps the other properties", () => {
  const r = raise(sam2, 10);
  expect(r.name).toBe("Sam");
  expect(r.role).toBe("Developer");
});
test("doesn't change the original", () => {
  raise(sam2, 50);
  expect(sam2.salary).toBe(50000);
});
```

```ts solution
interface Person {
  name: string;
  age: number;
}

interface Employee extends Person {
  role: string;
  salary: number;
}

function raise(employee: Employee, percent: number): Employee {
  return { ...employee, salary: employee.salary * (1 + percent / 100) };
}

const sam: Employee = { name: "Sam", age: 30, role: "Developer", salary: 50000 };
console.log(raise(sam, 10));
```

+++ hint
`interface Employee extends Person { role: string; salary: number; }`
+++
+++ hint
Return `{ ...employee, salary: ... }`. A 10% raise multiplies the salary by `1 + 10 / 100`.
+++

=== exercise: Function types
A type `Formatter` is given. Write `formatAll(values: number[], format: Formatter): string[]` that applies the formatter to every value. Then create a `Formatter` called `asPercent` that turns `0.25` into `"25%"`.

```ts starter
type Formatter = (value: number) => string;

// function formatAll ...


// const asPercent: Formatter = ...


console.log(formatAll([0.25, 0.5, 1], asPercent));
```

```js tests
test("asPercent(0.25) is '25%'", () => expect(asPercent(0.25)).toBe("25%"));
test("formatAll applies the formatter", () => expect(formatAll([0.25, 0.5, 1], asPercent)).toEqual(["25%", "50%", "100%"]));
test("formatAll works with any formatter", () => expect(formatAll([1, 2], (n) => `#${n}`)).toEqual(["#1", "#2"]));
```

```ts solution
type Formatter = (value: number) => string;

function formatAll(values: number[], format: Formatter): string[] {
  return values.map(format);
}

const asPercent: Formatter = (value) => `${Math.round(value * 100)}%`;

console.log(formatAll([0.25, 0.5, 1], asPercent));
```

+++ hint
`formatAll` is a one-liner with `map`.
+++
+++ hint
`const asPercent: Formatter = (value) => ...`. You don't need to annotate `value`; the `Formatter` type already says it's a number.
+++
