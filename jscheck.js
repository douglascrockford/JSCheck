// jscheck.js
// Douglas Crockford
// 2018-01-08

// Public Domain

// http://www.jscheck.org/

/*jslint for, node */

/*property
    any, args, array, boolean, charAt, charCodeAt, character, check, claim,
    classification, classifier, detail, exception, fail, falsy, floor, forEach,
    fromCharCode, group, integer, isArray, isFinite, join, keys, length,
    literal, lost, map, name, number, object, ok, on_fail, on_lost, on_pass,
    on_report, on_result, one_of, pass, predicate, push, random, reduce,
    replace, reps, resolve, sequence, serial, signature, sort, string,
    stringify, test, total, verdict
*/

const bottom = [false, null, undefined, "", 0, NaN];
const primes = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
    31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
    73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
    127, 131, 137, 139, 149, 151, 157, 163, 167, 173,
    179, 181, 191, 193, 197, 199, 211, 223, 227, 229,
    233, 239, 241, 251, 257, 263, 269, 271, 277, 281,
    283, 293, 307, 311, 313, 317, 331, 337, 347, 349,
    353, 359, 367, 373, 379, 383, 389, 397, 401, 409,
    419, 421, 431, 433, 439, 443, 449, 457, 461, 463,
    467, 479, 487, 491, 499, 503, 509, 521, 523, 541,
    547, 557, 563, 569, 571, 577, 587, 593, 599, 601,
    607, 613, 617, 619, 631, 641, 643, 647, 653, 659,
    661, 673, 677, 683, 691, 701, 709, 719, 727, 733,
    739, 743, 751, 757, 761, 769, 773, 787, 797, 809,
    811, 821, 823, 827, 829, 839, 853, 857, 859, 863,
    877, 881, 883, 887, 907, 911, 919, 929, 937, 941,
    947, 953, 967, 971, 977, 983, 991, 997
];

function resolve(value, ...rest) {

// The resolve function takes a value. If that value is a function, then
// it is called to produce the return value. Otherwise, the value is the
// return value.

    return (typeof value === "function")
        ? value(...rest)
        : value;
}

function integer(value, default_value) {
    value = resolve(value);
    return (typeof value === "number")
        ? Math.floor(value)
        : (typeof value === "string")
            ? value.charCodeAt(0)
            : default_value;
}

function go(func, value) {

// If value is truthy, then pass it to the func, ignoring any exceptions,
// especially if func is not actually a function.

    if (value) {
        try {
            return func(value);
        } catch (ignore) {}
    }
}

