---
id: js-5
week: 2
session: 2
lang: js
title: Objects
minutes: 60
summary: Group related data into objects, work with lists of objects, and copy them safely.
goals: Create objects and read, add and change properties | Write methods and use `this` | Work with arrays of objects | Use destructuring, spread and `Object.entries` | Convert data to and from JSON
---

=== step: What an object is
An array is a list in order. An **object** is a set of named values, written in curly braces. Each entry is a **property**: a key, a colon, and a value.

```js
const book = {
  title: "Dune",
  author: "Frank Herbert",
  pages: 412,
  isRead: false,
};

console.log(book);
console.log(book.title);
console.log(book["pages"]);
```

+++ guide
Use **dot notation** (`book.title`) most of the time. Use **brackets** (`book["pages"]`) when the key is in a variable or isn't a simple word:

```js
const user = { name: "Ada", "favourite color": "green" };
const field = "name";

console.log(user[field]);
console.log(user["favourite color"]);
```

Objects are how almost all real data is shaped: a user, a product, a message, a settings file. In TypeScript you will describe these shapes precisely.
+++

=== step: Adding, changing and removing
```js
const user = { name: "Grace", age: 30 };

user.age = 31;               // change
user.email = "g@navy.mil";   // add a new property
delete user.name;            // remove

console.log(user);
console.log(user.phone);     // missing properties are undefined
console.log("email" in user);
```

+++ guide
Like arrays, an object stored in a `const` can still be changed inside. `const` only stops you pointing the variable at a different object.
+++

=== step: Nesting
Values can be anything, including arrays and other objects.

```js
const order = {
  id: 1042,
  customer: { name: "Linus", city: "Helsinki" },
  items: ["keyboard", "mouse"],
};

console.log(order.customer.city);
console.log(order.items[1]);
console.log(order.items.length);
```

=== step: Methods and this
A function stored in an object is called a **method**. Inside a method, `this` refers to the object it was called on.

```js
const counter = {
  count: 0,
  increment() {
    this.count++;
    return this.count;
  },
  describe() {
    return `Count is ${this.count}`;
  },
};

counter.increment();
counter.increment();
console.log(counter.describe());
```

+++ guide
`increment() { ... }` is shorthand for `increment: function () { ... }`.

Watch out: arrow functions don't get their own `this`, so don't use arrows for methods that need `this`. You'll lean on `this` a lot more when you meet classes in week 4.
+++

=== step: Arrays of objects
This is the shape of most real-world data: a list where each item is an object. Everything you learned about `map`, `filter` and `reduce` applies.

```js
const products = [
  { name: "Lamp", price: 30, inStock: true },
  { name: "Desk", price: 150, inStock: false },
  { name: "Chair", price: 85, inStock: true },
];

const available = products.filter((p) => p.inStock);
const names = available.map((p) => p.name);
const totalValue = products.reduce((sum, p) => sum + p.price, 0);
const desk = products.find((p) => p.name === "Desk");

console.log(names);
console.log(totalValue);
console.log(desk);
```

=== quiz
? Given `const p = { name: "Ada", langs: ["js", "ts"] };`, how do you get `"ts"`?
- `p.langs.ts`
- `p[langs][1]`
* `p.langs[1]`
- `p.langs(1)`
> `p.langs` is the array, and `[1]` gets its second item.

=== step: Destructuring and shorthand
**Destructuring** pulls properties out into variables in one line. **Shorthand** does the reverse: if a variable has the same name as the key, you can write it once.

```js
const movie = { title: "Alien", year: 1979, rating: 8.5 };

const { title, year } = movie;
console.log(title, year);

// rename while destructuring, and give a default
const { rating: score, genre = "unknown" } = movie;
console.log(score, genre);

// shorthand: { name: name, age: age } becomes { name, age }
const name = "Ada";
const age = 36;
const person = { name, age };
console.log(person);

// destructuring works in function parameters too
function describe({ title, year }) {
  return `${title} (${year})`;
}
console.log(describe(movie));
```

=== step: Spread: copying and merging
`...` works with objects too. Later properties win.

```js
const defaults = { theme: "light", fontSize: 14, sound: true };
const userSettings = { theme: "dark" };

const settings = { ...defaults, ...userSettings };
console.log(settings);

const updated = { ...settings, fontSize: 16 };
console.log(updated);
console.log(settings.fontSize);   // the original is unchanged
```

+++ guide
Objects are passed by **reference**, just like arrays. Assigning an object to another variable doesn't copy it:

```js
const a = { score: 1 };
const b = a;
b.score = 99;
console.log(a.score);   // 99

const c = { ...a };     // a real (shallow) copy
c.score = 5;
console.log(a.score);   // still 99
```

This is also why `{ x: 1 } === { x: 1 }` is `false`: they're two different objects, even though they look the same.

The spread copy is **shallow**: nested objects inside are still shared. For a full deep copy use `structuredClone(obj)`.

Building new objects instead of changing old ones (`{ ...user, age: 31 }`) is a very common style in modern JavaScript and TypeScript, especially in React.
+++

=== step: Looping over an object
`Object.keys`, `Object.values` and `Object.entries` turn an object into arrays, so you can loop over it.

```js
const stock = { apples: 5, pears: 0, plums: 12 };

console.log(Object.keys(stock));
console.log(Object.values(stock));
console.log(Object.entries(stock));

for (const [fruit, count] of Object.entries(stock)) {
  console.log(`${fruit}: ${count}`);
}
```

+++ guide
Objects also make great **lookup tables** and **counters**:

```js
const words = ["cat", "dog", "cat", "bird", "cat"];
const counts = {};

for (const word of words) {
  counts[word] = (counts[word] || 0) + 1;
}
console.log(counts);
```

