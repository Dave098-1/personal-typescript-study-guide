---
id: ts-4
week: 4
session: 1
lang: ts
title: Classes
minutes: 60
summary: Build objects from classes, hide internal details with `private`, and share behaviour with inheritance and interfaces.
goals: Write a class with a constructor, fields and methods | Use `private`, `readonly` and parameter properties | Add getters | Extend a class and override methods | Make a class `implement` an interface
---

=== step: Classes are blueprints
A **class** is a blueprint for creating objects that share the same shape and behaviour. Classes are plain JavaScript; TypeScript adds types to them.

```ts
class Dog {
  name: string;
  tricks: string[] = [];

  constructor(name: string) {
    this.name = name;
  }

  learn(trick: string): void {
    this.tricks.push(trick);
  }

  describe(): string {
    return `${this.name} knows ${this.tricks.length} tricks`;
  }
}

const rex = new Dog("Rex");
rex.learn("sit");
rex.learn("roll over");
console.log(rex.describe());

const fido = new Dog("Fido");
console.log(fido.describe());
console.log(rex);
```

+++ guide
- **Fields** (`name`, `tricks`) are the data each object holds. In TypeScript you declare them at the top of the class.
- The **constructor** runs once when you write `new Dog(...)`. It sets up the new object.
- **Methods** (`learn`, `describe`) are functions every Dog has.
- Inside the class, `this` means "the object this method was called on".

Each object made with `new` is an **instance**. `rex` and `fido` are separate instances with their own data.
+++

=== step: private and readonly
TypeScript lets you control who can touch what:

- `private`: only code inside the class can use it
- `readonly`: can only be set in the constructor
- `public`: anyone can use it (the default)

```ts
class BankAccount {
  readonly owner: string;
  private balance = 0;

  constructor(owner: string) {
    this.owner = owner;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Deposit must be positive");
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount("Ada");
account.deposit(100);
console.log(account.getBalance());

account.balance = 1_000_000;   // error: balance is private
account.owner = "Linus";       // error: owner is readonly
```

+++ guide
Hiding `balance` means the only way to change it is through `deposit`, which checks the amount. The class protects its own rules. This idea is called **encapsulation**.

TypeScript's `private` is only checked at compile time. JavaScript also has truly private fields written with `#`, like `#balance`, which are enforced while the program runs too. Both are fine to use.

`1_000_000` is just `1000000` with underscores for readability.
+++

=== step: Parameter properties
Declaring a field and then assigning it in the constructor is so common that TypeScript has a shortcut: put `private`, `public` or `readonly` in front of a constructor parameter.

```ts
class Point {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  distanceTo(other: Point): number {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}

const a = new Point(0, 0);
const b = new Point(3, 4);
console.log(a.distanceTo(b));
console.log(b.x, b.y);
```

+++ guide
`public readonly x: number` in the constructor both declares the field and assigns it. The empty `{}` body is fine, because there's nothing else to do.
+++

=== step: Getters
A **getter** looks like a property from the outside but is calculated by a method. Write `get` in front of the method.

```ts
class Rectangle {
  constructor(public width: number, public height: number) {}

  get area(): number {
    return this.width * this.height;
  }

  get isSquare(): boolean {
    return this.width === this.height;
  }
}

const r = new Rectangle(3, 4);
console.log(r.area);        // no brackets: it reads like a property
r.width = 4;
console.log(r.area, r.isSquare);
```

+++ guide
There's a matching `set` for setters, which run code when a property is assigned. Getters are handy for values that are always derived from other values, so they can never get out of sync.
+++

=== quiz
? A field is marked `private`. Where can it be used?
- Anywhere
* Only inside the class's own methods
- Only in the constructor
- Nowhere; it's hidden completely
> `private` members can be used by code inside the class, but not from outside it.

=== step: Inheritance with extends
A class can **extend** another, taking all its fields and methods. It can add new ones, and **override** existing ones with its own version.

```ts
class Animal {
  constructor(public name: string) {}

  speak(): string {
    return `${this.name} makes a sound`;
  }
}

class Cat extends Animal {
  constructor(name: string, public indoor: boolean) {
    super(name);   // run Animal's constructor first
  }

  speak(): string {
    return `${this.name} says meow`;
  }
}

const animals: Animal[] = [new Animal("Generic"), new Cat("Tom", true)];
for (const a of animals) {
  console.log(a.speak());
}
```

+++ guide
- `super(...)` calls the parent class's constructor. It's required in a child constructor, before you use `this`.
- `super.speak()` would call the parent's version of a method, if you need it.
- A `Cat` can be used wherever an `Animal` is expected.

