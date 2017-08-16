jscheck.js
Douglas Crockford
2012-04-24

Public Domain

JSCheck is a testing tool for JavaScript. It was inspired by QuickCheck, a
testing tool for Haskell developed by Koen Claessen and John Hughes of
Chalmers University of Technology.

JSCheck is a specification-driven testing tool. From a description of the
properties of a system, function, or object, it will generate random test
cases attempting to prove those properties, and then report its findings.
That can be especially effective in managing the evolution of a program
because it can show the conformance of new code to old code. It also provides
an interesting level of self-documentation, because the executable
specifications it relies on can provide a good view of the workings of a
program.

All of JSCheck can be loaded from a small file called jscheck.js.

The source is available at https://github.com/douglascrockford/JSCheck.
The documentation is available at http://www.JSCheck.org/.
