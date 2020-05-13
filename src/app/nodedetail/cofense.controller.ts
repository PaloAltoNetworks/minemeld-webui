/// <reference path="../../../typings/main.d.ts" />

import { NodeDetailCredentialsInfoController } from './credentials.controller';
import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IThrottleService } from '../../app/services/throttle';
import { IConfirmService } from '../../app/services/confirm';

/** @ngInject */
function CofenseConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.cofenseinfo', {
            templateUrl: 'app/nodedetail/cofense.info.html',
            controller: NodeDetailCofenseInfoController,
            controllerAs: 'nodedetailinfo',
            params: {
                usernameName: {
                    value: 'ACCOUNT'
                },
                usernameField: {
                    value: 'api_account'
                },
                secretName: {
                    value: 'TOKEN'
                },
                secretField: {
                    value: 'api_token'
                }
            }
        })
        ;
}

/** @ngInject */
function CofenseRegisterClasses(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.cofense.Triage', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.cofenseinfo',
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
    api_domain?: string;
}

class NodeDetailCofenseInfoController extends NodeDetailCredentialsInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;

    api_domain: string;
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

    setDomain(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/cofense.sd.modal.html',
            controller: CofenseSetDomainController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                api_domain: () => { return this.api_domain; }
            }
        });

        mi.result.then((result: any) => {
            this.api_domain = result.api_domain;

            return this.saveSideConfig().then((result: any) => {
                this.toastr.success('ENDPOINT SET');
            }, (error: any) => {
                this.toastr.error('ERROR SETTING ENDPOINT: ' + error.statusText);
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

    protected restoreSideConfig(result: any) {
        let side_config = <ICIFSideConfig>result;

        super.restoreSideConfig(result);

        this.api_domain = undefined;
        this.verify_cert = undefined;

        if (!result) {
            return;
        }

        if (side_config.api_domain) {
            this.api_domain = side_config.api_domain;
        }

        if (typeof side_config.verify_cert !== 'undefined') {
            this.verify_cert = side_config.verify_cert;
        }
    }

    protected prepareSideConfig(): any {
        var side_config: any = super.prepareSideConfig();

        if (this.api_domain) {
            side_config.api_domain = this.api_domain;
        }

        if (typeof this.verify_cert !== 'undefined') {
            side_config.verify_cert = this.verify_cert;
        }

        return side_config;
    }
}

class CofenseSetDomainController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    api_domain: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, api_domain: string) {
        this.$modalInstance = $modalInstance;
        this.api_domain = api_domain;
    }

    valid(): boolean {
        if (!this.api_domain) {
            return false;
        }

        return true;
    }

    save() {
        var result: any = {};

        result.api_domain = this.api_domain;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

console.log('Loading Cofense');
angular.module('minemeldWebui')
    .config(CofenseConfig)
    .run(CofenseRegisterClasses)
    ;
