---
id: ts-6
week: 4
session: 3
lang: ts
title: Async TypeScript and the final project
minutes: 75
summary: Type asynchronous code and errors, then build a small typed task tracker that uses everything from the month.
goals: Type Promises and `async` functions | Describe API data with interfaces | Handle errors typed as `unknown` | Use a `Result` type instead of throwing | Build and test a complete typed program
---

=== step: Typing Promises
An `async` function always returns a Promise. In TypeScript you write that as `Promise<T>`, where `T` is the type of the value it resolves to.

```ts
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function getGreeting(name: string): Promise<string> {
  await wait(200);
  return `Hello, ${name}`;
}

const greeting = await getGreeting("Ada");   // string
console.log(greeting.toUpperCase());

const notAwaited = getGreeting("Linus");     // Promise<string>
console.log(notAwaited.toUpperCase());       // error: forgot to await!
```

+++ guide
That second error is a real lifesaver. Forgetting `await` is one of the most common async bugs in JavaScript, and TypeScript catches it because a `Promise<string>` isn't a `string`.
+++

=== step: Typing data from an API
Data from the network arrives as JSON with no type information. You describe what you **expect** with an interface. Here `fakeFetch` stands in for a real API.

```ts
interface Post {
  id: number;
  title: string;
  likes: number;
  tags: string[];
}

const database: Post[] = [
  { id: 1, title: "Why types?", likes: 42, tags: ["ts"] },
  { id: 2, title: "Async in 5 minutes", likes: 17, tags: ["js", "async"] },
];

async function fakeFetch(url: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 200));
  return JSON.stringify(database);
}

async function getPosts(): Promise<Post[]> {
  const text = await fakeFetch("/api/posts");
  return JSON.parse(text) as Post[];
}

const posts = await getPosts();
const popular = posts.filter((p) => p.likes > 20).map((p) => p.title);
console.log(popular);
```

+++ guide
`JSON.parse` returns `any`, and `as Post[]` tells TypeScript to trust you. It doesn't check anything. If the server sends a different shape, you won't find out until something breaks.

In real projects people use **validation libraries** such as Zod or Valibot. You describe the shape once; the library checks the data while the program runs and gives you a TypeScript type for free. That's a great next step after this course.

With the real browser `fetch` it looks like:

```ts static
async function getPosts(): Promise<Post[]> {
  const response = await fetch("https://example.com/api/posts");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Post[];
}
```
+++

=== step: Errors are unknown
In a `catch` block, the error has type `unknown`, because JavaScript lets you throw **anything**, not only `Error` objects. Narrow it before you use it.

```ts
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Something went wrong";
}

try {
  JSON.parse("{ broken");
} catch (error) {
  console.log(error.message);              // error: 'error' is of type 'unknown'
  console.log(getErrorMessage(error));     // fine
}

try {
  throw "a plain string";
} catch (error) {
  console.log(getErrorMessage(error));
}
```

+++ guide
A small helper like `getErrorMessage` is worth keeping in every project.
+++

=== step: Returning results instead of throwing
Throwing hides failure: nothing in a function's type says it might throw. An alternative is to **return** success or failure as a discriminated union. Then TypeScript forces the caller to handle both.

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function parseAge(input: string): Result<number> {
  const age = Number(input);
  if (Number.isNaN(age)) return { ok: false, error: `"${input}" is not a number` };
  if (age < 0 || age > 150) return { ok: false, error: "Age out of range" };
  return { ok: true, value: age };
}

for (const input of ["36", "abc", "-4"]) {
  const result = parseAge(input);
  if (result.ok) {
    console.log("Age:", result.value);
  } else {
    console.log("Problem:", result.error);
  }
}
```

+++ guide
This combines three things from this course: a generic type (`Result<T>`), a discriminated union (on `ok`) and narrowing. You'll see this pattern in many TypeScript codebases. Both styles are fine; use throwing for truly unexpected problems and `Result` for failures that are a normal part of the job, like invalid user input.
+++

=== quiz
? `async function load(): Promise<number[]> { ... }`. What is the type of `load()` **without** `await`?
- `number[]`
* `Promise<number[]>`
- `number`
- `void`
> Calling an async function gives you a Promise. You need `await load()` to get the `number[]`.

=== step: The final project
The last two exercises are a small **task tracker**, built in two parts. It uses almost everything from the month:

- **interfaces** and **literal union types** for the data
- a **class** with **private** state
- **array methods** (`filter`, `map`, `find`, `reduce`, `sort`)
- **optional** properties and **`Partial`**
- **errors** for invalid actions
- a **`Record`** for counting

Work through part 1 first. When all its checks pass, move to part 2, which starts from a finished part 1.

+++ guide
Tips for working on a bigger exercise:

- Read every requirement before writing code.
- Implement one method at a time and press **Run** often. Use `console.log` to look at what you've got.
- Press **Check answer** early. The failing checks tell you what's left.
- Hints are fine. So is looking at the solution, as long as you then rebuild it yourself without peeking.
+++

=== step: Where to go next
After this month you know enough to start real projects. Good next steps:

1. **Set up TypeScript locally.** Install Node.js and VS Code, then run `npm create vite@latest` and pick the "Vanilla + TypeScript" template. You get a real project with `tsconfig.json`, instant type errors in the editor, and a browser preview.
2. **Read the TypeScript Handbook** at typescriptlang.org/docs. You'll recognise most of it now.
3. **Build something small you care about**: a budget tracker, a quiz, a habit counter. Building teaches more than reading.
4. **Pick a framework** when you're ready: React with TypeScript for websites, or Node.js with Express or Hono for servers.

Keep coming back to the playground on this site to try ideas quickly.

=== exercise: Task tracker, part 1
Build a `TaskTracker` class. The types are given.

- `add(title: string, priority: Priority): Task` creates a task with the next id (1, 2, 3, ...), `done: false`, stores it, and returns it. If the title is empty or only spaces, **throw** an `Error` with the message `"Title is required"`.
- `complete(id: number): void` marks a task as done. If there's no task with that id, **throw** an `Error` with the message `"Task not found"`.
- `list(filter?: "all" | "open" | "done"): Task[]` returns the tasks (default `"all"`), optionally only open or only done ones.

```ts starter
type Priority = "low" | "medium" | "high";

