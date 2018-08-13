// jscheck.js
// Douglas Crockford
// 2018-08-13

// Public Domain

// http://www.jscheck.org/

/*jslint for, node */

/*property
    any, args, array, boolean, cases, charAt, charCodeAt, character, check,
    claim, class, classification, classifier, detail, fail, falsy, findIndex,
    floor, forEach, freeze, fromCharCode, group, integer, isArray, isFinite,
    join, key, keys, length, literal, losses, lost, map, name, nr_trials,
    number, object, ok, on_fail, on_lost, on_pass, on_report, on_result, pass,
    predicate, push, random, reduce, replace, report, sequence, serial,
    signature, sort, split, string, stringify, summary, total, type, verdict,
    wun_of
*/

import fulfill from "./fulfill.js";

function resolve(value, ...rest) {

// The resolve function takes a value. If that value is a function, then
// it is called to produce the return value. Otherwise, the value is the
// return value.

    return (
        typeof value === "function"
        ? value(...rest)
        : value
    );
}

function literal(value) {
    return function () {
        return value;
    };
}

function boolean(bias = 0.5) {

// A signature can contain a boolean specification. An optional bias
// parameter can be provided. If the bias is 0.25, then approximately a
// quarter of the booleans produced will be true.

    return function () {
        return Math.random() < resolve(bias);
    };
}

function number(from, to) {
    from = Number(resolve(from));
    to = Number(resolve(to));
    if (from === undefined) {
        from = 0;
    }
    if (to === undefined) {
        to = from || 1;
        from = 0;
    }
    if (from > to) {
        [from, to] = [to, from];
    }
    return function () {
        return Math.random() * (to - from) + from;
    };
}

function wun_of(array, weights) {

// The wun_of specifier has two signatures.

//  wun_of(array)
//      Wun element is taken from the array and resolved. The elements
//      are selected randomly with equal probabilities.

// wun_of(array, weights)
//      The two arguments are both arrays with equal lengths. The larger
//      a weight, the more likely an element will be selected.

    array = array.split("");
    if (
        !Array.isArray(array)
        || array.length < 1
        || (
            weights !== undefined
            && (!Array.isArray(weights) || array.length !== weights.length)
        )
    ) {
        throw new Error("JSCheck wun_of");
    }
    if (weights === undefined) {
        return function () {
            return resolve(
                array[Math.floor(Math.random() * array.length)]
            );
        };
    }
    const total = weights.reduce(function (a, b) {
        return a + b;
    });
    let base = 0;
    const list = weights.map(function (value) {
        base += value;
        return base / total;
    });
    return function () {
        let x = Math.random();
        return resolve(array[list.findIndex(function (element) {
            return element >= x;
        })]);
    };
}

function sequence(seq) {
    seq = resolve(seq);
    if (!Array.isArray(seq)) {
        throw "JSCheck sequence";
    }
    let element_nr = -1;
    return function () {
        element_nr += 1;
        if (element_nr >= seq.length) {
            element_nr = 0;
        }
        return resolve(seq[element_nr]);
    };
}

const bottom = [false, null, undefined, "", 0, NaN];

function falsy() {
    return wun_of(bottom);
}

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

function integer_value(value, default_value) {
    value = resolve(value);
    return (
        typeof value === "number"
        ? Math.floor(value)
        : (
            typeof value === "string"
            ? value.charCodeAt(0)
            : default_value
        )
    );
}

function integer(i, j) {
    i = integer_value(i, 1);
    if (i === undefined) {
        return wun_of(primes);
    }
    j = integer_value(j, 1);
    if (j === undefined) {
        j = i;
        i = 1;
    }
    if (i > j) {
        [i, j] = [j, i];
    }
    return function () {
        return Math.floor(Math.random() * (j + 1 - i) + i);
    };
}

function character(i, j) {
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
    let ji = integer(i, j);
    return function () {
        return String.fromCharCode(ji());
    };
}

function array(dimension, value) {
    if (Array.isArray(dimension)) {
        return function () {
            return dimension.map(resolve);
        };
    }
    if (dimension === undefined) {
        dimension = integer(4);
    }
    if (value === undefined) {
        value = integer();
    }
    return function () {
        let element_nr = 0;
        const n = resolve(dimension);
        const result = [];
        if (Number.isFinite(n)) {
            while (element_nr < n) {
                result[element_nr] = resolve(value, element_nr);
                element_nr += 1;
            }
        }
        return result;
    };
}

