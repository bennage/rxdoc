// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.txt in the project root for license information.

(function(window, undefined) {

    var freeExports = typeof exports == 'object' && exports,
        freeModule = typeof module == 'object' && module && module.exports == freeExports && module,
        freeGlobal = typeof global == 'object' && global;
    if (freeGlobal.global === freeGlobal) {
        window = freeGlobal;
    }

    /*
     * @name Rx
     * @type Object
     */
    var Observable = {
        Internals: {}
    };

    observableProto = {};

    /*@
    `Rx.Observable.case(selector, sources, [elseSource|scheduler])`

    Uses selector to determine which source in sources to use.  There is an alias 'switchCase' for browsers <IE9.

    ### Arguments
    1. `selector` *(Function)*: The function which extracts the value for to test in a case statement.
    2. `sources` *(Object)*: A object which has keys which correspond to the case statement labels.
    3. `[elseSource|scheduler]` *(Observable|Scheduler)*: The observable sequence that will be run if the sources are not matched. If this is not provided, it defaults to `Rx.Observabe.empty` with the specified scheduler.

    #### Returns
    *(Observable)*: An observable sequence which is determined by a case statement. 

    #### Example
    ```js
    var sources = {
        'foo': Rx.Observable.return(42),
        'bar': Rx.Observable.return(56)
    };

    var defaultSource = Rx.Observable.empty();

    var source = Rx.Observable.case(
        function () {
            return 'foo';
        },
        sources,
        defaultSource);

    var subscription = source.subscribe(
        function (x) {
            console.log('Next: ' + x);
        },
        function (err) {
            console.log('Error: ' + err);   
        },
        function () {
            console.log('Completed');   
        });

    //=> Next: 42 
    //=> Completed 
    ```
    */
    var observableReturn = Observable['return'] = Observable.returnValue = function(value, scheduler) {
        scheduler || (scheduler = immediateScheduler);
        return new AnonymousObservable(function(observer) {
            return scheduler.schedule(function() {
                observer.onNext(value);
                observer.onCompleted();
            });
        });
    };

    /*@
Propagates the observable sequence that reacts first.

#### Arguments
1. `args` *(Array|arguments)*: Observable sources competing to react first either as an array or arguments.

#### Returns
*(Observable)*: An observable sequence that surfaces any of the given sequences, whichever reacted first.

#### Example
```js
var source = Rx.Observable.amb(
    Rx.Observable.timer(500).select(function () { return 'foo'; }),
    Rx.Observable.timer(200).select(function () { return 'bar'; })
);

var subscription = source.subscribe(
    function (x) {
        console.log('Next: ' + x);
    },
    function (err) {
        console.log('Error: ' + err);   
    },
    function () {
        console.log('Completed');   
    });

// => Next: bar
// => Completed
```
*/
    Observable.amb = function() {
        var acc = observableNever(),
            items = argsOrArray(arguments, 0);

        function func(previous, current) {
            return previous.amb(current);
        }
        for (var i = 0, len = items.length; i < len; i++) {
            acc = func(acc, items[i]);
        }
        return acc;
    };

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever any of the observable sequences produces an element.
     * This can be in the form of an argument list of observables or an array.
     *
     * @example
     * 1 - obs = observable.combineLatest(obs1, obs2, obs3, function (o1, o2, o3) { return o1 + o2 + o3; });
     * 2 - obs = observable.combineLatest([obs1, obs2, obs3], function (o1, o2, o3) { return o1 + o2 + o3; });
     * @memberOf Observable#
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
     */
    observableProto.combineLatest = function() {
        var args = slice.call(arguments);
        if (Array.isArray(args[0])) {
            args[0].unshift(this);
        } else {
            args.unshift(this);
        }
        return combineLatest.apply(this, args);
    };
}(this));