interface Task {
  id: number;
  title: string;
  priority: Priority;
  done: boolean;
}

class TaskTracker {
  private tasks: Task[] = [];
  private nextId = 1;

  add(title: string, priority: Priority): Task {
    // Your code here
  }

  complete(id: number): void {
    // Your code here
  }

  list(filter: "all" | "open" | "done" = "all"): Task[] {
    // Your code here
  }
}

const tracker = new TaskTracker();
tracker.add("Learn generics", "high");
tracker.add("Buy milk", "low");
tracker.complete(1);
console.log(tracker.list("open"));
console.log(tracker.list("done"));
```

```js tests
test("add returns a task with id 1", () => {
  const t = new TaskTracker();
  expect(t.add("A", "low")).toEqual({ id: 1, title: "A", priority: "low", done: false });
});
test("ids count up", () => {
  const t = new TaskTracker();
  t.add("A", "low");
  expect(t.add("B", "high").id).toBe(2);
});
test("empty titles throw 'Title is required'", () => {
  const t = new TaskTracker();
  expect(() => t.add("   ", "low")).toThrow("Title is required");
});
test("complete marks a task done", () => {
  const t = new TaskTracker();
  t.add("A", "low");
  t.complete(1);
  expect(t.list()[0].done).toBe(true);
});
test("complete with an unknown id throws 'Task not found'", () => {
  const t = new TaskTracker();
  expect(() => t.complete(99)).toThrow("Task not found");
});
test("list filters open and done", () => {
  const t = new TaskTracker();
  t.add("A", "low");
  t.add("B", "low");
  t.add("C", "low");
  t.complete(2);
  expect(t.list("open").map((x) => x.title)).toEqual(["A", "C"]);
  expect(t.list("done").map((x) => x.title)).toEqual(["B"]);
  expect(t.list().length).toBe(3);
});
```

```ts solution
type Priority = "low" | "medium" | "high";

interface Task {
  id: number;
  title: string;
  priority: Priority;
  done: boolean;
}

class TaskTracker {
  private tasks: Task[] = [];
  private nextId = 1;

  add(title: string, priority: Priority): Task {
    if (title.trim() === "") {
      throw new Error("Title is required");
    }
    const task: Task = { id: this.nextId, title, priority, done: false };
    this.nextId++;
    this.tasks.push(task);
    return task;
  }

  complete(id: number): void {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error("Task not found");
    }
    task.done = true;
  }

  list(filter: "all" | "open" | "done" = "all"): Task[] {
    if (filter === "open") return this.tasks.filter((t) => !t.done);
    if (filter === "done") return this.tasks.filter((t) => t.done);
    return [...this.tasks];
  }
}

const tracker = new TaskTracker();
tracker.add("Learn generics", "high");
tracker.add("Buy milk", "low");
tracker.complete(1);
console.log(tracker.list("open"));
console.log(tracker.list("done"));
```

+++ hint
In `add`: check `title.trim() === ""` first, then build a `Task` object using `this.nextId`, increase `nextId`, push the task and return it.
+++
+++ hint
In `complete`: `const task = this.tasks.find((t) => t.id === id);`. TypeScript knows `task` might be `undefined`, so check it before setting `task.done = true`.
+++
+++ hint
In `list`: return `this.tasks.filter(...)` for "open" and "done", and a copy `[...this.tasks]` for "all".
+++

=== exercise: Task tracker, part 2
Part 1 is finished below. Add three more methods:

- `update(id: number, changes: Partial<Omit<Task, "id">>): Task` applies the changes to the task and returns it. Throw `"Task not found"` for an unknown id.
- `byPriority(): Task[]` returns **open** tasks sorted high, then medium, then low. Tasks with the same priority keep their order.
- `summary(): Record<Priority, number>` counts **open** tasks per priority, like `{ high: 1, medium: 0, low: 2 }`.

```ts starter
type Priority = "low" | "medium" | "high";