Inheritance is easy to overuse. Deep chains of classes extending classes become hard to change. One level, or using interfaces instead, is usually enough.
+++

=== step: Implementing an interface
`implements` makes TypeScript check that a class provides everything an interface describes. Different classes can implement the same interface in completely different ways.

```ts
interface Storage {
  save(key: string, value: string): void;
  load(key: string): string | undefined;
}

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  save(key: string, value: string): void {
    this.data.set(key, value);
  }

  load(key: string): string | undefined {
    return this.data.get(key);
  }
}

class LoudStorage implements Storage {
  save(key: string, value: string): void {
    console.log(`SAVING ${key}=${value}`);
  }
  // error: load is missing
}

const store: Storage = new MemoryStorage();
store.save("theme", "dark");
console.log(store.load("theme"));
```

+++ guide
`Map` is a built-in key/value collection, like an object used as a dictionary but with handy methods (`set`, `get`, `has`, `delete`, `size`). `new Map<string, string>()` says both keys and values are strings.

Code that only depends on the `Storage` interface doesn't care which class it gets. You could swap `MemoryStorage` for one that saves to a database without changing anything else.
+++

=== step: Static members
`static` members belong to the class itself, not to each instance.

```ts
class Temperature {
  static readonly FREEZING_C = 0;

  constructor(public celsius: number) {}

  static fromFahrenheit(f: number): Temperature {
    return new Temperature(((f - 32) * 5) / 9);
  }

  get isFreezing(): boolean {
    return this.celsius <= Temperature.FREEZING_C;
  }
}

const t = Temperature.fromFahrenheit(212);
console.log(t.celsius, t.isFreezing);
console.log(Temperature.FREEZING_C);
```

=== step: Classes or plain objects?
In TypeScript you often don't need a class. Plain objects described by an interface, plus functions that work on them, cover most needs.

Reach for a class when:

- an object has **internal state** that must follow rules (like the bank balance)
- you'll create **many instances** that share behaviour
- a library or framework expects classes

```ts
// Plain data + functions: very common in TypeScript code
interface Todo { id: number; title: string; done: boolean }

const complete = (todo: Todo): Todo => ({ ...todo, done: true });

const t: Todo = { id: 1, title: "Learn classes", done: false };
console.log(complete(t));
```

=== quiz
? In a child class's constructor, what must you call before using `this`?
- `this.constructor()`
* `super(...)`
- `extends(...)`
- `parent()`
> `super(...)` runs the parent's constructor, which sets up the inherited fields.

=== exercise: A bank account
Finish the `BankAccount` class:

- `deposit(amount)` adds to the balance
- `withdraw(amount)` subtracts from the balance, but **throws** an `Error` with the message `"Insufficient funds"` if there isn't enough money
- `balance` must stay `private`, so the class exposes a `getBalance()` method

```ts starter
class BankAccount {
  private balance: number;

  constructor(initial: number) {
    this.balance = initial;
  }

  deposit(amount: number): void {
    // Your code here
  }

  withdraw(amount: number): void {
    // Your code here
  }

  getBalance(): number {
    return this.balance;
  }
}

const acc = new BankAccount(100);
acc.deposit(50);
acc.withdraw(30);
console.log(acc.getBalance());
```

```js tests
test("deposit adds money", () => {
  const a = new BankAccount(100);
  a.deposit(50);
  expect(a.getBalance()).toBe(150);
});
test("withdraw takes money out", () => {
  const a = new BankAccount(100);
  a.withdraw(40);
  expect(a.getBalance()).toBe(60);
});
test("withdrawing too much throws 'Insufficient funds'", () => {
  const a = new BankAccount(10);
  expect(() => a.withdraw(20)).toThrow("Insufficient funds");
});
test("a failed withdrawal leaves the balance alone", () => {
  const a = new BankAccount(10);
  try { a.withdraw(20); } catch (e) {}
  expect(a.getBalance()).toBe(10);
});
```

```ts solution
class BankAccount {
  private balance: number;

  constructor(initial: number) {
    this.balance = initial;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount > this.balance) {
      throw new Error("Insufficient funds");
    }
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const acc = new BankAccount(100);
acc.deposit(50);
acc.withdraw(30);
console.log(acc.getBalance());
```

+++ hint
Use `this.balance += amount;` and `this.balance -= amount;`.
+++
+++ hint
Check `if (amount > this.balance)` **before** subtracting.
+++

