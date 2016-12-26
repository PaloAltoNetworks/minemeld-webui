/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';
import { IMinemeldEventsService } from './events';

export interface IMinemeldStatusService {
    NODE_STATES: string[];
    currentStatus: IMinemeldStatus;

    getStatus(): angular.IPromise<IMinemeldStatus>;
    getSystem(): angular.IPromise<any>;
    getMinemeld(): angular.IPromise<any>;
    getConfig(): angular.IPromise<any>;
    hup(nodename: string): angular.IPromise<any>;
    initStatusMonitor(): void;
    destroyStatusMonitor(): void;
}

export interface IMinemeldStatusNode {
    name: string;
    length: number;
    class: string;
    inputs: string[];
    output: boolean;
    state: number;
    statistics: {
        [key: string]: number;
    };
}

export interface IMinemeldStatus {
    [key: string]: IMinemeldStatusNode;
}

export class MinemeldStatusService implements IMinemeldStatusService {
    authorizationSet: boolean = false;
    authorizationString: string;

    $state: angular.ui.IStateService;
    MineMeldAPIService: IMineMeldAPIService;
    MinemeldEventsService: IMinemeldEventsService;
    toastr: any;
    $interval: angular.IIntervalService;
    $rootScope: angular.IRootScopeService;
    $q: angular.IQService;

    statusSubscription: number;
    statusUpdated: number;
    statusUpdatePromise: angular.IPromise<any>;
    currentStatus: IMinemeldStatus;
    currentStatusDeferred: angular.IDeferred<IMinemeldStatus>;

    NODE_STATES: string[] = [
        'READY',
        'CONNECTED',
        'REBUILDING',
        'RESET',
        'INIT',
        'STARTED',
        'CHECKPOINT',
        'IDLE',
        'STOPPED'
    ];

    /** @ngInject */
    constructor($state: angular.ui.IStateService,
                MineMeldAPIService: IMineMeldAPIService,
                MinemeldEventsService: IMinemeldEventsService,
                toastr: any,
                $interval: angular.IIntervalService,
                $rootScope: angular.IRootScopeService,
                $q: angular.IQService) {
        this.$state = $state;
        this.MineMeldAPIService = MineMeldAPIService;
        this.MinemeldEventsService = MinemeldEventsService;
        this.toastr = toastr;
        this.$interval = $interval;
        this.$rootScope = $rootScope;
        this.$q = $q;

        this.MineMeldAPIService.onLogin(this.initStatusMonitor.bind(this));
        this.MineMeldAPIService.onLogout(this.destroyStatusMonitor.bind(this));
        if (this.MineMeldAPIService.isLoggedIn()) {
            this.initStatusMonitor();
        }
    }

    public initStatusMonitor(): void {
        if (this.statusSubscription) {
            return;
        }

        this.currentStatusDeferred = this.$q.defer<IMinemeldStatus>();
        this.updateFullStatus();
    }

    public destroyStatusMonitor(): void {
        if (this.statusUpdatePromise) {
            this.$interval.cancel(this.statusUpdatePromise);
        }

        if (typeof this.statusSubscription === 'undefined') {
            return;
        }

        this.MinemeldEventsService.unsubscribe(this.statusSubscription);
        this.statusSubscription = undefined;
        this.currentStatus = {};
        this.statusUpdated = undefined;
    }

    public getStatus(): angular.IPromise<IMinemeldStatus> {
        if (typeof this.currentStatus === 'undefined') {
            /* wait, we don't have the status yet */
            return this.currentStatusDeferred.promise;
        }

        return this.$q.when(this.currentStatus);
    }

    public getSystem(): angular.IPromise<any> {
        var system: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        system = this.MineMeldAPIService.getAPIResource('/status/system', {}, {
            get: {
                method: 'GET'
            }
        });

        return system.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public getMinemeld(cancellable?: boolean): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (typeof cancellable === 'undefined') {
            cancellable = true;
        }

        minemeld = this.MineMeldAPIService.getAPIResource('/status/minemeld', {}, {
            get: {
                method: 'GET'
            }
        }, cancellable);

        return minemeld.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result;
            }

            return {
                'result': new Array(),
                'timestamp': 0
            };
        });
    }

    public getConfig(): angular.IPromise<any> {
        var config: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        config = this.MineMeldAPIService.getAPIResource('/status/config', {}, {
            get: {
                method: 'GET'
            }
        });

        return config.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public hup(nodename: string) {
        var hupresult: angular.resource.IResourceClass<angular.resource.IResource<any>>;
        var params: any = {
            nodename: nodename
        };

        hupresult = this.MineMeldAPIService.getAPIResource('/status/:nodename/hup', {}, {
            get: {
                method: 'GET'
            }
        }, false);

        return hupresult.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    private onEventsMessage(subtype: string, event: string, e: any): void {
        var status: IMinemeldStatusNode;

        if (typeof e.source === 'undefined' || typeof e.status === 'undefined') {
            return;
        }
        if (typeof e.timestamp === 'undefined') {
            return;
        }

        if (e.source[0] === '<') {
            return;
        }

        if (e.timestamp < this.statusUpdated) {
            console.log('old message, ignored');
            return;
        }

        status = e.status;
        status.name = e.source;

        this.currentStatus[e.source] = status;
        this.statusUpdated = e.timestamp;
        this.$rootScope.$broadcast('mm-status-changed');
    }

    private onEventsOpen(subtype: string, event: string, e: any): void {
        // console.log('open', e);
    }

    private onEventsError(subtype: string, event: string, e: any): void {
        console.log('Error in status event stream:', e);
    }

    private updateFullStatus(): void {
        this.getMinemeld(false).then((result: any) => {
            var status: IMinemeldStatusNode[];
            var ts: number;
            var firstUpdate: boolean = !this.statusUpdated;

            status = result.result;
            ts = result.timestamp;

            this.currentStatus = {};
            angular.forEach(status, (n: IMinemeldStatusNode) => {
                this.currentStatus[n.name] = n;
            });
            this.statusUpdated = ts;
            this.$rootScope.$broadcast('mm-status-changed');

            if (firstUpdate) {
                this.currentStatusDeferred.resolve(this.currentStatus);
            }

            if (typeof this.statusSubscription === 'undefined') {
                this.statusSubscription = this.MinemeldEventsService.subscribeStatusEvents({
                    onopen: this.onEventsOpen.bind(this),
                    onerror: this.onEventsError.bind(this),
                    onmessage: this.onEventsMessage.bind(this)
                });
            }
        }, (error: any) => {
            console.log('ERROR RETRIEVING MINEMELD STATUS: ' + error.statusText);

            throw error;
        })
        .finally(() => {
            this.statusUpdatePromise = this.$interval(
                this.updateFullStatus.bind(this),
                1 * 60 * 1000, /* do a full refresh every 1 minute */
                1
            );
        });
    }
}