If the key isn't there yet, `counts[word]` is `undefined`, so `|| 0` gives a starting value of 0.
+++

=== step: JSON
**JSON** (JavaScript Object Notation) is the text format used to send data between programs and over the internet. It looks almost exactly like JavaScript objects, but keys must be in double quotes.

```js
const user = { name: "Ada", skills: ["maths", "code"] };

const text = JSON.stringify(user);
console.log(text);
console.log(typeof text);

const back = JSON.parse('{"name":"Linus","age":28}');
console.log(back.name, back.age);

console.log(JSON.stringify(user, null, 2));   // pretty printed
```

+++ guide
When you fetch data from a web API, it arrives as JSON text and you `JSON.parse` it into objects. JavaScript has no idea what shape that data has. TypeScript lets you describe it, which is one of its most useful features.
+++

=== quiz
? What does this print?
```js static
const a = { n: 1 };
const b = a;
b.n = 2;
console.log(a.n);
```
- `1`
* `2`
- `undefined`
- An error
> `b` and `a` point at the same object, so changing `b.n` changes what `a` sees too.

=== exercise: Make a book
Write `createBook(title, author, pages)` that returns an object with the properties `title`, `author`, `pages`, and `isLong`, which is `true` when the book has more than 300 pages.

```js starter
function createBook(title, author, pages) {
  // Your code here

}

console.log(createBook("Dune", "Frank Herbert", 412));
```

```js tests
test("has the right properties", () =>
  expect(createBook("Dune", "Frank Herbert", 412)).toEqual({ title: "Dune", author: "Frank Herbert", pages: 412, isLong: true }));
test("a short book is not long", () => expect(createBook("Short", "Me", 120).isLong).toBe(false));
test("exactly 300 pages is not long", () => expect(createBook("Edge", "Me", 300).isLong).toBe(false));
```

```js solution
function createBook(title, author, pages) {
  return {
    title,
    author,
    pages,
    isLong: pages > 300,
  };
}

console.log(createBook("Dune", "Frank Herbert", 412));
```

+++ hint
Return an object literal: `return { title: title, ... };`. With shorthand you can write just `title,`.
+++
+++ hint
`isLong: pages > 300` stores the result of the comparison.
+++

=== exercise: Titles of unread books
Write `unreadTitles(books)` that returns an array with the titles of the books where `isRead` is `false`.

```js starter
function unreadTitles(books) {
  // Your code here

}

const shelf = [
  { title: "Dune", isRead: true },
  { title: "Emma", isRead: false },
  { title: "Ulysses", isRead: false },
];
console.log(unreadTitles(shelf));
```

```js tests
const shelf2 = [
  { title: "Dune", isRead: true },
  { title: "Emma", isRead: false },
  { title: "Ulysses", isRead: false },
];
test("returns the unread titles", () => expect(unreadTitles(shelf2)).toEqual(["Emma", "Ulysses"]));
test("returns [] when all are read", () => expect(unreadTitles([{ title: "A", isRead: true }])).toEqual([]));
```

```js solution
function unreadTitles(books) {
  return books.filter((book) => !book.isRead).map((book) => book.title);
}

const shelf = [
  { title: "Dune", isRead: true },
  { title: "Emma", isRead: false },
  { title: "Ulysses", isRead: false },
];
console.log(unreadTitles(shelf));
```

+++ hint
`filter` for the unread ones, then `map` each book to its title.
+++

=== exercise: Word counter
Write `countWords(text)` that returns an object counting how many times each word appears. Treat upper and lower case the same, and split on spaces.

`countWords("the cat and the hat")` should give `{ the: 2, cat: 1, and: 1, hat: 1 }`.

```js starter
function countWords(text) {
  const counts = {};
  // Your code here

  return counts;
}

console.log(countWords("the cat and the hat"));
```

```js tests
test("counts each word", () => expect(countWords("the cat and the hat")).toEqual({ the: 2, cat: 1, and: 1, hat: 1 }));
test("ignores case", () => expect(countWords("Go go GO")).toEqual({ go: 3 }));
```

```js solution
function countWords(text) {
  const counts = {};
  for (const word of text.toLowerCase().split(" ")) {
    counts[word] = (counts[word] || 0) + 1;
  }
  return counts;
}

console.log(countWords("the cat and the hat"));
```

+++ hint
`text.toLowerCase().split(" ")` gives you an array of words.
+++
+++ hint
For each word: `counts[word] = (counts[word] || 0) + 1;`
+++

=== exercise: Update without changing
Write `updateUser(user, changes)` that returns a **new** object with the changes applied. The original `user` must not change.

```js starter
function updateUser(user, changes) {
  // Your code here

}

const ada = { name: "Ada", age: 36, city: "London" };
const older = updateUser(ada, { age: 37 });
console.log(older);
console.log(ada);
```

```js tests
const original = { name: "Ada", age: 36, city: "London" };
test("applies the changes", () =>
  expect(updateUser(original, { age: 37 })).toEqual({ name: "Ada", age: 37, city: "London" }));
test("can add new properties", () =>
  expect(updateUser({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 }));
test("doesn't change the original", () => {
  updateUser(original, { city: "Paris" });
  expect(original.city).toBe("London");
});
test("returns a different object", () => {
  const result = updateUser(original, {});
  expect(result === original).toBe(false);
});
```

```js solution
function updateUser(user, changes) {
  return { ...user, ...changes };
}

const ada = { name: "Ada", age: 36, city: "London" };
const older = updateUser(ada, { age: 37 });
console.log(older);
console.log(ada);
```

+++ hint
Spread both objects into a new one. Which one should come last so its values win?
+++