=== exercise: A temperature with getters
Write a class `Temperature`:

- the constructor takes `celsius: number` (use a parameter property)
- a getter `fahrenheit` returns `celsius * 9 / 5 + 32`
- a getter `kelvin` returns `celsius + 273.15`

```ts starter
// class Temperature ...


const boiling = new Temperature(100);
console.log(boiling.fahrenheit, boiling.kelvin);
```

```js tests
test("100°C is 212°F", () => expect(new Temperature(100).fahrenheit).toBe(212));
test("0°C is 273.15 K", () => expect(new Temperature(0).kelvin).toBeCloseTo(273.15));
test("fahrenheit follows changes to celsius", () => {
  const t = new Temperature(0);
  t.celsius = 100;
  expect(t.fahrenheit).toBe(212);
});
```

```ts solution
class Temperature {
  constructor(public celsius: number) {}

  get fahrenheit(): number {
    return (this.celsius * 9) / 5 + 32;
  }

  get kelvin(): number {
    return this.celsius + 273.15;
  }
}

const boiling = new Temperature(100);
console.log(boiling.fahrenheit, boiling.kelvin);
```

+++ hint
`constructor(public celsius: number) {}` declares and sets the field in one go.
+++
+++ hint
`get fahrenheit(): number { return ...; }`
+++

=== exercise: Animals that speak
Create a class `Duck` that **extends** `Animal` and overrides `speak()` so it returns `"<name> says quack"`. Also give `Duck` a new method `fly()` that returns `"<name> flies away"`.

```ts starter
class Animal {
  constructor(public name: string) {}

  speak(): string {
    return `${this.name} makes a sound`;
  }
}

// class Duck ...


const donald = new Duck("Donald");
console.log(donald.speak());
console.log(donald.fly());
```

```js tests
test("a Duck says quack", () => expect(new Duck("Donald").speak()).toBe("Donald says quack"));
test("a Duck can fly", () => expect(new Duck("Daisy").fly()).toBe("Daisy flies away"));
test("a Duck is an Animal", () => expect(new Duck("X")).toBeInstanceOf(Animal));
test("Animal still makes a sound", () => expect(new Animal("Cow").speak()).toBe("Cow makes a sound"));
```

```ts solution
class Animal {
  constructor(public name: string) {}

  speak(): string {
    return `${this.name} makes a sound`;
  }
}

class Duck extends Animal {
  speak(): string {
    return `${this.name} says quack`;
  }

  fly(): string {
    return `${this.name} flies away`;
  }
}

const donald = new Duck("Donald");
console.log(donald.speak());
console.log(donald.fly());
```

+++ hint
`class Duck extends Animal { ... }`. You don't need a constructor, because Duck uses Animal's.
+++

=== exercise: Implement an interface
Write a class `MemoryLogger` that **implements** the `Logger` interface. It should keep every message in an array called `messages`, and `count()` should return how many messages were logged. `log` should store the message as `"[level] text"`, for example `"[warn] Disk almost full"`.

```ts starter
type Level = "info" | "warn" | "error";

interface Logger {
  log(level: Level, text: string): void;
  count(): number;
}

// class MemoryLogger implements Logger ...


const logger = new MemoryLogger();
logger.log("info", "App started");
logger.log("warn", "Disk almost full");
console.log(logger.count());
console.log(logger.messages);
```

```js tests
test("starts empty", () => expect(new MemoryLogger().count()).toBe(0));
test("stores formatted messages", () => {
  const l = new MemoryLogger();
  l.log("warn", "Disk almost full");
  expect(l.messages).toEqual(["[warn] Disk almost full"]);
});
test("count() counts messages", () => {
  const l = new MemoryLogger();
  l.log("info", "a");
  l.log("error", "b");
  expect(l.count()).toBe(2);
});
```

```ts solution
type Level = "info" | "warn" | "error";

interface Logger {
  log(level: Level, text: string): void;
  count(): number;
}

class MemoryLogger implements Logger {
  messages: string[] = [];

  log(level: Level, text: string): void {
    this.messages.push(`[${level}] ${text}`);
  }

  count(): number {
    return this.messages.length;
  }
}

const logger = new MemoryLogger();
logger.log("info", "App started");
logger.log("warn", "Disk almost full");
console.log(logger.count());
console.log(logger.messages);
```

+++ hint
`class MemoryLogger implements Logger { messages: string[] = []; ... }`
+++
+++ hint
`log` pushes a template string into `this.messages`; `count` returns `this.messages.length`.
+++
