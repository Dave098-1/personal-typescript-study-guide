---
id: ts-5
week: 4
session: 2
lang: ts
title: Generics and utility types
minutes: 60
summary: Write functions and types that work with any type while keeping full type safety, and reshape types with built-in helpers.
goals: Write generic functions with type parameters | Build generic interfaces and classes | Limit generics with `extends` constraints | Use `keyof` to work with property names | Use `Partial`, `Pick`, `Omit`, `Readonly` and `Record`
---

=== step: The problem generics solve
Say you want a function that returns the first item of any array. How do you type it?

```ts
function firstAny(items: any[]): any {
  return items[0];
}

const n = firstAny([1, 2, 3]);
n.toUpperCase();     // no error... but n is a number. Crash!
```

+++ guide
Using `any` works, but you lose all type information. TypeScript no longer knows that the first item of a `number[]` is a `number`, so it can't protect you. Writing one function per type (`firstNumber`, `firstString`, ...) would be silly.

**Generics** fix this.
+++

=== step: Your first generic function
A **type parameter**, written in angle brackets like `<T>`, is a placeholder for a type. It gets filled in each time the function is called.

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const n = first([1, 2, 3]);          // T is number
const s = first(["a", "b"]);         // T is string
const nothing = first<boolean>([]);  // you can also say T explicitly

console.log(n, s, nothing);
s?.toUpperCase();     // fine
n?.toUpperCase();     // error: numbers don't have toUpperCase
```

+++ guide
Read `first<T>(items: T[]): T | undefined` as: "for some type `T`, take an array of `T` and return a `T` (or undefined, if the array is empty)".

You almost never have to write the type yourself when calling. TypeScript **infers** `T` from the arguments.

`T` is just a convention, short for "Type". You can use any name, and longer names like `TItem` help when there are several.

You've already been using generics: `Array<number>`, `Promise<string>`, `Map<string, number>` and `Record<string, number>` are all generic types.
+++

=== step: More than one type parameter
```ts
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

function mapValues<T, U>(items: T[], fn: (item: T) => U): U[] {
  const result: U[] = [];
  for (const item of items) {
    result.push(fn(item));
  }
  return result;
}

const p = pair("age", 36);             // [string, number]
const lengths = mapValues(["hi", "hello"], (s) => s.length);   // number[]
console.log(p, lengths);
```

+++ guide
`mapValues` is basically how `Array.prototype.map` is typed. In the call, TypeScript works out `T = string` from the array, then works out `U = number` from what your arrow function returns.
+++

=== step: Generic interfaces and types
Types can have type parameters too. This is how you describe "a box of something" or "an API response containing some data".

```ts
interface ApiResponse<T> {
  ok: boolean;
  data: T;
  fetchedAt: string;
}

interface User { id: number; name: string }

const userResponse: ApiResponse<User> = {
  ok: true,
  data: { id: 1, name: "Ada" },
  fetchedAt: "2026-01-01",
};

const listResponse: ApiResponse<string[]> = {
  ok: true,
  data: ["a", "b"],
  fetchedAt: "2026-01-01",
};

console.log(userResponse.data.name);
console.log(listResponse.data.length);
```

=== step: Generic classes
```ts
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  get size(): number {
    return this.items.length;
  }
}

const numbers = new Stack<number>();
numbers.push(1);
numbers.push(2);
console.log(numbers.pop(), numbers.size);
numbers.push("three");   // error: this is a stack of numbers
```

=== quiz
? `function wrap<T>(value: T): T[] { return [value]; }`. What is the type of `wrap("hi")`?
- `T[]`
- `any[]`
* `string[]`
- `string`
> TypeScript infers `T = string` from the argument, so the return type `T[]` becomes `string[]`.

=== step: Constraints with extends
Sometimes `T` can't be just anything. You need it to have certain properties. Use `extends` to set a **constraint**.

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

console.log(longest("apple", "kiwi"));     // strings have length
console.log(longest([1, 2], [1, 2, 3]));   // arrays have length
console.log(longest(10, 20));              // error: numbers don't have length
```