function string(...rest) {
    const length = rest.length;

    if (length === 0) {
        return string(integer(10), character());
    }

    function pair(dimension, value) {
        if (value === undefined) {
            return function () {
                return JSON.stringify(resolve(dimension));
            };
        }
        return function () {
            return array(dimension, value)().join("");
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
}

const misc = [
    true, Infinity, -Infinity, false, null, undefined, "", 0, 1, NaN
];

function any() {
    return wun_of([integer(), number(), string(), wun_of(misc)]);
}

function object(subject, value) {
    if (subject === undefined) {
        subject = integer(1, 4);
    }
    return function () {
        let result = {};
        const keys = resolve(subject);
        if (typeof keys === "number") {
            const text = string();
            const gen = any();
            let i = 0;
            while (i < keys) {
                result[text()] = gen();
                i += 1;
            }
            return result;
        }
        if (value === undefined) {
            if (keys && typeof keys === "object") {
                subject.keys(subject).forEach(function (key) {
                    result[key] = resolve(keys[key]);
                });
                return result;
            }
        } else {
            const values = resolve(value);
            if (Array.isArray(keys)) {
                keys.forEach(function (key, key_nr) {
                    result[key] = resolve((
                        Array.isArray(values)
                        ? values[key_nr % values.length]
                        : value
                    ), key_nr);
                });
                return result;
            }
        }
    };
}

function go(func, value) {

// If value is truthy, then pass it to the func,
// ignoring any exceptions.

    if (typeof func === "function" && value) {
        try {
            return func(value);
        } catch (ignore) {}
    }
}

const ctp = "{name}: {class}{cases} cases tested, {pass} pass{fail}{lost}\n";

function crunch(detail, cases, serials) {

// Go through all of the cases. Gather the lost cases.
// Produce a detailed report and a summary.

    let class_fail;
    let class_pass;
    let class_lost;
    let case_nr = 0;
    let lines = "";
    let losses = [];
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
            lines += fulfill(
                " {type} [{serial}] {classification}{args}\n",
                {
                    type,
                    serial: the_case.serial,
                    classification: the_case.classification,
                    args: JSON.stringify(
                        the_case.args
                    ).replace(
                        /^\[/,
                        "("
                    ).replace(
                        /\]$/,
                        ")"
                    )
                }
            );
        }
    }

    function generate_class(key) {
        if (detail >= 3 || class_fail[key] || class_lost[key]) {
            report += fulfill(
                " {key} pass {pass}{fail}{lost}\n",
                {
                    key,
                    pass: class_pass[key],
                    fail: (
                        class_fail[key]
                        ? " fail " + class_fail[key]
                        : ""
                    ),
                    lost: (
                        class_lost[key]
                        ? " lost " + class_lost[key]
                        : ""
                    )
                }
            );
        }
    }

    if (cases) {
        while (true) {
            next_case = cases[serials[case_nr]];
            case_nr += 1;
            if (!next_case || (next_case.claim !== now_claim)) {
                if (now_claim) {
                    if (detail >= 1) {
                        report += fulfill(
                            ctp,
                            {
                                name: the_case.name,
                                class: (
                                    nr_class
                                    ? nr_class + " classifications, "
                                    : ""
                                ),
                                cases: nr_pass + nr_fail + nr_lost,
                                pass: nr_pass,
                                fail: (
                                    nr_fail
                                    ? ", " + nr_fail + " fail"
                                    : ""
                                ),
                                lost: (
                                    nr_lost
                                    ? ", " + nr_lost + " lost"
                                    : ""
                                )
                            }
                        );
                        if (detail >= 2) {
                            Object.keys(
                                class_pass
                            ).sort().forEach(
                                generate_class
                            );
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
            now_claim = the_case.claim;
            the_class = the_case.classification;
            if (the_class && typeof class_pass[the_class] !== "number") {
                class_pass[the_class] = 0;
                class_fail[the_class] = 0;
                class_lost[the_class] = 0;
                nr_class += 1;
            }
            if (the_case.pass === true) {
                if (the_class) {
                    class_pass[the_class] += 1;
                }
                if (detail >= 4) {
                    generate_line("Pass", 4);
                }
                nr_pass += 1;
            } else if (the_case.pass === false) {
                if (the_class) {
                    class_fail[the_class] += 1;
                }
                generate_line("FAIL", 2);
                nr_fail += 1;
            } else {
                if (the_class) {
                    class_lost[the_class] += 1;
                }
                generate_line("LOST", 2);
                losses[nr_lost] = the_case;
                nr_lost += 1;
            }
        }
        report += fulfill(
            "\nTotal pass {pass}{fail}{lost}\n",
            {
                pass: total_pass,
                fail: (
                    total_fail
                    ? ", fail " + total_fail
                    : ""
                ),
                lost: (
                    total_lost
                    ? ", lost " + total_lost
                    : ""
                )
            }
        );
    }
    return {losses, report, summary: {
        pass: total_pass,
        fail: total_fail,
        lost: total_lost,
        total: total_pass + total_fail + total_lost,
        ok: total_lost === 0 && total_fail === 0 && total_pass > 0
    }};
}

// We export a jsc constructor function. The check and claim functions are
// stateful, so they are created in here. I am freezing the constructor because
// I enjoy freezing things.

export default Object.freeze(function JSC() {
    let all_claims = [];
    let current_group = "";
    let detail = 3;         // The current level of report detail
    let on_fail;
    let on_lost;
    let on_pass;
    let on_report;
    let on_result;
    let reject = {};
    let nr_trials = 100;    // The number of cases to be tried per claim
    let unique;             // Case serial number

    let jsc;

    function check(time_limit) {

// The check function checks all claims. It returns the jsc object.
// The results will be provided to callback functions that are
// registered with the on_* methods.

        let cases = {};
        let all_started = false;
        let nr_pending = 0;
        let serials = [];
        let timeout_id;

        function finish() {
            if (timeout_id) {
                clearTimeout(timeout_id);
            }
            const {
                losses,
                summary,
                report
            } = crunch(detail, cases, serials);
            losses.forEach(function (the_case) {
                go(on_lost, the_case);
            });
            go(on_result, summary);
            go(on_report, report);
            all_claims = [];
            cases = undefined;
            current_group = "";
        }

        function register(serial, value) {

// This function is used by a claim function to register a new case, and
// it is used by a case to report a verdict. The two uses are correlated
// by the serial number.

// If the cases object is gone, then all late arriving lost results
// should be ignored.

            if (cases) {
                let the_case = cases[serial];

// If the serial number has not been seen, then register a new case. The
// case is added to the cases collection. The serial number is added to
// the serials collection. The number of pending cases is increased.

                if (the_case === undefined) {
                    cases[serial] = value;
                    serials.push(serial);
                    nr_pending += 1;
                } else {

// An existing case now gets its verdict. If it unexpectedly already has
// a result, then throw an exception. Each case should have only wun
// result.

                    if (
                        the_case.pass !== undefined
                        || typeof value !== "boolean"
                    ) {
                        throw the_case;
                    }

// If the result is a boolean, then the case is updated and sent to
// on_pass or on_fail.

                    if (value === true) {
                        the_case.pass = true;
                        go(on_pass, the_case);
                    } else {
                        the_case.pass = false;
                        go(on_fail, the_case);
                    }

// This case is no longer pending. If all of the cases have been
// generated and given results, then generate the result.

                    nr_pending -= 1;
                    if (nr_pending <= 0 && all_started) {
                        finish();
                    }
                }
            }
            return value;
        }
        unique = 0;

// Process each claim.

        all_claims.forEach(function (a_claim) {
            let at_most = nr_trials * 10;
            let case_nr = 0;
            let attempt_nr = 0;

// Loop over the generation and testing of cases.

            while (case_nr < nr_trials && attempt_nr < at_most) {
                if (a_claim(register) !== reject) {
                    case_nr += 1;
                }
                attempt_nr += 1;
            }
        });

// All of the case predicates have been called.

        all_started = true;

// If all of the cases have returned verdicts, then generate the report.

        if (nr_pending <= 0) {
            finish();

// Otherwise, start the timer.

        } else if (time_limit > 0) {
            timeout_id = setTimeout(finish, time_limit);
        }
        return jsc;
    }

    function claim(name, predicate, signature, classifier) {

// A claim consists of
//  A descriptive name which is displayed in the report.
//  A predicate function that exercises the claim, and that will return true
//      if the claim holds.
//  A function signature for the function expressed as an array of type
//      specifiers or expressions.
//  An optional classifier function, which takes the same arguments as the
//      property function, and returns a string for classifying the subsets,
//      or false if the predicate should not be given this set of generated
//      arguments.

// A function be deposited in the set of all claims.

        let group = current_group;
        if (!Array.isArray(signature)) {
            signature = [signature];
        }

        function the_claim(register) {
            let args = signature.map(resolve);
            let classification = "";
            let serial;
            let verdict;

// If a classifier function was provided, then use it to obtain a
// classification. If the classification is not a string, then reject the case.

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
                return register(serial, result);
            };

// Register an object that represents this case.

            register(serial, {
                args,
                claim: the_claim,
                classification,
                classifier,
                group,
                name,
                predicate,
                serial,
                signature,
                verdict
            });

// Call the predicate, giving it the verdict function and all of the case's
// arguments. The predicate must use the verdict callback to signal the result
// of the case.

            return predicate(verdict, ...args);
        }
        all_claims.push(the_claim);
        return jsc;
    }

    jsc = Object.freeze({

// Specifiers.

        any,
        array,
        boolean,
        character,
        falsy,
        integer,
        literal,
        number,
        object,
        wun_of,
        sequence,
        string,

// Configurators.

        detail: function (level) {
            detail = level;
            return jsc;
        },
        group: function (name = "") {
            current_group = name;
            return jsc;
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
        nr_trials: function (number) {
            nr_trials = number;
            return jsc;
        },

// The main functions.

        check,
        claim
    });
    return jsc;
});

