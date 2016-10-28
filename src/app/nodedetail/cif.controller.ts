/// <reference path="../../../typings/main.d.ts" />

import { NodeDetailCredentialsInfoController } from './credentials.controller';
import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IThrottleService } from '../../app/services/throttle';
import { IConfirmService } from '../../app/services/confirm';

/** @ngInject */
function CIFConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.cifinfo', {
            templateUrl: 'app/nodedetail/cif.info.html',
            controller: NodeDetailCIFInfoController,
            controllerAs: 'nodedetailinfo',
            params: {
                usernameEnabled: {
                    value: false
                },
                secretName: {
                    value: 'TOKEN'
                },
                secretField: {
                    value: 'token'
                }
            }
        })
        ;
}

/** @ngInject */
function CIFRegisterClasses(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.cif.Feed', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.cifinfo',
            active: false
        },
        {
            icon: 'fa fa-area-chart',
            tooltip: 'STATS',
            state: 'nodedetail.stats',
            active: false
        },
        {
            icon: 'fa fa-asterisk',
            tooltip: 'GRAPH',
            state: 'nodedetail.graph',
            active: false
        }]
    });
}

interface ICIFSideConfigFilters {
    tags?: string[];
    otype?: string;
    confidence?: number;
    [key: string]: any;
}

interface ICIFSideConfig {
    verify_cert?: boolean;
    remote?: string;
    filters?: ICIFSideConfigFilters;
}

class NodeDetailCIFInfoController extends NodeDetailCredentialsInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;

    remote: string;
    flattenedFilters: string;
    verify_cert: boolean;

    private _filters: ICIFSideConfigFilters;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService, MinemeldConfigService: IMinemeldConfigService,
        $modal: angular.ui.bootstrap.IModalService,
        $rootScope: angular.IRootScopeService,
        ThrottleService: IThrottleService,
        ConfirmService: IConfirmService) {
        super(
            toastr, $interval, MinemeldStatusService, moment, $scope,
            $compile, $state, $stateParams, MinemeldConfigService, $modal,
            $rootScope, ThrottleService
        );

        this.ConfirmService = ConfirmService;
    }

    setRemote(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/cif.remote.modal.html',
            controller: CIFSetRemoteController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                remote: () => { return this.remote; }
            }
        });

        mi.result.then((result: any) => {
            this.remote = result.remote;

            return this.saveSideConfig().then((result: any) => {
                this.toastr.success('REMOTE SET');
            }, (error: any) => {
                this.toastr.error('ERROR SETTING REMOTE: ' + error.statusText);
            });
        });
    }

    toggleCertificateVerification(): void {
        var p: angular.IPromise<any>;
        var new_value: boolean;

        if (typeof this.verify_cert === 'undefined' || this.verify_cert) {
            new_value = false;
            p = this.ConfirmService.show(
                'CIF REMOTE CERT VERIFICATION',
                'Are you sure you want to disable certificate verification ?'
            );
        } else {
            new_value = true;
            p = this.ConfirmService.show(
                'CIF REMOTE CERT VERIFICATION',
                'Are you sure you want to enable certificate verification ?'
            );
        }

        p.then((result: any) => {
            this.verify_cert = new_value;

            return this.saveSideConfig().then((result: any) => {
                this.toastr.success('CERT VERIFICATION TOGGLED');
            }, (error: any) => {
                this.toastr.error('ERROR TOGGLING CERT VERIFICATION: ' + error.statusText);
            });
        });
    }

    setFilters(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/cif.filters.modal.html',
            controller: CIFSetFiltersController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                filters: () => { return this.filters; }
            }
        });

        mi.result.then((result: any) => {
            this.filters = result.filters;

            return this.saveSideConfig().then((result: any) => {
                this.toastr.success('FILTERS SET');
            }, (error: any) => {
                this.toastr.error('ERROR SETTING FILTERS: ' + error.statusText);
            });
        });
    }

    protected restoreSideConfig(result: any) {
        let side_config = <ICIFSideConfig>result;

        super.restoreSideConfig(result);

        this.remote = undefined;
        this.filters = undefined;
        this.verify_cert = undefined;

        if (!result) {
            return;
        }

        if (side_config.remote) {
            this.remote = side_config.remote;
        }

        if (side_config.filters) {
            this.filters = side_config.filters;
        }

        if (typeof side_config.verify_cert !== 'undefined') {
            this.verify_cert = side_config.verify_cert;
        }
    }

    protected prepareSideConfig(): any {
        var side_config: any = super.prepareSideConfig();

        if (this.remote) {
            side_config.remote = this.remote;
        }

        if (this.filters) {
            side_config.filters = this.filters;
        }

        if (typeof this.verify_cert !== 'undefined') {
            side_config.verify_cert = this.verify_cert;
        }

        return side_config;
    }

    get filters(): ICIFSideConfigFilters {
        return this._filters;
    }

    set filters(newfilters: ICIFSideConfigFilters) {
        this._filters = newfilters;
        this.flattenFilters();
    }

    private flattenFilters(): void {
        var filter: string[] = [];

        if (!this.filters) {
            this.flattenedFilters = undefined;
            return;
        }

        Object.keys(this.filters).forEach((key: string) => {
            var value: any;
            var kv: string;

            kv = key + ': ';
            value = this.filters[key];

            if (value instanceof Array) {
                kv += value.join(', ');
            } else {
                kv += value;
            }

            filter.push(kv);
        });

        this.flattenedFilters = filter.join(' ');
    }
}

