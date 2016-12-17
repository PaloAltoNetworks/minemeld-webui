/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';

export interface IMinemeldEventsService {
    subscribeQueryEvents(query: string, callback: any): number;
    subscribeStatusEvents(callback: ISubscriptionsCallbacks): number;
    unsubscribe(subscription: number): void;
}

interface ISubscription {
    subType: string;
    topic: string;
    callbacks: ISubscriptionsCallbacks;
    _id: number;
}

interface IEventSource extends EventTarget {
    new (url: string, eventSourceInitDict?: any);

    url: string;
    eventSourceInitDict: any;

    CONNECTING: number;
    OPEN: number;
    CLOSED: number;
    readyState: number;

    onopen: Function;
    onmessage: Function;
    onerror: Function;

    close(): void;
}

export interface ISubscriptionsCallbacks {
    onopen?: Function;
    onmessage?: Function;
    onerror?: Function;
}

declare var EventSource: IEventSource;

export class MinemeldEventsService implements IMinemeldEventsService {
    authorizationSet: boolean = false;
    authorizationString: string;

    $state: angular.ui.IStateService;
    MinemeldAPIService: IMineMeldAPIService;

    subscriptions: ISubscription[] = [];
    last_id: number = -1;

    event_sources: { [topic: string]: { es: IEventSource, reconnect: boolean } } = {};

    /* @ngInject */
    constructor($state: angular.ui.IStateService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.$state = $state;
        this.MinemeldAPIService = MineMeldAPIService;
    }

    subscribeQueryEvents(query: string, callbacks: ISubscriptionsCallbacks): number {
        this.last_id += 1;

        var sub: ISubscription = {
            subType: 'query',
            topic: query,
            callbacks: callbacks,
            _id: this.last_id
        };

        this.subscriptions.push(sub);
        this.createEventSource(sub.subType, sub.topic);

        return sub._id;
    }

    subscribeStatusEvents(callbacks: ISubscriptionsCallbacks): number {
        this.last_id += 1;

        var sub: ISubscription = {
            subType: 'status',
            topic: undefined,
            callbacks: callbacks,
            _id: this.last_id
        };

        this.subscriptions.push(sub);
        this.createEventSource(sub.subType, undefined, true);

        return sub._id;
    }

    unsubscribe(_id: number): void {
        var j: number = this.subscriptions.length;
        var csub: ISubscription;

        while (j--) {
            if (this.subscriptions[j]._id === _id) {
                csub = this.subscriptions[j];
                this.subscriptions.splice(j, 1);
                this.deleteEventSource(csub.subType, csub.topic);
                break;
            }
        }
    }

    private onMessage(subtype: string, event: string, e: any) {
        if ((e.data === 'ok') || (e.data === 'ko') || (e.data == 'ping')) {
            return;
        }
        angular.forEach(this.subscriptions, (sub: ISubscription) => {
           if ((sub.subType !== subtype) || (sub.topic !== event)) {
               return;
           }
           if (sub.callbacks.onmessage) {
               sub.callbacks.onmessage(subtype, event, JSON.parse(e.data));
           }
        });
    }

    private onOpen(subtype: string, event: string, e: any) {
        angular.forEach(this.subscriptions, (sub: ISubscription) => {
           if ((sub.subType !== subtype) || (sub.topic !== event)) {
               return;
           }
           if (sub.callbacks.onopen) {
               sub.callbacks.onopen(subtype, event, e);
           }
        });
    }

    private onError(subtype: string, event: string, e: any) {
        var ruri: string;

        angular.forEach(this.subscriptions, (sub: ISubscription) => {
           if ((sub.subType !== subtype) || (sub.topic !== event)) {
               return;
           }
           if (sub.callbacks.onerror) {
               sub.callbacks.onerror(subtype, event, e);
           }
        });

        if (typeof e.data !== 'undefined') {
            if (e.data.indexOf('401') !== -1) {
                this.MinemeldAPIService.logOut();

                this.deleteEventSource(subtype, event);
                this.$state.go('login');

                return;
            }
            if (e.data.indexOf('Reconnecting') !== -1) {
                return;
            }

            ruri = subtype;
            if (event) {
                ruri += '/' + event;
            }
            if (this.event_sources[ruri].reconnect) {
                console.log('ES: Reconnect on error');
                this.deleteEventSource(subtype, event);
                this.createEventSource(subtype, event, true);
            }
        }
    }

    private createEventSource(subtype: string, event?: string, reconnect?: boolean): void {
        var new_es: IEventSource;
        var ruri: string = subtype;
        var headers: any;

        if (typeof reconnect === 'undefined') {
            reconnect = false;
        }

        if (typeof event !== 'undefined') {
            ruri = ruri + '/' + event;
        }

        if (ruri in this.event_sources) {
            return;
        }

        headers = {};
        headers['Accept'] = 'text/event-stream';
        headers['Cache-Control'] = 'no-cache';
        headers['X-Requested-With'] = 'XMLHttpRequest';

        new_es = new EventSource('/status/events/' + ruri, {
            getArgs: null
        });

        new_es.onmessage = (e: any) => { this.onMessage(subtype, event, e); };
        new_es.onopen = (e: any) => { this.onOpen(subtype, event, e); };
        new_es.onerror = (e: any) => { this.onError(subtype, event, e); };

        this.event_sources[ruri] = {
            es: new_es,
            reconnect: reconnect
        };
    }

    private deleteEventSource(subtype: string, event: string): void {
        var nref: number = 0;
        var ruri: string = subtype;

        if (typeof event !== 'undefined') {
            ruri = ruri + '/' + event;
        }

        if (!(ruri in this.event_sources)) {
            return;
        }

        angular.forEach(this.subscriptions, (sub: ISubscription) => {
            if ((sub.topic === event) && (sub.subType === subtype)) {
                nref += 1;
            }
        });

        if (nref !== 0) {
            return;
        }

        this.event_sources[ruri].es.close();
        delete this.event_sources[ruri];
    }
}
