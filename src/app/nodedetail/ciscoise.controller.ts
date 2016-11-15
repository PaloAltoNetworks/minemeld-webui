/// <reference path="../../../typings/main.d.ts" />

import { NodeDetailCredentialsInfoController } from './credentials.controller';
import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IThrottleService } from '../../app/services/throttle';
import { IConfirmService } from '../../app/services/confirm';

/** @ngInject */
function ciscoISEConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.ciscoiseinfo', {
            templateUrl: 'app/nodedetail/ciscoise.info.html',
            controller: NodeDetailCiscoISEInfoController,
            controllerAs: 'nodedetailinfo',
            params: {
                usernameEnabled: {
                    value: true
                },
                secretName: {
                    value: 'PASSWORD'
                },
                secretField: {
                    value: 'password'
                }
            }
        })
        ;
}

/** @ngInject */
function ciscoISERegisterClasses(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.ciscoise.ErsSgt', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.ciscoiseinfo',
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

interface ICIFSideConfig {
    verify_cert?: boolean;
    hostname?: string;
    username?: string;
    password?: string;
}

class NodeDetailCiscoISEInfoController extends NodeDetailCredentialsInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;

    hostname: string;
    password: string;
    username: string;
    verify_cert: boolean;

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

    setHostname(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/ciscoise.hostname.modal.html',
            controller: CiscoISESetHostnameController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                hostname: () => { return this.hostname; }
            }
        });

        mi.result.then((result: any) => {
            this.hostname = result.hostname;

            return this.saveSideConfig().then((result: any) => {
                this.toastr.success('HOSTNAME SET');
            }, (error: any) => {
                this.toastr.error('ERROR SETTING HOSTNAME: ' + error.statusText);
            });
        });
    }

    toggleCertificateVerification(): void {
        var p: angular.IPromise<any>;
        var new_value: boolean;

        if (typeof this.verify_cert === 'undefined' || this.verify_cert) {
            new_value = false;
            p = this.ConfirmService.show(
                'CISCO ISE REMOTE CERT VERIFICATION',
                'Are you sure you want to disable certificate verification ?'
            );
        } else {
            new_value = true;
            p = this.ConfirmService.show(
                'CISCO ISE REMOTE CERT VERIFICATION',
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

    protected restoreSideConfig(result: any) {
        let side_config = <ICIFSideConfig>result;

        super.restoreSideConfig(result);

        this.hostname = undefined;
        this.username = undefined;
        this.password = undefined;
        this.verify_cert = undefined;

        if (!result) {
            return;
        }

        if (side_config.hostname) {
            this.hostname = side_config.hostname;
        }

        if (side_config.username) {
            this.username = side_config.username;
        }

        if (side_config.password) {
            this.password = side_config.password;
        }

        if (typeof side_config.verify_cert !== 'undefined') {
            this.verify_cert = side_config.verify_cert;
        }
    }

    protected prepareSideConfig(): any {
        var side_config: any = super.prepareSideConfig();

        if (this.hostname) {
            side_config.hostname = this.hostname;
        }

        if (this.username) {
            side_config.username = this.username;
        }

        if (this.password) {
            side_config.password = this.password;
        }

        if (typeof this.verify_cert !== 'undefined') {
            side_config.verify_cert = this.verify_cert;
        }

        return side_config;
    }
}

class CiscoISESetHostnameController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    hostname: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, hostname: string) {
        this.$modalInstance = $modalInstance;
        this.hostname = hostname;
    }

    valid(): boolean {
        if (!this.hostname) {
            return false;
        }

        return true;
    }

    save() {
        var result: any = {};

        result.hostname = this.hostname;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

console.log('Loading CiscoISE');
angular.module('minemeldWebui')
    .config(ciscoISEConfig)
    .run(ciscoISERegisterClasses)
    ;
