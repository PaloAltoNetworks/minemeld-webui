/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';
import { IMinemeldEventsService } from './events';
import { IMinemeldSupervisorService } from './supervisor';

export interface IMineMeldEngineStatusService {
    getStatus(): angular.IPromise<IMineMeldEngineStatus>;
}

export interface IMineMeldEngineStatus {
    statename: string;
}

export class MineMeldEngineStatusService implements IMineMeldEngineStatusService {
    MineMeldAPIService: IMineMeldAPIService;
    MinemeldEventsService: IMinemeldEventsService;
    toastr: any;
    $interval: angular.IIntervalService;
    $rootScope: angular.IRootScopeService;
    $q: angular.IQService;
    MinemeldSupervisorService: IMinemeldSupervisorService;

    currentStatusDeferred: ng.IDeferred<IMineMeldEngineStatus>;
    statusSubscription: () => void;
    currentStatus: IMineMeldEngineStatus;
    statusUpdatePromise: ng.IPromise<any>;

    /** @ngInject */
    constructor(MinemeldSupervisorService: IMinemeldSupervisorService,
                MineMeldAPIService: IMineMeldAPIService,
                MinemeldEventsService: IMinemeldEventsService,
                toastr: any,
                $interval: angular.IIntervalService,
                $rootScope: angular.IRootScopeService,
                $q: angular.IQService) {
        this.MineMeldAPIService = MineMeldAPIService;
        this.MinemeldEventsService = MinemeldEventsService;
        this.MinemeldSupervisorService = MinemeldSupervisorService;
        this.toastr = toastr;
        this.$interval = $interval;
        this.$rootScope = $rootScope;
        this.$q = $q;

        this.currentStatusDeferred = this.$q.defer<IMineMeldEngineStatus>();
        this.MineMeldAPIService.onLogin(this.initStatusMonitor.bind(this));
        this.MineMeldAPIService.onLogout(this.destroyStatusMonitor.bind(this));
        if (this.MineMeldAPIService.isLoggedIn()) {
            this.initStatusMonitor();
        }
    }

    public getStatus(): angular.IPromise<IMineMeldEngineStatus> {
        if (!this.currentStatus) {
            /* wait, we don't have the status yet */
            return this.currentStatusDeferred.promise;
        }

        return this.$q.when(this.currentStatus);
    }

    private initStatusMonitor(): void {
        if (this.statusSubscription) {
            return;
        }

        this.updateEngineStatus();
    }

    private destroyStatusMonitor(): void {
        if (this.statusSubscription) {
            this.statusSubscription();
            this.statusSubscription = undefined;
        }
        if (this.statusUpdatePromise) {
            this.$interval.cancel(this.statusUpdatePromise);
        }

        this.currentStatus = undefined;
    }

    private changeListener(event: any, status: string): void {
        var broadcast: boolean;

        broadcast = this.currentStatus.statename != status;
        this.currentStatus.statename = status;
        if (broadcast) {
            this.$rootScope.$broadcast('mm-engine-status-changed');
        }
    }

    private updateEngineStatus(): void {
        this.MinemeldSupervisorService.getStatus(false).then((result: any) => {
            var oldStatename: string;

            if (this.currentStatus) {
                oldStatename = this.currentStatus.statename;
            }

            this.currentStatus = result.processes['minemeld-engine'];

            if (!this.statusSubscription) {
                // first update
                this.statusSubscription = this.$rootScope.$on(
                    'mm-inner-engine-status-changed',
                    this.changeListener.bind(this)
                );
                this.currentStatusDeferred.resolve(this.currentStatus);
            }

            if (oldStatename != this.currentStatus.statename) {
                this.$rootScope.$broadcast('mm-engine-status-changed');
            }
        }, (error: any) => {
            console.log('ERROR RETRIEVING MINEMELD ENGINE STATUS: ' + error.statusText);

            throw error;
        })
        .finally(() => {
            this.statusUpdatePromise = this.$interval(
                this.updateEngineStatus.bind(this),
                1 * 60 * 1000, /* do a full refresh every 1 minute */
                1
            );
        });
    }
}
