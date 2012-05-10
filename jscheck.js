// jscheck.js
// Douglas Crockford
// 2012-04-22

// Public Domain

/*properties
    apply, args, array, boolean, charAt, charCodeAt, character, check, claim,
    classification, classifier, clear, detail, exception, floor, forEach,
    fromCharCode, group, integer, isArray, join, keys, length, literal, map,
    name, number, object, on_fail, on_pass, on_report, one_of, pass, predicate,
    push, random, reduce, replace, reps, sequence, signature, sort, string,
    stringify
*/

var JSC = (function () {
    'use strict';

    var all,            // The collection of all claims
        detail = 3,     // The current level of report detail
        group,          // The collection of named groups of claims
        now_group,      // The current group
        on_fail,        // The function that receives the fail cases
        on_pass,        // The function that receives the pass cases
        on_report,      // The function that receives the reportage
        reps = 100,     // The number of cases to be tried per claim
        integer_sq_2 = 9,
        integer_sqrt = 1,
        integer_prime = 1,

        add = function (a, b) {
            return a + b;
        },
        and = function (a, b) {
            return a && b;
        },
        resolve = function (value) {

// The resolve function takes a value. If that value is a function, then
// it is called to produce the return value.

            return typeof value === 'function'
                ? value.apply(null, Array.prototype.slice.call(arguments, 1))
                : value;
        },
        integer = function (value) {
            value = resolve(value);
            return typeof value === 'number'
                ? Math.floor(value)
                : typeof value === 'string'
                ? value.charCodeAt(0)
                : undefined;
        },

        jscheck = {
            array: function (dimension, value) {
                if (Array.isArray(dimension)) {
                    return function () {
                        return dimension.map(function (value) {
                            return resolve(value);
                        });
                    };
                }
                return function () {
                    var i,
                        n = resolve(dimension),
                        result = [];
                    if (typeof n === 'number' && isFinite(n)) {
                        for (i = 0; i < n; i += 1) {
                            result.push(resolve(value, i));
                        }
                    }
                    return result;
                };
            },
            boolean: function (bias) {

// A signature can contain a boolean specification. And optional bias parameter
// can be provided. If the bias is 0.25, then approximately a quarter of the
// booleans produced will be true.

                if (typeof bias !== 'number') {
                    bias = 0.50;
                }
                return function () {
                    return Math.random() < bias;
                };
            },
            character: function (i, j) {
                if (j === undefined) {
                    return function () {
                        return String.fromCharCode(integer(i));
                    };
                }
                var ji = jscheck.integer(i, j);
                return function () {
                    return String.fromCharCode(ji());
                };
            },
            check: function (claim) {

// The check function optionally takes a claim function or the name of a group.
// The default is to check all claims.
// It returns a boolean which will be false if any case fails.
// Report texts may be sent to the function registered with on_report, depending
// on the level of detail.

                var array;
                if (typeof claim === 'function') {
                    array = [claim];
                } else if (typeof claim === 'string') {
                    array = group[claim];
                    if (!Array.isArray(array)) {
                        if (detail >= 1 && typeof on_report === 'function') {
                            on_report("Bad group " + claim + '\n');
                        }
                        return false;
                    }
                    if (detail >= 1 && typeof on_report === 'function') {
                        on_report("Group " + claim + '\n');
                    }
                } else {
                    array = all;
                }
                return array.map(function (claim) {
                    var at_most = reps * 10,
                        bad = {},
                        bit = true,
                        counter = 0,
                        i,
                        ok,
                        good = {},
                        result,
                        report = '',
                        success = 0;
                    integer_sq_2 = 9;
                    integer_sqrt = 1;
                    integer_prime = 1;

// Loop over the generation and testing of cases.

                    for (i = 0; counter < reps && i < at_most; i += 1) {
                        result = claim();
                        if (result) {
                            ok = result.pass === true;
                            if (detail >= 4 || (!ok && detail >= 2)) {
                                report += (ok ? " Pass" : " FAIL") +
                                    ' [' + counter + '] ' +
                                    result.classification + (
                                        JSON.stringify(result.args)
                                            .replace(/^\[/, '(')
                                            .replace(/\]$/, ')')
                                    ) + '\n';
                            }
                            if (typeof good[result.classification] !== 'number') {
                                good[result.classification] = 0;
                                bad[result.classification] = 0;
                            }
                            if (ok) {
                                good[result.classification] += 1;
                                success += 1;
                                if (typeof on_pass === 'function') {
                                    on_pass(result);
                                }
                            } else {
                                bit = false;
                                bad[result.classification] += 1;
                                if (typeof on_fail === 'function') {
                                    on_fail(result);
                                }
                            }
                            counter += 1;
                        }
                    }
                    if (detail >= 1) {
                        report = result.name + ' ' + success + ' of ' +
                            counter + '\n' + report;
                    }
                    if (detail >= 2) {
                        Object.keys(good).sort().forEach(function (key) {
                            if (detail >= 3 || bad[key]) {
                                report += key + ' pass ' + good[key] +
                                    (bad[key] ? ' fail ' + bad[key] : '') + '\n';
                            }
                        });
                    }
                    if (report && typeof on_report === 'function') {
                        on_report(report);
                    }
                    return bit;
                }).reduce(and, true);
            },
            claim: function (name, predicate, signature, classifier) {

// A claim consists of
//  a unique name which is displayed in the the report,
//  a predicate function which exercises the claim, and that will return true
//      if the claim holds,
//  a function signature for the function expressed as an array of type
//      specifiers or expressions,
//  an optional classifier function, which takes the same arguments as the
//      property function, and returns a string for classifying the subsets, or
//      false if the predicate should not be given this set of generated
//      arguments.

// A function is returned, which can be called by the check function.
// That function will also be deposited in the set of all claims.
// If a group name has been set, then the claim will also be deposited
// in the group.

                var the_group = now_group,
                    the_claim = function () {
                        var args = signature.map(function (value) {
                                return resolve(value);
                            }),
                            classification = '',
                            exception,
                            pass;
                        if (typeof classifier === 'function') {
                            classification = classifier.apply(args, args);
                            if (typeof classification !== 'string') {
                                return false;
                            }
                        }
                        try {
                            pass = predicate.apply(null, args);
                        } catch (e) {
                            exception = e;
                            pass = false;
                        }
                        return {
                            args: args,
                            claim: the_claim,
                            classification: classification,
                            classifier: classifier,
                            exception: exception,
                            group: the_group,
                            name: name,
                            pass: pass,
                            predicate: predicate,
                            signature: signature
                        };
                    };

                if (the_group) {
                    if (!Array.isArray(group[the_group])) {
                        group[the_group] = [the_claim];
                    } else {
                        group[the_group].push(the_claim);
                    }
                }
                all.push(the_claim);
                return the_claim;
            },
            clear: function () {
                all = [];
                group = {};
                now_group = '';
                return jscheck;
            },
            detail: function (level) {
                detail = level;
                return jscheck;
            },
            group: function (name) {
                now_group = name || '';
                return jscheck;
            },
            integer: function (i, j) {
                if (i === undefined) {
                    return function () {
                        var factor,
                            reject;
                        do {
                            integer_prime += 2;
                            reject = false;
                            if (integer_prime >= integer_sq_2) {
                                reject = true;
                                integer_sqrt += 2;
                                integer_sq_2 = (integer_sqrt + 2) *
                                    (integer_sqrt + 2);
                            }
                            for (factor = 3; !reject && factor <= integer_sqrt;
                                    factor += 2) {
                                reject = integer_prime % factor === 0;
                            }
                        } while (reject);
                        return integer_prime;
                    };
                }
                i = integer(i, 0) || 0;
                j = integer(j, 0);
                if (j === undefined) {
                    j = i;
                    i = 1;
                }
                if (i === j) {
                    return i;
                }
                if (i > j) {
                    var t = i;
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
                i = +i || 0;
                j = +j;
                if (!isFinite(j)) {
                    j = i || 1;
                    i = 0;
                }
                if (i === j) {
                    return i;
                }
                if (i > j) {
                    var t = i;
                    i = j;
                    j = t;
                }
                return function () {
                    return Math.random() * (j - i) + i;
                };
            },
            object: function (object, value) {
                return function () {
                    var keys,
                        result = {},
                        values;

                    if (value === undefined) {
                        keys = resolve(object);
                        if (keys && typeof keys === 'object') {
                            Object.keys(keys).forEach(function (key) {
                                result[key] = resolve(keys[key]);
                            });
                            return result;
                        }
                    } else {
                        keys = resolve(object);
                        values = resolve(value);
                        if (Array.isArray(keys)) {
                            keys.forEach(function (key, i) {
                                i = i % values.length;
                                result[key] = resolve((Array.isArray(values)
                                    ? values[i]
                                    : value), i);
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

                if (typeof array === 'string') {
                    return function () {
                        return array.charAt(Math.floor(Math.random() *
                            array.length));
                    };
                }
                if (Array.isArray(array) && array.length > 0) {
                    if (!Array.isArray(weights)) {
                        return function () {
                            return resolve(array[Math.floor(Math.random() *
                                array.length)]);
                        };
                    }
                    if (array.length === weights.length) {
                        var base = 0,
                            n = array.length - 1,
                            total = weights.reduce(add, 0),
                            list = weights.map(function (value) {
                                base += value / total;
                                return base;
                            });
                        return function () {
                            var i, x = Math.random();
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
                return jscheck;
            },
            on_pass: function (func) {
                on_pass = func;
                return jscheck;
            },
            on_report: function (func) {
                on_report = func;
                return jscheck;
            },
            reps: function (number) {
                reps = number;
                return jscheck;
            },
            sequence: function (array) {
                var i = -1;

// A signature can contain a one of specification indicating one of the
// elements of an array. Those elements can be constants or other
// specifications.

                return function () {
                    i += 1;
                    if (i >= array.length) {
                        i = 0;
                    }
                    return resolve(array[i]);
                };
            },
            string: function (dimension, value) {
                if (value === undefined) {
                    return function () {
                        return JSON.stringify(resolve(dimension));
                    };
                }
                var ja = jscheck.array(dimension, value);
                return function () {
                    return ja().join('');
                };
            },
            test: function (name, predicate, signature, classifier) {
                return JSC.check(JSC.claim(name, predicate, signature, classifier));
            }
        };
    return jscheck.clear();
}());
