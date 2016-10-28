/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { NodeDetailInfoController } from './nodedetail.info.controller';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IConfirmService } from '../../app/services/confirm';
import { IThrottleService } from '../../app/services/throttle';

/** @ngInject */
function threatqExportConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.threatqexportinfo', {
            templateUrl: 'app/nodedetail/threatqexport.info.html',
            controller: NodeDetailThreatQExportInfoController,
            controllerAs: 'nodedetailinfo'
        })
        ;
}

/** @ngInject */
function threatqExportRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.threatq.Export', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.threatqexportinfo',
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

class NodeDetailThreatQExportInfoController extends NodeDetailInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    url: string;
    verify_cert: boolean;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService, MinemeldConfigService: IMinemeldConfigService,
        $rootScope: angular.IRootScopeService,
        ThrottleService: IThrottleService,
        $modal: angular.ui.bootstrap.IModalService,
        ConfirmService: IConfirmService) {
        this.MinemeldConfigService = MinemeldConfigService;
        this.$modal = $modal;
        this.ConfirmService = ConfirmService;

        super(
            toastr, $interval, MinemeldStatusService, moment, $scope,
            $compile, $state, $stateParams, $rootScope, ThrottleService
        );

        this.loadSideConfig();
    }

    loadSideConfig(): void {
        this.MinemeldConfigService.getDataFile(this.nodename + '_side_config')
        .then((result: any) => {
            if (typeof result.url !== 'undefined') {
                this.url = result.url;
            } else {
                this.url = undefined;
            }

            if (typeof result.verify_cert !== 'undefined') {
                if (result.verify_cert) {
                    this.verify_cert = true;
                } else {
                    this.verify_cert = false;
                }
            } else {
                this.verify_cert = undefined;
            }
        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            this.url = undefined;
            this.verify_cert = undefined;
        });
    }

    saveSideConfig(): angular.IPromise<any> {
        var side_config: any = {};

        if (typeof this.url !== 'undefined') {
            side_config.url = this.url;
        }
        if (typeof this.verify_cert !== 'undefined') {
            side_config.verify_cert = this.verify_cert;
        }

        return this.MinemeldConfigService.saveDataFile(
            this.nodename + '_side_config',
            side_config,
            this.nodename
        );
    }

    setUrl(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/threatqexport.url.modal.html',
            controller: ThreatQExportSetUrlController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                url: () => { return this.url; }
            }
        });

        mi.result.then((result: any) => {
            this.url = result.url;

            return this.saveSideConfig();
        })
        .then((result: any) => {
            this.toastr.success('URL SET');
        }, (error: any) => {
            this.toastr.error('ERROR SETTING URL: ' + error.status);
        });
    }

    toggleCertificateVerification(): void {
        var p: angular.IPromise<any>;
        var new_value: boolean;

        if (typeof this.verify_cert === 'undefined' || this.verify_cert) {
            new_value = false;
            p = this.ConfirmService.show(
                'THREATQ EXPORT CERT VERIFICATION',
                'Are you sure you want to disable certificate verification ?'
            );
        } else {
            new_value = true;
            p = this.ConfirmService.show(
                'THREATQ EXPORT CERT VERIFICATION',
                'Are you sure you want to enable certificate verification ?'
            );
        }

        p.then((result: any) => {
            this.verify_cert = new_value;

            return this.saveSideConfig();
        })
        .then((result: any) => {
            this.toastr.success('CERT VERIFICATION TOGGLED');
        }, (error: any) => {
            this.toastr.error('ERROR TOGGLING CERT VERIFICATION: ' + error.status);
        });
    }
}

class ThreatQExportSetUrlController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    url: string;

    valid(): boolean {
        if (!this.url) {
            return false;
        }

        return true;
    }

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, url: string) {
        this.$modalInstance = $modalInstance;
        this.url = url;
    }

    save() {
        var result: any = {};

        result.url = this.url;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

console.log('Loading ThreatQ Export');
angular.module('minemeldWebui')
    .config(threatqExportConfig)
    .run(threatqExportRegisterClass)
    ;
