---
id: js-2
week: 1
session: 2
lang: js
title: Decisions and loops
minutes: 60
summary: Make your code choose between paths with `if`, and repeat work with loops.
goals: Compare values with `===`, `<` and friends | Choose what runs with `if`, `else if` and `else` | Combine conditions with `&&`, `||` and `!` | Repeat code with `for`, `while` and `for...of`
---

=== step: Comparing values
A **comparison** asks a yes/no question and gives back a boolean: `true` or `false`.

```js
const age = 20;
console.log(age > 18);     // greater than
console.log(age < 18);     // less than
console.log(age >= 20);    // greater than or equal
console.log(age <= 19);    // less than or equal
console.log(age === 20);   // equal
console.log(age !== 20);   // not equal
```

+++ guide
Remember: a single `=` stores a value. To **compare**, use three: `===`. To check "not equal", use `!==`.

Strings can be compared too. `"apple" === "apple"` is `true`, and comparisons are case-sensitive, so `"Apple" === "apple"` is `false`.
+++

=== step: Why === and not ==
JavaScript also has `==` (two equals signs). It converts types before comparing, which leads to strange results. Always use `===`.

```js
console.log(5 == "5");    // true  (converted!)
console.log(5 === "5");   // false (number vs string)
console.log(0 == "");     // true  (surprise)
console.log(0 === "");    // false
```

+++ guide
`===` is called **strict equality**: both the type and the value must match. Linters (tools that check code style) and TypeScript projects almost always require `===`, so get into the habit now.
+++

=== step: Making decisions with if
`if` runs a block of code only when a condition is `true`. `else` runs when it isn't.

```js
const temperature = 28;

if (temperature > 25) {
  console.log("It's hot. Wear shorts.");
} else {
  console.log("Bring a jacket.");
}
```

Change `temperature` to `12` and run it again.

+++ guide
The condition goes in round brackets `( )`. The code to run goes in curly braces `{ }`, called a **block**. Code inside a block is usually indented by two spaces so it is easy to see what belongs to what.
+++

=== step: More than two choices
Chain conditions with `else if`. JavaScript checks them from top to bottom and runs **only the first** one that is true.

```js
const hour = 15;

if (hour < 12) {
  console.log("Good morning");
} else if (hour < 18) {
  console.log("Good afternoon");
} else {
  console.log("Good evening");
}
```

+++ guide
Order matters. If you put `hour < 18` first, it would also catch the morning hours, and "Good morning" could never be printed.

When you compare one value against many fixed options, a `switch` statement can be tidier:

```js
const day = "sat";

switch (day) {
  case "sat":
  case "sun":
    console.log("Weekend!");
    break;
  case "fri":
    console.log("Almost there");
    break;
  default:
    console.log("Work day");
}
```

Each `case` needs a `break`, otherwise the code keeps running into the next case. Most of the time `if`/`else if` is all you need.
+++

=== step: Combining conditions
- `&&` (and): true only if **both** sides are true
- `||` (or): true if **at least one** side is true
- `!` (not): flips true to false and false to true

```js
const age = 25;
const hasTicket = true;

console.log(age >= 18 && hasTicket);   // adult AND has a ticket
console.log(age < 12 || age > 65);     // child OR senior
console.log(!hasTicket);               // NOT has ticket

if (age >= 18 && hasTicket) {
  console.log("Come in!");
}
```

=== step: Truthy and falsy
An `if` doesn't need a real boolean. JavaScript treats some values as false. These are called **falsy**:

`false`, `0`, `""` (empty string), `null`, `undefined` and `NaN`.

Everything else is **truthy**, including `"0"`, `"false"` and `-1`.

```js
const username = "";

if (username) {
  console.log(`Welcome, ${username}`);
} else {
  console.log("Please enter a name");
}

console.log(Boolean("hello"), Boolean(""), Boolean(0), Boolean("0"));
```

+++ guide
This is handy for checks like "is this string empty?", but it can also bite: a count of `0` is falsy, so `if (count)` is false when the count is zero, which may not be what you meant.

