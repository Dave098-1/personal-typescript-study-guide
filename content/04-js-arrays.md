---
id: js-4
week: 2
session: 1
lang: js
title: Arrays
minutes: 60
summary: Keep lists of values in arrays and transform them with `map`, `filter` and `reduce`.
goals: Create arrays and read items by index | Add, remove and find items | Transform lists with `map`, `filter`, `find` and `reduce` | Sort and copy arrays safely
---

=== step: Making a list
An **array** is an ordered list of values, written in square brackets. Each item has a position called its **index**, starting at `0`.

```js
const fruits = ["apple", "banana", "cherry"];

console.log(fruits);
console.log(fruits[0]);              // first item
console.log(fruits[2]);              // third item
console.log(fruits.length);          // how many items
console.log(fruits[fruits.length - 1]);  // last item
console.log(fruits[10]);             // doesn't exist
```

+++ guide
Arrays can hold any type, even a mix (`[1, "two", true]`), though in practice you usually keep one type per array. TypeScript will help enforce that in week 3.

Reading an index that doesn't exist gives `undefined`, not an error. You can also use `fruits.at(-1)` to get the last item.
+++

=== step: Changing an array
Arrays can grow and shrink, even when stored in a `const`. The `const` stops you replacing the whole array with a new one, not changing what's inside it.

```js
const queue = ["Ada", "Grace"];

queue.push("Linus");      // add to the end
console.log(queue);

queue.unshift("Alan");    // add to the start
console.log(queue);

const last = queue.pop(); // remove from the end
console.log(last, queue);

const first = queue.shift(); // remove from the start
console.log(first, queue);

queue[0] = "Margaret";    // replace an item
console.log(queue);
```

=== step: Searching an array
```js
const colors = ["red", "green", "blue"];

console.log(colors.includes("green"));  // is it there?
console.log(colors.indexOf("blue"));    // where is it?
console.log(colors.indexOf("pink"));    // -1 means "not found"
console.log(colors.join(" / "));        // glue into one string
console.log("a,b,c".split(","));        // split a string into an array
```

=== step: Looping over an array
`for...of` gives you each item in turn. If you need the position too, `forEach` passes both.

```js
const scores = [12, 7, 21];

for (const score of scores) {
  console.log(score);
}

scores.forEach((score, index) => {
  console.log(`#${index + 1}: ${score}`);
});
```

=== step: map: transform every item
`map` calls your function on every item and builds a **new array** from what it returns. The original array is unchanged.

```js
const prices = [10, 25, 4];

const withTax = prices.map((price) => price * 1.2);
const labels = prices.map((price) => `$${price}`);

console.log(withTax);
console.log(labels);
console.log(prices);   // untouched
```

+++ guide
Same length in, same length out: `map` always gives back exactly one new item for each old item. Use it whenever you think "turn each X into a Y".
+++

=== step: filter: keep some items
`filter` calls your function on every item and keeps the items where it returns `true`.

```js
const ages = [12, 30, 17, 45, 8];

const adults = ages.filter((age) => age >= 18);
const kids = ages.filter((age) => age < 18);

console.log(adults);
console.log(kids);
```

+++ guide
You can chain these methods, because each one returns a new array:

```js
const words = ["tree", "a", "elephant", "to", "garden"];

const result = words
  .filter((w) => w.length > 3)
  .map((w) => w.toUpperCase());

console.log(result);
```
+++

=== step: find, some and every
```js
const numbers = [3, 8, 12, 5];

console.log(numbers.find((n) => n > 6));      // first match
console.log(numbers.find((n) => n > 100));    // undefined: none found
console.log(numbers.some((n) => n > 10));     // at least one?
console.log(numbers.every((n) => n > 0));     // all of them?
console.log(numbers.findIndex((n) => n === 12));
```

=== step: reduce: boil a list down to one value
`reduce` walks through the array carrying a running result (the **accumulator**). You give it a function and a starting value.

```js
const cart = [5, 12, 3];

const total = cart.reduce((sum, price) => sum + price, 0);
console.log(total);
```

+++ guide
Step by step, with a starting value of `0`:

| Round | sum | price | returns |
| --- | --- | --- | --- |
| 1 | 0 | 5 | 5 |
| 2 | 5 | 12 | 17 |
| 3 | 17 | 3 | 20 |

`reduce` is the most flexible of the array methods, and the hardest to read. When a simple loop or `map`/`filter` does the job, prefer those.

```js
const biggest = [4, 19, 7].reduce((max, n) => (n > max ? n : max), -Infinity);
console.log(biggest);
console.log(Math.max(...[4, 19, 7]));   // an easier way for this one
```
+++

=== quiz
? `[1, 2, 3, 4].filter((n) => n > 2)` gives you...
- `[1, 2]`
* `[3, 4]`
- `[false, false, true, true]`
- `2`
> `filter` keeps the items for which the function returns `true`. `map` would give you the list of booleans.

=== step: Sorting
`sort` reorders an array **in place**, changing the original. Careful: by default it sorts as **text**, even for numbers.

```js
const names = ["Tom", "ann", "Bea"];
console.log([...names].sort());

const nums = [10, 1, 5, 100];
console.log([...nums].sort());                  // text order: wrong for numbers
console.log([...nums].sort((a, b) => a - b));   // smallest first
console.log([...nums].sort((a, b) => b - a));   // biggest first
```

+++ guide
The compare function returns a negative number if `a` should come first, positive if `b` should, and `0` if they're equal. `a - b` does exactly that for numbers.

The `[...nums]` part makes a copy first, so the original isn't changed. That's the spread syntax, coming next. Newer JavaScript also has `toSorted()`, which returns a sorted copy directly.
+++

=== step: Spread, copy and destructure
The **spread** syntax `...` unpacks an array's items. It's the easiest way to copy or combine arrays.

```js
const a = [1, 2];
const b = [3, 4];