class CIFSetRemoteController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    remote: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, remote: string) {
        this.$modalInstance = $modalInstance;
        this.remote = remote;
    }

    valid(): boolean {
        if (!this.remote) {
            return false;
        }

        return true;
    }

    save() {
        var result: any = {};

        result.remote = this.remote;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

class CIFSetFiltersController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    otypes: string[] = [
        'ipv4',
        'ipv6',
        'fqdn',
        'url'
    ];

    defaultTags: string[] = [
        'whitelist',
        'spam',
        'malware',
        'scanner',
        'hijacked',
        'botnet',
        'exploit',
        'phishing'
    ];

    filters: ICIFSideConfigFilters;
    otype: string;
    confidence: string;
    confidenceValid: boolean = true;
    tags: string[];
    changed: boolean;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                filters: ICIFSideConfigFilters) {
        this.$modalInstance = $modalInstance;
        this.filters = filters;

        if (this.filters) {
            if (this.filters.otype) {
                this.otype = this.filters.otype;
            }
            if (typeof this.filters.confidence !== 'undefined') {
                this.confidence = '' + this.filters.confidence;
            }
            if (typeof this.filters.tags !== 'undefined') {
                this.tags = this.filters.tags;
            }
        }
    }

    tagging(value: any): any {
        return value;
    }

    valid(): boolean {
        var result: boolean = true;
        var nconfidence: number;

        if (!this.changed) {
            result = false;
        }

        angular.element('#fgConfidence').removeClass('has-error');
        if (typeof this.confidence !== 'undefined' && this.confidence.length !== 0) {
            if (!/^\s*[0-9]+\s*$/.test(this.confidence)) {
                result = false;
                angular.element('#fgConfidence').addClass('has-error');
            } else {
                nconfidence = +this.confidence;
                if (nconfidence < 0 || nconfidence > 100 || isNaN(nconfidence)) {
                    result = false;
                    angular.element('#fgConfidence').addClass('has-error');
                }
            }
        }

        return result;
    }

    save() {
        var result: any = {};

        result.filters = this.filters;

        if (typeof this.confidence !== 'undefined' && this.confidence.length !== 0) {
            if (!result.filters) {
                result.filters = {};
            }

            result.filters.confidence = +this.confidence;
        } else {
            if (result.filters) {
                delete result.filters.confidence;
            }
        }

        if (typeof this.tags !== 'undefined' && this.tags.length !== 0) {
            if (!result.filters) {
                result.filters = {};
            }

            result.filters.tags = this.tags;
        } else {
            if (result.filters) {
                delete result.filters.tags;
            }
        }

        if (typeof this.otype !== 'undefined' && this.otype.length !== 0) {
            if (!result.filters) {
                result.filters = {};
            }

            result.filters.otype = this.otype;
        } else {
            if (result.filters) {
                delete result.filters.otype;
            }
        }

        if (Object.keys(result.filters).length === 0) {
            result.filters = undefined;
        }

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

console.log('Loading CIF');
angular.module('minemeldWebui')
    .config(CIFConfig)
    .run(CIFRegisterClasses)
    ;