`||` is often used to give a fallback value: `const shown = username || "Guest";`. Next week you will meet `??`, which does a similar job more safely.
+++

=== step: The ternary operator
For small either/or choices that produce a value, there is a short form: `condition ? valueIfTrue : valueIfFalse`.

```js
const points = 72;
const result = points >= 50 ? "pass" : "fail";
console.log(result);

const items = 1;
console.log(`You have ${items} ${items === 1 ? "item" : "items"}`);
```

+++ guide
Use a ternary when it stays readable on one line. If you need more than two outcomes, an `if`/`else if` chain is clearer.
+++

=== quiz
? What does this print?
```js static
const n = 0;
if (n) {
  console.log("A");
} else {
  console.log("B");
}
```
- `A`
* `B`
- Nothing
- An error
> `0` is falsy, so the `else` branch runs and prints `B`.

=== step: Repeating with while
A `while` loop keeps running its block as long as its condition is true.

```js
let countdown = 5;

while (countdown > 0) {
  console.log(countdown);
  countdown--;
}
console.log("Lift off!");
```

+++ warn
Make sure the condition eventually becomes false. If you forget `countdown--`, the loop never ends. That is called an **infinite loop**. In this site it gets stopped after 5 seconds; in a real program it would freeze.
+++

=== step: The for loop
The `for` loop packs the three parts of a counting loop into one line: **start**; **keep going while**; **step**.

```js
for (let i = 1; i <= 5; i++) {
  console.log(`Lap ${i}`);
}
```

+++ guide
Read it as: start with `i = 1`; keep going while `i <= 5`; after each round add 1 to `i`.

Programmers often call the counter `i` (for "index"). You can count in other steps too:

```js
for (let i = 10; i >= 0; i -= 2) {
  console.log(i);
}
```
+++

=== step: Looping over a string with for...of
`for...of` gives you each item in turn, with no counter needed. It works on strings (one character at a time) and, next week, on lists.

```js
const word = "loop";

for (const letter of word) {
  console.log(letter.toUpperCase());
}
```

=== step: break and continue
- `break` stops the loop completely.
- `continue` skips the rest of this round and goes on to the next.

```js
for (let i = 1; i <= 10; i++) {
  if (i % 2 === 0) {
    continue;          // skip even numbers
  }
  if (i > 7) {
    break;             // stop once we pass 7
  }
  console.log(i);
}
```

=== quiz
? How many times does this loop print?
```js static
for (let i = 0; i < 3; i++) {
  console.log("hi");
}
```
- 2
* 3
- 4
- Forever
> `i` takes the values 0, 1 and 2. When it reaches 3, `i < 3` is false and the loop stops.

=== step: A note about the exercises
From now on most exercises ask you to **finish a function**. You will learn exactly how functions work in the next session. For now:

- Write your code between the curly braces `{ }`.
- The values you are given (like `score`) are ready to use inside.
- Use `return` to hand back the answer: `return "A";`

```js
function describeNumber(n) {
  if (n > 0) {
    return "positive";
  }
  return "zero or negative";
}

console.log(describeNumber(5));
console.log(describeNumber(-3));
```

=== exercise: Grade calculator
Finish `getGrade(score)` so it returns a letter:

| Score | Grade |
| --- | --- |
| 90 or more | `"A"` |
| 80 to 89 | `"B"` |
| 70 to 79 | `"C"` |
| 60 to 69 | `"D"` |
| below 60 | `"F"` |

```js starter
function getGrade(score) {
  // Your code here

}

console.log(getGrade(95));
console.log(getGrade(72));
console.log(getGrade(40));
```

```js tests
test("95 is an A", () => expect(getGrade(95)).toBe("A"));
test("90 is an A (edge case)", () => expect(getGrade(90)).toBe("A"));
test("85 is a B", () => expect(getGrade(85)).toBe("B"));
test("70 is a C", () => expect(getGrade(70)).toBe("C"));
test("61 is a D", () => expect(getGrade(61)).toBe("D"));
test("59 is an F", () => expect(getGrade(59)).toBe("F"));
```