const both = [...a, ...b, 5];
const copy = [...a];
copy.push(99);

console.log(both);
console.log(a, copy);    // a is unchanged

console.log([1, 2, 3, 4, 5].slice(1, 3));  // a copy of part of an array

// Destructuring: pull items out into variables
const [first, second, ...rest] = ["gold", "silver", "bronze", "fourth"];
console.log(first, second, rest);
```

+++ guide
Why copy at all? Because arrays are passed around by **reference**: two variables can point at the very same array. Change it through one, and the other sees the change:

```js
const original = [1, 2, 3];
const sameArray = original;
sameArray.push(4);
console.log(original);   // [1, 2, 3, 4]: surprise!
```

Copying with `[...original]` avoids that. You'll see the same idea with objects next session.
+++

=== quiz
? What does `[10, 9, 1].sort()` give?
- `[1, 9, 10]`
* `[1, 10, 9]`
- `[10, 9, 1]`
- `[9, 10, 1]`
> Without a compare function, `sort` compares items as text. `"10"` comes before `"9"` because `"1"` comes before `"9"`. Use `.sort((a, b) => a - b)` for numbers.

=== exercise: Double everything
Write `doubleAll(numbers)` that returns a **new** array with every number doubled. Use `map`.

```js starter
function doubleAll(numbers) {
  // Your code here

}

console.log(doubleAll([1, 2, 3]));
```

```js tests
test("doubles [1, 2, 3]", () => expect(doubleAll([1, 2, 3])).toEqual([2, 4, 6]));
test("works on an empty array", () => expect(doubleAll([])).toEqual([]));
test("doesn't change the original", () => {
  const input = [5, 6];
  doubleAll(input);
  expect(input).toEqual([5, 6]);
});
```

```js solution
function doubleAll(numbers) {
  return numbers.map((n) => n * 2);
}

console.log(doubleAll([1, 2, 3]));
```

+++ hint
`return numbers.map((n) => ...);`
+++

=== exercise: Long words only
Write `longWords(words, minLength)` that returns only the words with at least `minLength` characters, in **upper case**.

```js starter
function longWords(words, minLength) {
  // Your code here

}

console.log(longWords(["sun", "planet", "galaxy", "moon"], 5));
```

```js tests
test("keeps words with 5+ letters", () =>
  expect(longWords(["sun", "planet", "galaxy", "moon"], 5)).toEqual(["PLANET", "GALAXY"]));
test("minLength is inclusive", () => expect(longWords(["abc", "ab"], 3)).toEqual(["ABC"]));
test("returns [] when nothing matches", () => expect(longWords(["a", "b"], 4)).toEqual([]));
```

```js solution
function longWords(words, minLength) {
  return words
    .filter((word) => word.length >= minLength)
    .map((word) => word.toUpperCase());
}

console.log(longWords(["sun", "planet", "galaxy", "moon"], 5));
```

+++ hint
First `filter` by `word.length >= minLength`, then `map` to upper case.
+++

=== exercise: Average score
Write `average(numbers)` that returns the average (the total divided by how many there are). An empty array should return `0`.

```js starter
function average(numbers) {
  // Your code here

}

console.log(average([4, 8, 6]));
```

```js tests
test("average of [4, 8, 6] is 6", () => expect(average([4, 8, 6])).toBe(6));
test("average of [1, 2] is 1.5", () => expect(average([1, 2])).toBe(1.5));
test("average of [] is 0", () => expect(average([])).toBe(0));
```

```js solution
function average(numbers) {
  if (numbers.length === 0) {
    return 0;
  }
  const total = numbers.reduce((sum, n) => sum + n, 0);
  return total / numbers.length;
}

console.log(average([4, 8, 6]));
```

+++ hint
Get the total with `reduce` (or a loop), then divide by `numbers.length`.
+++
+++ hint
Handle the empty array first: `if (numbers.length === 0) return 0;`. Dividing by zero would give `NaN`.
+++

=== exercise: Top scores
Write `topScores(scores, n)` that returns the `n` highest scores, biggest first. It must **not** change the original array.

```js starter
function topScores(scores, n) {
  // Your code here

}

const scores = [40, 95, 72, 88, 61];
console.log(topScores(scores, 3));
console.log(scores);
```

```js tests
test("top 3 of [40, 95, 72, 88, 61]", () => expect(topScores([40, 95, 72, 88, 61], 3)).toEqual([95, 88, 72]));
test("sorts numerically, not as text", () => expect(topScores([9, 100, 20], 2)).toEqual([100, 20]));
test("doesn't change the original", () => {
  const input = [1, 3, 2];
  topScores(input, 2);
  expect(input).toEqual([1, 3, 2]);
});
```

```js solution
function topScores(scores, n) {
  return [...scores].sort((a, b) => b - a).slice(0, n);
}

const scores = [40, 95, 72, 88, 61];
console.log(topScores(scores, 3));
console.log(scores);
```

+++ hint
Copy first with `[...scores]`, then sort with a compare function.
+++
+++ hint
`.sort((a, b) => b - a)` puts the biggest first. `.slice(0, n)` keeps the first `n`.
+++
