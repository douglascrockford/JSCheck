# JSCheck

* Douglas Crockford
* 2013-07-22
* Public Domain

**JSCheck** is a testing tool for JavaScript. It was inspired by [QuickCheck](http://en.wikipedia.org/wiki/QuickCheck), a testing tool for Haskell developed by Koen Claessen and John Hughes of Chalmers University of Technology.

**JSCheck** is a specification-driven testing tool. From a description of the properties of a system, function, or object, it will generate random test cases attempting to prove those properties, and then report its findings. That can be especially effective in managing the evolution of a program because it can show the conformance of new code to old code. It also provides an interesting level of self-documentation, because the executable specifications it relies on can provide a good view of the workings of a program.

The **JSCheck** program is loaded from the `**JSCheck**.js` file. It produces a single global variable, `JSC`, which contains the **JSCheck** object.

**JSCheck** is concerned with the specification and checking of _claims_. (We use the term _claim_ instead of _property_ to avoid confusion with JavaScript's use of _property_ to mean a member of an object.) To create a claim, call `JSC.claim`, passing in

*   A name, which is a description of the claim.
*   A predicate, which is a function that returns a verdict of `true` when the claim holds.
*   An array of specifiers, which describe the types of the predicate's parameters.
*   Optionally, a classifier function that can associate each generated case with a classification, or reject meaningless cases.

`JSC.claim` returns a claim function, which may be passed as an argument to the `JSC.check` function, which will randomly generate the cases that will attempt to prove the claim. You can set the number of cases generated per claim with the `JSC.reps` function.

The source is available at [https://github.com/douglascrockford/JSCheck](https://github.com/douglascrockford/JSCheck). This page is available at [http://www.JSCheck.org/](http://www.JSCheck.org/).

## Making a Claim

To make a claim, you pass three or four components to `JSC.claim`, which will then return a function.

#### name

The name is descriptive text that will be used in making the report.

#### predicate

The predicate is a function that will return a verdict of `true` if the claim holds. The predicate will do something with the system in question, perhaps examining its result or examining the consistency of its data structures. If you are testing a set of functions that do encoding and decoding, the predicate can assert things like

```javascript
function predicate(verdict, value) {
    return verdict(value === decode(encode(value)));
}
```

You won't need to select the `value`. **JSCheck** can generate random values for you.

The first parameter to the predicate will always be the `verdict` function. The predicate function uses the `verdict` function to announce the result of the case (`true` if the case succeed, and `false` if it failed). The `verdict` function makes it possible to conduct tests that might be completed in a different turn, such as tests involving event handling, network transactions, or asynchronous file requests.

The remaining parameters must match the specifiers.

#### signature

The signature is an array of specifiers that describe the types of the predicate's arguments. (From a procedural perspective, specifiers are generators, but JavaScript may get a new generator feature which is very different, so to slightly reduce confusion, we will take a declarative view.)

**JSCheck** provides a small library of specifiers that you can use in your claim. For example, `JSC.integer(10)` declares that a parameter should be an integer between 1 and 10\. `JSC.one_of(['Curly', 'Larry', 'Moe'])` declares that a parameter can be one of three strings. Some of the specifiers can be combined, so `JSC.array(JSC.integer(10), JSC.character('a', 'z'))` declares that a parameter can be an array of 1 to 10 lowercase letters.

An array of specifiers can also contain constants (such as string, numbers, or objects), so you can pass anything you need to into the predicate. If you need to pass in a function, then you must wrap the function value with the `JSC.literal` specifier.

You can also [create your own specifiers](#specifiers).

#### classifier

You can optionally pass a classifier function as part of the claim. The classifier will receive the same arguments as the predicate (excluding the `verdict`). A classifier can do two things:

1.  It can examine the arguments, and return a string that classifies the case. The string is descriptive. The report can include a summary showing the number of cases belonging to each classification. This can be used to identify the classes that are trivial or problematic, or to help analyze the results.
2.  Since the cases are being generated randomly, some cases might not be meaningful or useful. The classifier can have a case rejected by returning `false`. **JSCheck** will attempt to generate another case to replace it. It is recommended that the classifier reject fewer than 90% of the cases. If you are accepting less than 10% of the potential cases, then you should probably reformulate your claim.

## The **JSCheck** functions

The **JSCheck** object contains several functions.

### Configuration:

The configuration functions set up the **JSCheck** object.

#### JSC.clear()

The `clear` function reinitializes the **JSCheck** object, discarding its collection of claims and groups.

It returns the **JSCheck** object.

#### JSC.detail(_level_)

By setting the _level_ of detail to a particular number, you can determine how much information is included in the report. The report will be delivered to the function designated with `[JSC.on_report](#on_report)`. The default is 3.

1.  _none_: There will be no report.
2.  _terse_: There will be a minimal report, showing the pass score of each claim.
3.  _failures_: The individual cases that fail will be reported.
4.  _qualification_: The qualification summaries will be reported (default).
5.  _verbose_: All cases will be reported.

It returns the **JSCheck** object.

#### JSC.on_fail(_function(object)_)

The `on_fail` function allows the registration of a callback _function_ that will be given an _object_ for each failed case. This can be used to begin deeper processing. The callback _function_ will be passed an _object_ containing these properties:

*   `args`: The array of arguments of the case.
*   `claim`: The claim function.
*   `classifier`: The classifier function, if there was one.
*   `classification`: The classification string of the case, if there is one.

*   `exception`: The exception object that was thrown by the predicate, if there was one.

*   `group`: The claim group name, if there is one.

*   `name`: The name of the claim.

*   `pass`: `false`.
*   `predicate`: The predicate function.
*   `serial`: The case serial number.
*   `signature`: The signature array.

It returns the **JSCheck** object.

#### JSC.on_lost(_function(object)_)

The `on_lost` function allows the registration of a callback _function_ that will be given an _object_ for each lost case. A case is considered lost if the predicate did not return a boolean verdict within the allotted milliseconds. The callback _function_ will be passed an _object_ containing these properties:

*   `args`: The array of arguments of the case.
*   `claim`: The claim function.
*   `classifier`: The classifier function, if there is one.
*   `classification`: The classification string of the case, if there is one.

*   `exception`: The exception object that was thrown by the predicate, if there was one.

*   `group`: The claim group name, if there is one.

*   `name`: The name of the claim.

*   `pass`: `null`.
*   `predicate`: The predicate function.
*   `serial`: The case serial number.
*   `signature`: The signature array.

#### JSC.on_pass(_function(object)_)

The `on_pass` function allows the registration of a callback _function_ that will be given an _object_ for each passing case. This can be used to trigger further tests or to begin deeper processing or reporting. The callback _function_ will be passed an _object_ containing these properties:

*   `args`: The array of arguments of the case.
*   `claim`: The claim function.
*   `classifier`: The classifier function, if there is one.
*   `classification`: The classification string of the case, if there is one.

*   `exception`: `undefined`.

*   `group`: The claim group name, if there is one.

*   `name`: The name of the claim.

*   `pass`: `true`.
*   `predicate`: The predicate function.
*   `serial`: The case serial number.
*   `signature`: The signature array.

It returns the **JSCheck** object.

#### JSC.<span id="on_report">on_report</span>(_function(string)_)

The `on_report` function allows the registration of a callback _function_ that will be given a _string_ containing the results for each claim. The callback _function_ could route the report to a console or a log or `alert`. The level of detail is set with `JSC.detail`.

It returns the **JSCheck** object.

#### JSC.on_result(_function(object)_)

The `on_result` function allows the registration of a callback _function_ that will be given an _object_ summarizing the check. The callback _function_ will be passed an _object_ containing these properties:

*   `pass:` The number of cases that passed.
*   `fail:` The number of cases that failed.
*   `lost:` The number of cases that did not return a boolean verdict.
*   `ok`: `true` if `pass` is greater than 0 and `fail` and `lost` are both 0.
*   `total`: The total number of cases.

#### JSC.reps(_repetitions_)

The `reps` function allows setting the number of _repetitions_ per claim. The default is 100\. The number of proposed cases could be as many as 10 times this number, to allow for rejection by your classifier function.

It returns the **JSCheck** object.

### Specifiers:

A specifier is a function that returns a function that can generate values of a particular type. The specifiers are used in building the signature that is used to construct a claim.

#### JSC.any()

The `any` specifier returns any random JavaScript value. It is short for `JSC.one_of([JSC.falsy(), JSC.integer(), JSC.number(), JSC.string(), true, Infinity, -Infinity])`.

#### JSC.array()

The `array` specifier returns an array containing random stuff. It is short for `JSC.array(JSC.integer(4), JSC.any())`. So for example,

```javascript
JSC.array()
```

can produce arrays such as

```javascript
["enWsH$",null]
[false,"\\eXt]jBS"," W6"]
[7,"!jd"]
[11]
...
```

#### JSC.array(_array_)

The `array` specifier takes an _array_ as a template. It will go through the _array_, expanding the specifiers it contains. So, for example,

```javascript
JSC.array([
    JSC.integer(),
    JSC.number(100),
    JSC.string(8, JSC.character('A', 'Z'))
])
```

can generate arrays like

```javascript
[3,21.228644298389554,"TJFJPLQA"]
[5,57.05485427752137,"CWQDVXWY"]
[7,91.98980208020657,"QVMGNVXK"]
[11,87.07735128700733,"GXBSVLKJ"]
...
```

#### JSC.array(_dimension_, _value_)

The `array` specifier takes a number and a value, and produces an array using the number as the length of the array, populating the array with the value. So, for example,

```javascript
JSC.array(3, JSC.integer(640))
```

can generate arrays like

```javascript
[305,603,371]
[561,623,477]
[263,534,530]
[163,148,17]
...
```

#### JSC.boolean()

The `boolean` specifier will produce `true` and `false` with equal probability. It is shorthand for `JSC.boolean(0.5)`.

#### JSC.boolean(_bias_)

The `boolean` specifier will produce `true` and `false`. If the _bias_ is 0.50, it will produce them with equal probability. A lower _bias_ will produce more `false`s, and a higher _bias_ will produce more `true`s.

#### JSC.character()

The `character` specifier generates a character. It is short for `JSC.character(32, 127)`. So, for example,

```javascript
JSC.character()
```

can generate strings like

```javascript
"*"
"a"
"J"
"0"
...
```

#### JSC.character(_code_)

The `character` specifier treats its argument as a char code, generating a character.

#### JSC.character(_min_character_, _max_character_)

The `character` specifier generates characters within a given range.

#### JSC.falsy()

The `falsy` specifier generates falsy values: `false`, `null`, `undefined`, `''`, `0`, and `NaN`.

#### JSC.integer()

The `integer` specifier generates prime numbers. Sometimes when testing formulas, it is useful to plug prime numbers into the variables.

#### JSC.integer(_i_)

The `integer` specifier generates an integer between 1 and _i_.

#### JSC.integer(_i_, _j_)

The `integer` specifier generates an integer between _i_ and _j_.

#### JSC.literal(_value_)

The `literal` specifier generates the _value_ without interpreting it. For most values (strings, numbers, boolean, objects, arrays), the `literal` specifier is not needed. It is needed if you want to pass a function _value_ to a predicate, because function values are assumed to be the products of specifiers.

#### JSC.number(_x_)

The `number` specifier produces random numbers between 0 and _x_.

#### JSC.number(_x_, _y_)

The `number` specifier produces random numbers between _x_ and _y_.

#### JSC.object()

The object specifier produces random objects containing random keys and values. So for example.

```javascript
JSC.object()
```

can generate objects like

```javascript
{"adf*:J'mS%":""}
{"_S-":0.23757726117037237,"{U":3,"[":null,":vL|_":"Bl=2C"}
{"pV":0.8472617215011269,"3:":"xV<n>vi`","jGB8y":5,"$<9BFhA":true}
{"1":7,"H@C>":0.01756326947361231}
...</n>
```

#### JSC.object(_n_)

The object specifier makes an object containing _n_ random keys and values.

#### JSC.object(_object_)

The `object` specifier takes an _object_ as a template. It will go through the enumerable own properties of _object_, expanding the specifiers it contains. So, for example,

```javascript
JSC.object({
    left: JSC.integer(640),
    top: JSC.integer(480),
    color: JSC.one_of(['black', 'white', 'red', 'blue', 'green', 'gray'])
})
```

can generate objects like

```javascript
{"left":104,"top":139,"color":"gray"}
{"left":62,"top":96,"color":"white"}
{"left":501,"top":164,"color":"white"}
{"left":584,"top":85,"color":"white"}
...
```

#### JSC.object(keys, values)

The `object` specifier takes an array of keys and produces an object using those keys. The values are taken from an array of values or a specifier. So for example,

```javascript
JSC.object(
    JSC.array(JSC.integer(3, 8), JSC.string(4, JSC.character('a', 'z'))),
    JSC.boolean()
)
```

can generate objects like

```javascript
{"jodo":true,"zhzm":false,"rcqz":true}
{"odcr":true,"azax":true,"bnfx":true,"hmmc":false}
{"wjew":true,"kgqj":true,"abid":true,"cjva":false,"qsgj":true,"wtsu":true}
{"qtbo":false,"vqzc":false,"zpij":true,"ogss":false,"lxnp":false,"psso":true,"irha":true,"ghnj":true}
...
```

and

```javascript
JSC.object(
    ['x', 'y', 'z'],
    [JSC.integer(320), JSC.integer(240), JSC.integer(100)]
)
```

can generate objects like

```javascript
{"x":99,"y":51,"z":51}
{"x":114,"y":166,"z":82}
{"x":35,"y":124,"z":60}
{"x":13,"y":41,"z":63}
...
```

#### JSC.one_of(_array_)

The `one_of` specifier takes an array of specifiers, and selects values from the _array_ with equal probability. So, for example

```javascript
JSC.one_of([
    JSC.number(),
    JSC.boolean(),
    null
])
```

produces values like

```javascript
0.09817210142500699
0.3351482313591987
null
false
...
```

#### JSC.one_of(_array_, _weights_)

The `one_of` specifier takes an _array_ of specifiers and an array of _weights_. The _weights_ are used to adjust the probabilities. So for example,

```javascript
JSC.one_of(
   [1,2,3,4,5,6,7,8,9,10],
   [1,2,3,4,5,6,7,8,9,10]
)
```

produces values like

```javascript
8
10
6
10
...
```

#### JSC.one_of(_string_)

The `one_of` specifier takes a string, and selects one of its characters. So for example,

```javascript
JSC.string(8, JSC.one_of("abcdefgABCDEFG_$"))
```

produces values like

```javascript
"cdgbdB_D"
"$fGE_BAB"
"gEFF_FAe"
"AebGbAbd"
...
```

#### JSC.sequence(_array_)

The `sequence` specifier takes an _array_ of values, and produces them in sequence, repeating the sequence as needed. So for example,

```javascript
JSC.sequence([1, 2])
```

produces values like

```javascript
1
2
1
2
...
```

#### JSC.string()

The `string` specifier makes random ASCII strings. It is short for `JSC.string(JSC.integer(10), JSC.character())`. So for example,

```javascript
JSC.string()
```

produces strings like

```javascript
"hZO*3"
"m-W2@KL"
",P+po0#2 "
"tlt^[ ui`V"
...
```

#### JSC.string(_value_)

The `string` specifier generates the stringification of the _value_, using `JSON.stringify`. So for example,

```javascript
JSC.string(JSC.integer(1000, 9999))
```

produces values like

```javascript
"4791"
"9523"
"2774"
"4288"
...
```

#### JSC.string(_number_, _value_)

The `string` specifier generates strings by joining some number of values. So for example,

```javascript
JSC.string(JSC.integer(1, 8), JSC.one_of("aeiou")))
```

produces values like

```javascript
"ieauae"
"uo"
"iuieio"
"euu"
...
```

Any number of _number_ _value_ pairs can be provided, so

```javascript
JSC.string(
    1, JSC.character('A', 'Z'),
    4, JSC.character('a', 'z'),
    6, JSC.character('1', '9'),
    1, JSC.one_of('!@#$%')
)
```

produces values like

```javascript
"Zsopx171765#"
"Nfafw851294%"
"Gtyef393138%"
"Lrxav768561%"
...
```

### Claim processing:

The `JSC.claim` function creates claims, and the `JSC.check` function tests claims by generating the cases and produces the reports.

#### JSC.check(_milliseconds_)

Process all of the claims that have been constructed since the beginning or since the most recent call to `JSC.clear`.

If the _milliseconds_ are specified, that determines the amount of time to wait before declaring that the unfinished cases are lost. The default is to wait forever.

It returns the **JSCheck** object.

#### JSC.check(_group_, _milliseconds_)

Process all of the claims of a specific group.

If the _milliseconds_ are specified, that determines the amount of time to wait before declaring that the unfinished cases are lost. The default is to wait forever.

It returns the **JSCheck** object.

#### JSC.check(_claim_, _milliseconds_)

Process the specific _claim_ function.

If the _milliseconds_ are specified, that determines the amount of time to wait before declaring that the unfinished cases are lost. The default is to wait forever.

It returns the **JSCheck** object.

#### JSC.claim(_name_, _predicate_, _signature_)

The `claim` function takes a _name_, a _predicate_ function, and a _signature_.

The _predicate_ function should `return verdict(true)` if a case passes, and `return verdict(false)` if the case fails.

The _signature_ is an array of _specifiers_. The _signature_ looks like a type declaration for the _predicate_ function.

It returns a function that can be processed by `JSC.check`.

#### JSC.claim(_name_, _predicate_, _signature_, _classifier_, _dont_)

The `claim` function takes a _name_, a _predicate_ function, and an array of _specifiers_.

The _predicate_ function should `return verdict(true)` if a case passes, and `return verdict(false)` if the case fails. It will take a list of arguments that is generated by the array of _specifiers_. The array of _specifiers_ looks like a type declaration for the _predicate_ function.

The _signature_ is an array of _specifiers_. The _signature_ looks like a type declaration for the _predicate_ function.

The _classifier_ function is called before each call of the _predicate_ function. It gets a chance to determine if the random values in its arguments will be a reasonable case. It can return `false` if the case should be rejected and a new case generated to replace it. The _classifier_ function can instead return a descriptive string that describes the case. These can be counted and displayed in the report.

If _dont_ is true, then the claim will not be added to a group, nor will it be added to the set of all claims.

It returns a function that can be processed by `JSC.check`.

#### JSC.group(_name_)

The `group` function is used to specify a group _name_ that will be attached to all new claims. This makes it easy to process a group of claims together.

#### JSC.test(_name_, _predicate_, _signature_, _classifier_, _milliseconds_)

The `test` function calls the `check` function, passing the result of the `claim` function.

## Writing specifiers

**JSCheck** provides a small set of specifiers that can be combined in many ways. For some purposes, you may need to create your own specifiers. It is easy to do. A specifier is a function that returns a function.

```javascript
my_specifier = function specifier(param1, param2) {

// per claim processing happens in here

    return function generator() {

// per case processing happen in here

        return value;
    };
}
```

The generator function that is returned will be stored in the signature array, and will be called for each value that needs to be generated. It will have access to the specifier's parameters. Its arguments might be other specifiers, so if an argument is a function, use the result of calling the function.

```javascript
intermediate_value = typeof param1 === 'function'
    ? param1()
    : param1;
    ```

## Using **JSCheck**

Since **JSCheck** performs a useful specification and description function as well as a testing function, it is recommended (but not required) that claims be inserted into the relevant source code, and not in separate source files. [JSDev](https://github.com/douglascrockford/JSDev) can make this easy to manage, so that claims can be removed automatically from production code. All of the calls to `JSC` can be hidden in special comments, which are activated during development, and removed by minification in production.

## Demonstration

One difficulty in demonstrating testing systems is that the exposition of the system to be tested is usually significantly more complex than the testing tool being demonstrated. So in this case, we will be testing a trivial function. We will make an incorrect claim. **JSCheck** will help us to find the error in the claim. It might seem counter productive to demonstrate bad claim making, but it turns out that it is as important to get the claims right as it is to get the program right.

We are going to test the `le` function.

```javascript
function le(a, b) {
    return a <= b;
}
```

We will construct a claim. Our predicate simply returns the result of `le`. It takes two integers, one with a max of 10 and another with a max of 20\. We will classify the cases by the relationship between the arguments.

```javascript
JSC.test(
    "Less than",
    function (verdict, a, b) {
        return verdict(le(a, b));
    },
    [
        JSC.integer(10),
        JSC.integer(20)
    ],
    function (a, b) {
        if (a < b) {
            return 'lt';
        } else if (a === b) {
            return 'eq';
        } else {
            return 'gt';
        }
    }
);
```

But when we check the claim, many cases fail. The summary of the specifiers tells the story:

```javascript
eq pass 7
gt pass 0 fail 22
lt pass 71

```

The predicate failed because 22 of the generated cases had an `a` that was larger than `b`. This is because `JSC.integer(10)` produces from the range 1 to 10, and `JSC.integer(20)` produces from the range 1 to 20\. Sometimes the first value will be larger. This tells us that we should make the predicate more sophisticated, or we could have the specifier return `false` instead of `'gt'` to reject those cases.