```js solution
function getGrade(score) {
  if (score >= 90) {
    return "A";
  } else if (score >= 80) {
    return "B";
  } else if (score >= 70) {
    return "C";
  } else if (score >= 60) {
    return "D";
  } else {
    return "F";
  }
}

console.log(getGrade(95));
console.log(getGrade(72));
console.log(getGrade(40));
```

+++ hint
Use an `if` / `else if` / `else` chain and check the highest grade first.
+++
+++ hint
`if (score >= 90) { return "A"; } else if (score >= 80) { ... }`
+++

=== exercise: FizzBuzz
A classic. Print the numbers from 1 to 20, one per line, but:

- for multiples of 3 print `Fizz` instead of the number
- for multiples of 5 print `Buzz`
- for multiples of both 3 and 5 print `FizzBuzz`

```js starter
// Print 1 to 20 here

```

```js tests
const expected = [];
for (let i = 1; i <= 20; i++) {
  expected.push(i % 15 === 0 ? "FizzBuzz" : i % 3 === 0 ? "Fizz" : i % 5 === 0 ? "Buzz" : String(i));
}
test("prints 20 lines", () => expect($logs.length).toBe(20));
test("line 3 is Fizz", () => expect($logs[2]).toBe("Fizz"));
test("line 5 is Buzz", () => expect($logs[4]).toBe("Buzz"));
test("line 15 is FizzBuzz", () => expect($logs[14]).toBe("FizzBuzz"));
test("every line is right", () => expect($logs).toEqual(expected));
```

```js solution
for (let i = 1; i <= 20; i++) {
  if (i % 3 === 0 && i % 5 === 0) {
    console.log("FizzBuzz");
  } else if (i % 3 === 0) {
    console.log("Fizz");
  } else if (i % 5 === 0) {
    console.log("Buzz");
  } else {
    console.log(i);
  }
}
```

+++ hint
`i % 3 === 0` is true when `i` is a multiple of 3.
+++
+++ hint
Check "both 3 and 5" **first**. Otherwise 15 gets caught by the "multiple of 3" branch.
+++

=== exercise: Add them up
Finish `sumTo(n)` so it returns the sum of all whole numbers from 1 to `n`. For example `sumTo(4)` is `1 + 2 + 3 + 4 = 10`. Use a loop.

```js starter
function sumTo(n) {
  let total = 0;
  // Your loop here

  return total;
}

console.log(sumTo(4));
```

```js tests
test("sumTo(4) is 10", () => expect(sumTo(4)).toBe(10));
test("sumTo(1) is 1", () => expect(sumTo(1)).toBe(1));
test("sumTo(100) is 5050", () => expect(sumTo(100)).toBe(5050));
test("sumTo(0) is 0", () => expect(sumTo(0)).toBe(0));
```

```js solution
function sumTo(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}

console.log(sumTo(4));
```

+++ hint
`for (let i = 1; i <= n; i++) { ... }` visits every number from 1 to n.
+++
+++ hint
Inside the loop, add `i` to the running total: `total += i;`
+++

=== exercise: Count the vowels
Finish `countVowels(text)` so it returns how many vowels (a, e, i, o, u) are in `text`. Upper and lower case both count.

```js starter
function countVowels(text) {
  // Your code here

}

console.log(countVowels("Hello World"));
```

```js tests
test('"Hello World" has 3 vowels', () => expect(countVowels("Hello World")).toBe(3));
test('"AEIOU" has 5 vowels', () => expect(countVowels("AEIOU")).toBe(5));
test('"rhythm" has 0 vowels', () => expect(countVowels("rhythm")).toBe(0));
test('"" has 0 vowels', () => expect(countVowels("")).toBe(0));
```

```js solution
function countVowels(text) {
  let count = 0;
  for (const letter of text.toLowerCase()) {
    if ("aeiou".includes(letter)) {
      count++;
    }
  }
  return count;
}

console.log(countVowels("Hello World"));
```

+++ hint
Loop over the text with `for (const letter of text) { ... }` and keep a counter.
+++
+++ hint
`"aeiou".includes(letter)` tells you if a letter is a vowel. Call `.toLowerCase()` on the text first so capitals count too.
+++