export default function JSC() {
    let all = [];       // The collection of all claims
    let detail = 3;     // The current level of report detail
    let groups = {};    // The collection of named groups of claims
    let now_group = ""; // The current group
    let on_fail;        // The function that receives the fail cases
    let on_lost;        // The function that receives the lost cases
    let on_pass;        // The function that receives the pass cases
    let on_report;      // The function that receives the reportage
    let on_result;      // The function that receives the summary
    let reject = {};
    let reps = 100;     // The number of cases to be tried per claim
    let unique;         // Case serial number

    let jsc;
    jsc = {
        any: function () {
            return jsc.one_of([
                jsc.integer(),
                jsc.number(),
                jsc.string(),
                jsc.one_of([
                    true,
                    Infinity,
                    -Infinity,
                    false,
                    null,
                    undefined,
                    "",
                    0,
                    1,
                    NaN
                ])
            ]);
        },
        array: function array(dimension, value) {
            if (Array.isArray(dimension)) {
                return function () {
                    return dimension.map(resolve);
                };
            }
            if (dimension === undefined) {
                dimension = jsc.integer(4);
            }
            if (value === undefined) {
                value = jsc.any();
            }
            return function () {
                let i;
                const n = resolve(dimension);
                const result = [];
                if (Number.isFinite(n)) {
                    for (i = 0; i < n; i += 1) {
                        result.push(resolve(value, i));
                    }
                }
                return result;
            };
        },
        boolean: function (bias) {

// A signature can contain a boolean specification. An optional bias parameter
// can be provided. If the bias is 0.25, then approximately a quarter of the
// booleans produced will be true.

            if (typeof bias === "function") {
                bias = bias();
            }
            if (typeof bias !== "number") {
                bias = 0.50;
            }
            return function () {
                return Math.random() < bias;
            };
        },
        character: function character(i, j) {
            if (j === undefined) {
                if (i === undefined) {
                    i = 32;
                    j = 126;
                } else {
                    return function () {
                        let value = resolve(i);
                        if (typeof value === "number") {
                            return String.fromCharCode(integer(i));
                        }
                        if (typeof value === "string") {
                            return value.charAt(0);
                        }
                        return "?";
                    };
                }
            }
            let ji = jsc.integer(i, j);
            return function () {
                return String.fromCharCode(ji());
            };
        },
        check: function (claim, ms) {

// The check function optionally takes a claim function or the name of a group.
// The default is to check all claims. It returns the jsc object.
// The results will be provided to callback functions that are registered
// with the on_* methods.

            let array;
            let cases = {};
            let complete = false;
            let nr_pending = 0;
            let serials = [];
            let timeout_id;

            function generate_report() {

// Go through all of the cases. Identify the lost cases [on_lost]. Summarize
// the cases [on_result]. Produce a detailed report [on_report].

                let class_fail;
                let class_pass;
                let class_lost;
                let i = 0;
                let lines = "";
                let next_case;
                let now_claim;
                let nr_class = 0;
                let nr_fail;
                let nr_lost;
                let nr_pass;
                let report = "";
                let the_case;
                let the_class;
                let total_fail = 0;
                let total_lost = 0;
                let total_pass = 0;

                function generate_line(type, level) {
                    if (detail >= level) {
                        lines += (
                            " "
                            + type
                            + " ["
                            + the_case.serial
                            + "] "
                            + the_case.classification
                            + (
                                JSON.stringify(the_case.args)
                                    .replace(/^\[/, "(")
                                    .replace(/\]$/, ")")
                            )
                            + "\n"
                        );
                    }
                }


                function generate_class(key) {
                    if (detail >= 3 || class_fail[key] || class_lost[key]) {
                        report += (
                            " "
                            + key
                            + " pass "
                            + class_pass[key]
                            + (
                                (class_fail[key])
                                    ? " fail " + class_fail[key]
                                    : ""
                            )
                            + (
                                (class_lost[key])
                                    ? " lost " + class_lost[key]
                                    : ""
                            )
                            + "\n"
                        );
                    }
                }


                if (cases) {
                    if (timeout_id) {
                        clearTimeout(timeout_id);
                    }
                    while (true) {
                        next_case = cases[serials[i]];
                        if (!next_case || (next_case.claim !== now_claim)) {
                            if (now_claim) {
                                if (detail >= 1) {
                                    report += (
                                        the_case.name + ": "
                                        + (
                                            nr_class
                                                ? nr_class + " classifications, "
                                                : ""
                                        )
                                        + (nr_pass + nr_fail + nr_lost)
                                        + " cases tested, "
                                        + nr_pass
                                        + " pass"
                                        + (
                                            nr_fail
                                                ? ", " + nr_fail + " fail"
                                                : ""
                                        )
                                        + (
                                            nr_lost
                                                ? ", " + nr_lost + " lost"
                                                : ""
                                        )
                                        + "\n"
                                    );
                                    if (detail >= 2) {
                                        Object
                                            .keys(class_pass)
                                            .sort()
                                            .forEach(generate_class);
                                        report += lines;
                                    }
                                }
                                total_fail += nr_fail;
                                total_lost += nr_lost;
                                total_pass += nr_pass;
                            }
                            if (!next_case) {
                                break;
                            }
                            nr_class = 0;
                            nr_fail = 0;
                            nr_lost = 0;
                            nr_pass = 0;
                            class_pass = {};
                            class_fail = {};
                            class_lost = {};
                            lines = "";
                        }
                        the_case = next_case;
                        i += 1;
                        now_claim = the_case.claim;
                        the_class = the_case.classification;
                        if (
                            the_class
                            && typeof class_pass[the_class] !== "number"
                        ) {
                            class_pass[the_class] = 0;
                            class_fail[the_class] = 0;
                            class_lost[the_class] = 0;
                            nr_class += 1;
                        }
                        switch (the_case.pass) {
                        case true:
                            if (the_class) {
                                class_pass[the_class] += 1;
                            }
                            if (detail >= 4) {
                                generate_line("Pass", 4);
                            }
                            nr_pass += 1;
                            break;
                        case false:
                            if (the_class) {
                                class_fail[the_class] += 1;
                            }
                            generate_line("FAIL", 2);
                            nr_fail += 1;
                            break;
                        default:
                            if (the_class) {
                                class_lost[the_class] += 1;
                            }
                            generate_line("LOST", 2);
                            nr_lost += 1;
                            go(on_lost, the_case);
                        }
                    }
                    if (typeof claim === "string" && detail >= 1) {
                        report = "Group " + claim + "\n\n" + report;
                    }
                    report += (
                        "\nTotal pass "
                        + total_pass
                        + (
                            total_fail
                                ? ", fail " + total_fail
                                : ""
                        )
                        + (
                            total_lost
                                ? ", lost " + total_lost
                                : ""
                        )
                        + "\n"
                    );
                    go(on_result, {
                        pass: total_pass,
                        fail: total_fail,
                        lost: total_lost,
                        total: total_pass + total_fail + total_lost,
                        ok: (
                            total_lost === 0
                            && total_fail === 0
                            && total_pass > 0
                        )
                    });
                    go(on_report, report);
                }
                cases = null;
            }


            function register(serial, value) {

// This function is used by a claim function to register a new case, and it
// is used by a case to report a verdict. The two uses are correlated by the
// serial number.

// If the cases object is gone, then all late arriving lost results should be
// ignored.

                let the_case;
                if (cases) {
                    the_case = cases[serial];

// If the serial number has not been seen, then register a new case.
// The case is added to the cases collection. The serial number is added to
// the serials collection. The number of pending cases is increased.

                    if (the_case === undefined) {
                        cases[serial] = value;
                        serials.push(serial);
                        nr_pending += 1;
                    } else {

// An existing case now gets its verdict. If it unexpectedly already has a
// result, then throw an exception. Each case should have only one result.

                        if (the_case.pass !== undefined) {
                            throw the_case;
                        }

// If the result is a boolean, then the case is updated and sent to on_pass
// or on_fail.

                        if (value === true) {
                            the_case.pass = true;
                            go(on_pass, the_case);
                        } else if (value === false) {
                            the_case.pass = false;
                            go(on_fail, the_case);
                        } else {

// Any other result indicates that the case was lost. Assume that the value
// is an exception object.

                            the_case.pass = null;
                            the_case.exception = value;
                        }

// This case is no longer pending. If all of the cases have been generated and
// given results, then generate the result.

                        nr_pending -= 1;
                        if (nr_pending <= 0 && complete) {
                            generate_report();
                        }
                    }
                }
                return value;
            }

// Make an array of the claims to be checked.

            if (typeof claim === "function") {
                array = [claim];
            } else if (typeof claim === "string") {
                array = groups[claim];
                if (!Array.isArray(array)) {
                    throw "JSCheck Bad group " + claim;
                }
            } else {
                array = all;
                ms = ms || claim;
            }
            unique = 0;

// Process each claim.

            array.forEach(function (claim) {
                let at_most = reps * 10;
                let counter = 0;
                let i;

// Loop over the generation and testing of cases.

                for (i = 0; counter < reps && i < at_most; i += 1) {
                    if (claim(register) !== reject) {
                        counter += 1;
                    }
                }
            });

// All of the case predicates have been called.

            complete = true;

// If all of the cases have returned verdicts, then generate the report.

            if (nr_pending <= 0) {
                generate_report();

// Otherwise, start the timer.

            } else if (ms > 0) {
                timeout_id = setTimeout(generate_report, ms);
            }
            return jsc;
        },
        claim: function (name, predicate, signature, classifier, dont) {

// A claim consists of
//  a unique name which is displayed in the the report,
//  a predicate function that exercises the claim, and that will return true
//      if the claim holds,
//  a function signature for the function expressed as an array of type
//      specifiers or expressions,
//  an optional classifier function, which takes the same arguments as the
//      property function, and returns a string for classifying the subsets, or
//      false if the predicate should not be given this set of generated
//      arguments.
//  a boolean that prevents adding the claim.

// A function is returned, which can be called by the check function.
// That function will also be deposited in the set of all claims.
// If a group name has been set, then the claim will also be deposited
// in the group.

            let group = now_group;
            if (!Array.isArray(signature)) {
                signature = [signature];
            }

            function claim(register) {
                let args = signature.map(resolve);
                let classification = "";
                let serial;
                let verdict;

// If a classifier function was provided, then use it to obtain a
// classification. If the classification is not a string, then reject the
// case.

                if (typeof classifier === "function") {
                    classification = classifier(...args);
                    if (typeof classification !== "string") {
                        return reject;
                    }
                }

// Create a unique serial number for this case.

                unique += 1;
                serial = unique;

// Create a verdict function that wraps the register function.

                verdict = function (result) {
                    if (result === undefined) {
                        result = null;
                    }
                    return register(serial, result);
                };

// Register an object that represents this case.

                register(serial, {
                    args: args,
                    claim: claim,
                    classification: classification,
                    classifier: classifier,
                    group: group,
                    name: name,
                    pass: undefined,
                    predicate: predicate,
                    serial: serial,
                    signature: signature,
                    verdict: verdict
                });

// Call the predicate, giving it the verdict function and all of the case's
// arguments. The predicate must use the verdict callback to signal the result
// of the case.

                try {
                    return predicate(verdict, ...args);

// If the predicate throws, then this is a lost case. Use the exception
// as the verdict, but don't allow the exception to be a boolean, because that
// would be confusing.

                } catch (e) {
                    return verdict((typeof e === "boolean")
                        ? null
                        : e);
                }
            }

// If this is not a standalone test, then add this claim to the current group
// and the set of all claims.

            if (dont !== true) {
                if (group) {
                    if (!Array.isArray(groups[group])) {
                        groups[group] = [claim];
                    } else {
                        groups[group].push(claim);
                    }
                }
                all.push(claim);
            }
            return claim;
        },
        detail: function (level) {
            detail = level;
            return jsc;
        },
        falsy: function () {
            return jsc.one_of(bottom);
        },
        group: function (name) {
            now_group = name || "";
            return jsc;
        },
        integer: function (i, j) {
            if (i === undefined) {
                return jsc.one_of(primes);
            }
            i = integer(i, 1);
            j = integer(j, 1);
            if (j === undefined) {
                j = i;
                i = 1;
            }
            if (i === j) {
                return i;
            }
            if (i > j) {
                let t = i;
                i = j;
                j = t;
            }
            return function () {
                return Math.floor(Math.random() * (j + 1 - i) + i);
            };
        },
        literal: function (value) {
            return function () {
                return value;
            };
        },
        number: function (i, j) {
            i = Number(i) || 0;
            j = Number(j);
            if (!Number.isFinite(j)) {
                j = i || 1;
                i = 0;
            }
            if (i === j) {
                return i;
            }
            if (i > j) {
                let t = i;
                i = j;
                j = t;
            }
            return function () {
                return Math.random() * (j - i) + i;
            };
        },
        object: function (object, value) {
            if (object === undefined) {
                object = jsc.integer(1, 4);
            }
            return function () {
                let gen;
                let i;
                let keys;
                let result = {};
                let string;
                let values;
                keys = resolve(object);
                if (typeof keys === "number") {
                    string = jsc.string();
                    gen = jsc.any();
                    for (i = 0; i < keys; i += 1) {
                        result[string()] = gen();
                    }
                    return result;
                }
                if (value === undefined) {
                    if (keys && typeof keys === "object") {
                        Object.keys(object).forEach(function (key) {
                            result[key] = resolve(keys[key]);
                        });
                        return result;
                    }
                } else {
                    values = resolve(value);
                    if (Array.isArray(keys)) {
                        keys.forEach(function (key, i) {
                            result[key] = resolve((
                                (Array.isArray(values))
                                    ? values[i % values.length]
                                    : value
                            ), i);
                        });
                        return result;
                    }
                }
                return null;
            };
        },
        one_of: function (array, weights) {

// The one_of specifier has two signatures.

//  one_of(array)
//      One element is taken from the array and resolved. The elements are
//      selected randomly with equal probabilities.

// one_of(array, weights)
//      The two arguments are both arrays with equal lengths. The larger
//      a weight, the more likely an element will be selected.

            if (typeof array === "string") {
                return function () {
                    return array.charAt(
                        Math.floor(Math.random() * array.length)
                    );
                };
            }
            if (Array.isArray(array) && array.length > 0) {
                if (!Array.isArray(weights)) {
                    return function () {
                        return resolve(
                            array[Math.floor(Math.random() * array.length)]
                        );
                    };
                }
                if (array.length === weights.length) {
                    let base = 0;
                    let n = array.length - 1;
                    let total = weights.reduce(function (a, b) {
                        return a + b;
                    }, 0);
                    let list = weights.map(function (value) {
                        base += value / total;
                        return base;
                    });
                    return function () {
                        let i;
                        let x = Math.random();
                        for (i = 0; i < n; i += 1) {
                            if (x < list[i]) {
                                return resolve(array[i]);
                            }
                        }
                        return resolve(array[n]);
                    };
                }
            }
            return null;
        },
        on_fail: function (func) {
            on_fail = func;
            return jsc;
        },
        on_lost: function (func) {
            on_lost = func;
            return jsc;
        },
        on_pass: function (func) {
            on_pass = func;
            return jsc;
        },
        on_report: function (func) {
            on_report = func;
            return jsc;
        },
        on_result: function (func) {
            on_result = func;
            return jsc;
        },
        reps: function (number) {
            reps = number;
            return jsc;
        },
        resolve: resolve,
        sequence: function (seq) {
            seq = resolve(seq);
            if (!Array.isArray(seq)) {
                throw "JSCheck sequence";
            }
            let i = -1;
            return function () {
                i += 1;
                if (i >= seq.length) {
                    i = 0;
                }
                return resolve(seq[i]);
            };
        },
        string: function string(...rest) {
            const length = rest.length;

            if (length === 0) {
                return string(jsc.integer(10), jsc.character());
            }

            function pair(dimension, value) {
                if (value === undefined) {
                    return function () {
                        return JSON.stringify(resolve(dimension));
                    };
                }
                return function () {
                    return jsc.array(dimension, value)().join("");
                };
            }

            if (length <= 2) {
                return pair(rest[0], rest[1]);
            }

            const pieces = [];
            let i;
            for (i = 0; i < length; i += 2) {
                pieces.push(pair(rest[i], rest[i + 1]));
            }
            return function () {
                return pieces.map(resolve).join("");
            };
        },
        test: function (name, predicate, signature, classifier, ms) {
            return jsc.check(
                jsc.claim(name, predicate, signature, classifier, true),
                ms
            );
        }
    };
    return jsc;
};