+++ guide
Without the constraint, `a.length` would be an error. TypeScript can't assume an arbitrary `T` has a `length`. The constraint promises that it does.
+++

=== step: keyof and indexed access
`keyof T` is the union of a type's property names. `T[K]` is the type of the property `K`. Together they let you write safe functions that work with property names.

```ts
interface Book {
  title: string;
  pages: number;
  isRead: boolean;
}

type BookKey = keyof Book;      // "title" | "pages" | "isRead"

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const book: Book = { title: "Dune", pages: 412, isRead: false };

const pages = getProp(book, "pages");     // number
const title = getProp(book, "title");     // string
console.log(pages + 1, title.toUpperCase());
getProp(book, "author");                  // error: not a key of Book
```

+++ guide
`K extends keyof T` means "K must be one of T's property names". The return type `T[K]` then gives exactly the type of that property. Libraries use this pattern all the time, for example for sorting by a field or picking columns from a table.
+++

=== step: Utility types
TypeScript has built-in generic types that transform other types. These save a lot of repetition.

```ts
interface Todo {
  id: number;
  title: string;
  done: boolean;
  dueDate: string;
}

type TodoUpdate = Partial<Todo>;                   // every property optional
type TodoPreview = Pick<Todo, "id" | "title">;     // only these properties
type NewTodo = Omit<Todo, "id">;                   // everything except id
type FrozenTodo = Readonly<Todo>;                  // nothing can be changed

const changes: TodoUpdate = { done: true };
const preview: TodoPreview = { id: 1, title: "Learn generics" };
const draft: NewTodo = { title: "Write tests", done: false, dueDate: "2026-12-01" };

const frozen: FrozenTodo = { id: 1, title: "Fixed", done: false, dueDate: "" };
frozen.done = true;    // error: readonly

console.log(changes, preview, draft);
```

+++ guide
A cheat sheet:

| Utility | What it does |
| --- | --- |
| `Partial<T>` | all properties optional |
| `Required<T>` | all properties required |
| `Readonly<T>` | all properties read-only |
| `Pick<T, K>` | keep only the keys `K` |
| `Omit<T, K>` | remove the keys `K` |
| `Record<K, V>` | an object with keys `K` and values `V` |
| `ReturnType<F>` | the return type of function type `F` |

The big benefit: when `Todo` changes, all the derived types update automatically.
+++

=== quiz
? Given `interface User { id: number; name: string; email: string }`, which type is `{ name: string; email: string }`?
- `Pick<User, "id">`
* `Omit<User, "id">`
- `Partial<User>`
- `keyof User`
> `Omit` removes the listed keys. `Pick<User, "name" | "email">` would also work.

=== exercise: The last item
Write a generic function `last<T>(items: T[]): T | undefined` that returns the last item of an array, or `undefined` for an empty array.

```ts starter
// function last ...


const n = last([1, 2, 3]);
const s = last(["a", "b"]);
console.log(n, s, last([]));
```

```js tests
test("last([1, 2, 3]) is 3", () => expect(last([1, 2, 3])).toBe(3));
test('last(["a", "b"]) is "b"', () => expect(last(["a", "b"])).toBe("b"));
test("last([]) is undefined", () => expect(last([])).toBe(undefined));
```

```ts solution
function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}

const n = last([1, 2, 3]);
const s = last(["a", "b"]);
console.log(n, s, last([]));
```

+++ hint
`function last<T>(items: T[]): T | undefined { ... }`
+++
+++ hint
The last index is `items.length - 1`.
+++

=== exercise: A generic queue
Write a generic class `Queue<T>` (first in, first out) with:

- `enqueue(item: T): void` adds to the back
- `dequeue(): T | undefined` removes and returns the item at the front
- `peek(): T | undefined` returns the front item without removing it
- a getter `size` returning how many items there are

```ts starter
// class Queue<T> ...


const q = new Queue<string>();
q.enqueue("Ada");
q.enqueue("Linus");
console.log(q.peek(), q.size);
console.log(q.dequeue(), q.size);
```