interface Task {
  id: number;
  title: string;
  priority: Priority;
  done: boolean;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

class TaskTracker {
  private tasks: Task[] = [];
  private nextId = 1;

  add(title: string, priority: Priority): Task {
    if (title.trim() === "") throw new Error("Title is required");
    const task: Task = { id: this.nextId++, title, priority, done: false };
    this.tasks.push(task);
    return task;
  }

  private find(id: number): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    return task;
  }

  complete(id: number): void {
    this.find(id).done = true;
  }

  list(filter: "all" | "open" | "done" = "all"): Task[] {
    if (filter === "open") return this.tasks.filter((t) => !t.done);
    if (filter === "done") return this.tasks.filter((t) => t.done);
    return [...this.tasks];
  }

  // update(...)

  // byPriority(...)

  // summary(...)
}

const tracker = new TaskTracker();
tracker.add("Write report", "medium");
tracker.add("Fix bug", "high");
tracker.add("Water plants", "low");
tracker.add("Book dentist", "low");
tracker.update(4, { priority: "high" });
tracker.complete(1);

console.log(tracker.byPriority().map((t) => `${t.priority}: ${t.title}`));
console.log(tracker.summary());
```

```js tests
function makeTracker() {
  const t = new TaskTracker();
  t.add("Write report", "medium");
  t.add("Fix bug", "high");
  t.add("Water plants", "low");
  t.add("Book dentist", "low");
  return t;
}
test("update changes fields and returns the task", () => {
  const t = makeTracker();
  const u = t.update(4, { priority: "high", title: "Call dentist" });
  expect(u).toEqual({ id: 4, title: "Call dentist", priority: "high", done: false });
  expect(t.list()[3].priority).toBe("high");
});
test("update with an unknown id throws 'Task not found'", () => {
  expect(() => makeTracker().update(99, { done: true })).toThrow("Task not found");
});
test("byPriority sorts open tasks high to low", () => {
  const t = makeTracker();
  expect(t.byPriority().map((x) => x.title)).toEqual(["Fix bug", "Write report", "Water plants", "Book dentist"]);
});
test("byPriority leaves out done tasks", () => {
  const t = makeTracker();
  t.complete(2);
  expect(t.byPriority().map((x) => x.title)).toEqual(["Write report", "Water plants", "Book dentist"]);
});
test("summary counts open tasks per priority", () => {
  const t = makeTracker();
  t.complete(1);
  expect(t.summary()).toEqual({ high: 1, medium: 0, low: 2 });
});
test("summary includes priorities with 0 tasks", () => {
  expect(new TaskTracker().summary()).toEqual({ high: 0, medium: 0, low: 0 });
});
```

```ts solution
type Priority = "low" | "medium" | "high";

interface Task {
  id: number;
  title: string;
  priority: Priority;
  done: boolean;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

class TaskTracker {
  private tasks: Task[] = [];
  private nextId = 1;

  add(title: string, priority: Priority): Task {
    if (title.trim() === "") throw new Error("Title is required");
    const task: Task = { id: this.nextId++, title, priority, done: false };
    this.tasks.push(task);
    return task;
  }

  private find(id: number): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    return task;
  }

  complete(id: number): void {
    this.find(id).done = true;
  }

  list(filter: "all" | "open" | "done" = "all"): Task[] {
    if (filter === "open") return this.tasks.filter((t) => !t.done);
    if (filter === "done") return this.tasks.filter((t) => t.done);
    return [...this.tasks];
  }

  update(id: number, changes: Partial<Omit<Task, "id">>): Task {
    const task = this.find(id);
    Object.assign(task, changes);
    return task;
  }

  byPriority(): Task[] {
    return this.list("open").sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  summary(): Record<Priority, number> {
    const counts: Record<Priority, number> = { high: 0, medium: 0, low: 0 };
    for (const task of this.list("open")) {
      counts[task.priority]++;
    }
    return counts;
  }
}

const tracker = new TaskTracker();
tracker.add("Write report", "medium");
tracker.add("Fix bug", "high");
tracker.add("Water plants", "low");
tracker.add("Book dentist", "low");
tracker.update(4, { priority: "high" });
tracker.complete(1);

console.log(tracker.byPriority().map((t) => `${t.priority}: ${t.title}`));
console.log(tracker.summary());
```

+++ hint
`update` can use the private `find` helper, then `Object.assign(task, changes)` copies the changes onto the task.
+++
+++ hint
`byPriority`: `this.list("open")` already returns a new array, so you can `sort` it directly. Compare `PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]`.
+++
+++ hint
`summary`: start from `{ high: 0, medium: 0, low: 0 }` and add one for each open task: `counts[task.priority]++`.
+++
