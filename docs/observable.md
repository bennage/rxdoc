#Observable object
The Observable object represents a push based collection.

The Observer and Objects interfaces provide a generalized mechanism for push-based notification,
also known as the observer design pattern. The Observable object represents the object that sends
notifications (the provider); the Observer object represents the class that receives them (the observer).

## `Observable Methods`
- [`create`](#Observable-static-create)
- [`createWithDisposable`](#Observable-static-createWithDisposable)

## `Observable Instance Methods`
- [`switch | switchLatest`](#Observable-instance-switch)

## _Observable Methods_ ##
### <a id="Observable-static-create"></a>`Rx.Observable.create`
[&#x24C8;](https://github.com/Reactive-Extensions/RxJS/blob/master/rx.sample.js#L2765-L2769 "View in source")
Creates an observable sequence from a specified subscribe method implementation.

#### Arguments
1. `subscribe` *(Function)*: Implementation of the resulting observable sequence's subscribe method, optionally returning a function that will be wrapped in a disposable object.

#### Returns
*(Observable)*: The observable sequence with the specified implementation for the subscribe method.

#### Example
    ```js
    var source = Rx.Observable.create(function (observer) {
        observer.onNext(42);
        observer.onCompleted();

        // Note that this is optional, you do not have to return this if you require no cleanup
        return function () {
            console.log('disposed');
        };
    });

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

    // => Next: 42
    // => Completed

    subscription.dispose();

    // => disposed
    ```
     

### Location
- rx.sample.js

* * *

### <a id="Observable-static-createWithDisposable"></a>`Rx.Observable.createWithDisposable`
[&#x24C8;](https://github.com/Reactive-Extensions/RxJS/blob/master/rx.sample.js#L2811-L2813 "View in source")
Creates an observable sequence from a specified Subscribe method implementation.

#### Arguments
1. `subscribe` *(Function)*: Implementation of the resulting observable sequence's subscribe method.

#### Returns
*(Observable)*: The observable sequence with the specified implementation for the subscribe method.

#### Example
    ```js
    var source = Rx.Observable.createWithDisposable(function (observer) {
        observer.onNext(42);
        observer.onCompleted();

        return Rx.Disposable.create(function () {
            // Any cleanup that is required
            console.log('disposed');
        });
    });

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

    // => Next: 42
    // => Completed

    subscription.dispose();

    // => disposed
    ```
     

### Location
- rx.sample.js

* * *


## _Observable Instance Methods_ ##
instance members
