/// <reference path="../../../typings/main.d.ts" />

/* Code based on
     Underscore.js 1.8.3
     http://underscorejs.org
     (c) 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     Underscore may be freely distributed under the MIT license.
*/

export interface IThrottled {
    (): void;
    cancel(): void;
}

export interface IThrottleService {
    throttle(f: () => void, wait: number): IThrottled;
}

export class ThrottleService implements IThrottleService {
    $timeout: angular.ITimeoutService;

    /** @ngInject */
    constructor($timeout: angular.ITimeoutService) {
        this.$timeout = $timeout;
    }

    throttle(f: () => void, wait: number): IThrottled {
        var timeout: angular.IPromise<any>;
        var previous: number = 0;
        var cancelled: boolean = false;
        var vm: ThrottleService = this;

        var later: () => void = function() {
            previous = (new Date()).getTime();
            timeout = null;

            f();
        };

        var throttled: any = function() {
            var now: number = (new Date()).getTime();
            var remaining: number = wait - (now - previous);

            if (cancelled) {
                return;
            }

            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    vm.$timeout.cancel(timeout);
                    timeout = null;
                }

                previous = now;

                f();
            } else if (!timeout) {
                timeout = vm.$timeout(later, remaining);
            }
        };

        throttled.cancel = function(): void {
            cancelled = true;
            if (timeout) {
                vm.$timeout.cancel(timeout);
            }
            previous = 0;
            timeout = null;
        };

        return <IThrottled>throttled;
    }
}
