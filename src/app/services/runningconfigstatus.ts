/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldConfigService, IMinemeldConfig, IMinemeldConfigNode } from './config';
import { IMineMeldAPIService } from './minemeldapi';
import { IMinemeldPrototypeService, IMinemeldPrototype } from './prototype';
import { IMineMeldEngineStatusService, IMineMeldEngineStatus } from './enginestatus';

export interface IMinemeldResolvedConfigNode {
    name: string;
    node: IMinemeldConfigNode;
    resolvedPrototype?: IMinemeldPrototype;
}

export interface IMineMeldRunningConfigStatus {
    nodes: { [id: string]: IMinemeldResolvedConfigNode };
}

export interface IMineMeldRunningConfigStatusService {
    getStatus(): ng.IPromise<IMineMeldRunningConfigStatus>;
}

export class MineMeldRunningConfigStatusService implements IMineMeldRunningConfigStatusService {
    MinemeldConfigService: IMinemeldConfigService;
    MineMeldAPIService: IMineMeldAPIService;
    MinemeldPrototypeService: IMinemeldPrototypeService;
    MineMeldEngineStatusService: IMineMeldEngineStatusService;
    toastr: any;
    $interval: angular.IIntervalService;
    $rootScope: angular.IRootScopeService;
    $q: angular.IQService;

    currentStatusDeferred: ng.IDeferred<IMineMeldRunningConfigStatus>;
    statusSubscription: () => void;
    currentStatus: IMineMeldRunningConfigStatus;

    /** @ngInject */
    constructor(MinemeldConfigService: IMinemeldConfigService,
                MineMeldAPIService: IMineMeldAPIService,
                MinemeldPrototypeService: IMinemeldPrototypeService,
                MineMeldEngineStatusService: IMineMeldEngineStatusService,
                toastr: any,
                $interval: angular.IIntervalService,
                $rootScope: angular.IRootScopeService,
                $q: angular.IQService) {
        this.MinemeldConfigService = MinemeldConfigService;
        this.MineMeldAPIService = MineMeldAPIService;
        this.MinemeldPrototypeService = MinemeldPrototypeService;
        this.MineMeldEngineStatusService = MineMeldEngineStatusService;
        this.toastr = toastr;
        this.$interval = $interval;
        this.$rootScope = $rootScope;
        this.$q = $q;

        this.currentStatusDeferred = this.$q.defer<IMineMeldRunningConfigStatus>();
        this.MineMeldAPIService.onLogin(this.initStatusMonitor.bind(this));
        this.MineMeldAPIService.onLogout(this.destroyStatusMonitor.bind(this));
        if (this.MineMeldAPIService.isLoggedIn()) {
            this.initStatusMonitor();
        }
    }

    public getStatus(): angular.IPromise<IMineMeldRunningConfigStatus> {
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

        this.updateRunningConfigStatus();
    }

    private destroyStatusMonitor(): void {
        if (this.statusSubscription) {
            this.statusSubscription();
            this.statusSubscription = undefined;
        }

        this.currentStatus = undefined;
    }

    private changeListener(event: any, status: string): void {
        this.MineMeldEngineStatusService.getStatus().then((status: IMineMeldEngineStatus) => {
            if (status.statename === 'RUNNING' || status.statename === 'STARTING') {
                this.updateRunningConfigStatus();
            }
        });
    }

    private updateRunningConfigStatus(): void {
        this.MinemeldConfigService.runningConfig(false).then((rconfig: IMinemeldConfig) => {
            return this.MinemeldPrototypeService.getPrototypeLibraries(false).then((result: any) => {
                var resolvedNodes: ng.IPromise<IMinemeldResolvedConfigNode>[] = [];

                angular.forEach(rconfig.nodes, (node: IMinemeldConfigNode, nodename: string) => {
                    if (typeof node.prototype === 'undefined') {
                        resolvedNodes.push(this.$q.when({
                            name: nodename,
                            node: node
                        }));

                        return;
                    }

                    resolvedNodes.push(this.MinemeldPrototypeService.getPrototype(node.prototype).then((proto: IMinemeldPrototype) => {
                        return {
                            name: nodename,
                            node: node,
                            resolvedPrototype: proto
                        };
                    }));
                });

                this.$q.all(resolvedNodes).then((rconfignodes: IMinemeldResolvedConfigNode[]) => {
                    this.currentStatus = {
                        nodes: {}
                    };

                    angular.forEach(rconfignodes, (node: IMinemeldResolvedConfigNode) => {
                        this.currentStatus.nodes[node.name] = node;
                    });

                    if (!this.statusSubscription) {
                        // first update
                        this.statusSubscription = this.$rootScope.$on(
                            'mm-engine-status-changed',
                            this.changeListener.bind(this)
                        );
                        this.currentStatusDeferred.resolve(this.currentStatus);
                    }

                    this.$rootScope.$broadcast('mm-running-config-changed');
                }, (error: any) => {
                    if (!error.cancelled) {
                        this.toastr.error('ERROR RESOLVING CONFIG PROTOTYPES: ' + error.statusText);
                    }

                    throw error;
                });
            }, (error: any) => {
                if (!error.cancelled) {
                    this.toastr.error('ERROR RETRIEVING PROTOTYPES LIBRARIES: ' + error.statusText);
                }

                throw error;
            });
        }, (error: any) => {
            if (!error.cancelled) {
                this.toastr.error('ERROR RETRIEVING MINEMELD RUNNING CONFIG: ' + error.statusText);
            }

            throw error;
        });
    }
}