```js tests
test("dequeue returns items in the order added", () => {
  const q = new Queue();
  q.enqueue(1); q.enqueue(2); q.enqueue(3);
  expect(q.dequeue()).toBe(1);
  expect(q.dequeue()).toBe(2);
});
test("peek doesn't remove", () => {
  const q = new Queue();
  q.enqueue("a");
  q.peek();
  expect(q.size).toBe(1);
  expect(q.peek()).toBe("a");
});
test("empty queue returns undefined", () => expect(new Queue().dequeue()).toBe(undefined));
test("size counts items", () => {
  const q = new Queue();
  q.enqueue(1); q.enqueue(1);
  expect(q.size).toBe(2);
});
```

```ts solution
class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  get size(): number {
    return this.items.length;
  }
}

const q = new Queue<string>();
q.enqueue("Ada");
q.enqueue("Linus");
console.log(q.peek(), q.size);
console.log(q.dequeue(), q.size);
```

+++ hint
Look at the `Stack<T>` example in this lesson. A queue is the same, except you take items from the **front**.
+++
+++ hint
`this.items.shift()` removes and returns the first item.
+++

=== exercise: Update with Partial
Write `updateTodo(todo: Todo, changes: Partial<Todo>): Todo` that returns a new todo with the changes applied. Then write `toPreview(todo: Todo): TodoPreview`, where `TodoPreview` is defined with `Pick` to contain only `id` and `title`.

```ts starter
interface Todo {
  id: number;
  title: string;
  done: boolean;
}

// type TodoPreview = ...

// function updateTodo ...

// function toPreview ...


const t: Todo = { id: 1, title: "Learn TypeScript", done: false };
console.log(updateTodo(t, { done: true }));
console.log(toPreview(t));
```

```js tests
const base = { id: 1, title: "Learn TypeScript", done: false };
test("applies changes", () => expect(updateTodo(base, { done: true })).toEqual({ id: 1, title: "Learn TypeScript", done: true }));
test("doesn't change the original", () => {
  updateTodo(base, { title: "Other" });
  expect(base.title).toBe("Learn TypeScript");
});
test("toPreview keeps only id and title", () => expect(toPreview(base)).toEqual({ id: 1, title: "Learn TypeScript" }));
```

```ts solution
interface Todo {
  id: number;
  title: string;
  done: boolean;
}

type TodoPreview = Pick<Todo, "id" | "title">;

function updateTodo(todo: Todo, changes: Partial<Todo>): Todo {
  return { ...todo, ...changes };
}

function toPreview(todo: Todo): TodoPreview {
  return { id: todo.id, title: todo.title };
}

const t: Todo = { id: 1, title: "Learn TypeScript", done: false };
console.log(updateTodo(t, { done: true }));
console.log(toPreview(t));
```

+++ hint
`type TodoPreview = Pick<Todo, "id" | "title">;`
+++
+++ hint
`updateTodo` is the same spread trick as in week 2: `{ ...todo, ...changes }`. In `toPreview`, build the new object property by property, because spreading would keep `done` too.
+++

=== exercise: Pluck a column
Write `pluck<T, K extends keyof T>(items: T[], key: K): T[K][]` that returns the value of one property from every item.

`pluck(books, "title")` should give an array of titles, typed as `string[]`.

```ts starter
// function pluck ...


const books = [
  { title: "Dune", pages: 412 },
  { title: "Emma", pages: 474 },
];
const titles = pluck(books, "title");
const pages = pluck(books, "pages");
console.log(titles, pages);
```

```js tests
const bs = [{ title: "Dune", pages: 412 }, { title: "Emma", pages: 474 }];
test("plucks titles", () => expect(pluck(bs, "title")).toEqual(["Dune", "Emma"]));
test("plucks pages", () => expect(pluck(bs, "pages")).toEqual([412, 474]));
test("empty array gives []", () => expect(pluck([], "x")).toEqual([]));
```

```ts solution
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const books = [
  { title: "Dune", pages: 412 },
  { title: "Emma", pages: 474 },
];
const titles = pluck(books, "title");
const pages = pluck(books, "pages");
console.log(titles, pages);
```

+++ hint
The signature is given in the instructions. Copy it exactly.
+++
+++ hint
The body is a single `map`: `items.map((item) => item[key])`.
+++
