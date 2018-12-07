/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { NodeDetailInfoController } from './nodedetail.info.controller';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IConfirmService } from '../../app/services/confirm';
import { IThrottleService } from '../../app/services/throttle';

/** @ngInject */
function o365APIConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.o365apiinfo', {
            templateUrl: 'app/nodedetail/o365api.info.html',
            controller: NodeDetailO365APIInfoController,
            controllerAs: 'nodedetailinfo'
        })
        ;
}

/** @ngInject */
function o365APIRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.o365.O365API', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.o365apiinfo',
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

class NodeDetailO365APIInfoController extends NodeDetailInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    disable_integrations: boolean;
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
            if (typeof result.disable_integrations !== 'undefined') {
                if (result.disable_integrations) {
                    this.disable_integrations = true;
                } else {
                    this.disable_integrations = false;
                }
            } else {
                this.disable_integrations = undefined;
            }
        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            this.disable_integrations = undefined;
        });
    }

    saveSideConfig(): angular.IPromise<any> {
        var side_config: any = {};

        if (typeof this.disable_integrations !== 'undefined') {
            side_config.disable_integrations = this.disable_integrations;
        }

        return this.MinemeldConfigService.saveDataFile(
            this.nodename + '_side_config',
            side_config,
            this.nodename
        );
    }

    toggleDisableIntegrations(): void {
        var p: angular.IPromise<any>;
        var new_value: boolean;

        if (this.disable_integrations) {
            new_value = false;
            p = this.ConfirmService.show(
                'O365 API INTEGRATIONS',
                'Are you sure you want to enable integrations ?'
            );
        } else {
            new_value = true;
            p = this.ConfirmService.show(
                'O365 API INTEGRATIONS',
                'Are you sure you want to disable integrations ?'
            );
        }

        p.then((result: any) => {
            this.disable_integrations = new_value;

            return this.saveSideConfig();
        })
        .then((result: any) => {
            this.toastr.success('O365 INTEGRATIONS TOGGLED');
        }, (error: any) => {
            this.toastr.error('ERROR TOGGLING O365 INTEGRATIONS: ' + error.status);
        });
    }
}

console.log('Loading O365 API');
angular.module('minemeldWebui')
    .config(o365APIConfig)
    .run(o365APIRegisterClass)
    ;
