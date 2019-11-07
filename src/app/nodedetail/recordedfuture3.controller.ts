/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { NodeDetailInfoController } from './nodedetail.info.controller';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IThrottleService } from '../../app/services/throttle';

/** @ngInject */
function recordedFutureRouterConfig($stateProvider: ng.ui.IStateProvider) {
   $stateProvider
       .state('nodedetail.recordedfutureinfo3', {                                       // change
           templateUrl: 'app/nodedetail/recordedfuture.info3.html',                     // file change require
           controller: NodeDetailRecordedFutureInfoController3,
           controllerAs: 'nodedetailinfo3'                                              // changes in html file
       })
       ;
}

/** @ngInject */
function recordedFutureRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
   NodeDetailResolver.registerClass('minemeld.ft.recordedfuture.MasterRiskList', {
       tabs: [{
           icon: 'fa fa-circle-o',
           tooltip: 'INFO',
           state: 'nodedetail.recordedfutureinfo3',
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

class NodeDetailRecordedFutureInfoController3 extends NodeDetailInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    token: string;
    path: string;                                                   // Additional change made here
    entity: string;
    api: string;                                                 // Additional change made here
    $modal: angular.ui.bootstrap.IModalService;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService, MinemeldConfigService: IMinemeldConfigService,
        $modal: angular.ui.bootstrap.IModalService,
        $rootScope: angular.IRootScopeService,
        ThrottleService: IThrottleService) {
        this.MinemeldConfigService = MinemeldConfigService;
        this.$modal = $modal;

        super(
            toastr, $interval, MinemeldStatusService, moment, $scope,
            $compile, $state, $stateParams, $rootScope, ThrottleService
        );

        this.loadToken();
    }

    loadToken(): void {
        this.MinemeldConfigService.getDataFile(this.nodename + '_side_config')
        .then((result: any) => {
            if (result.token) {
                this.token = result.token;
            } else {
                this.token = undefined;
            }

            if (result.path) {                                                // Additional change made here
                this.path = result.path;                                      // Additional change made here
            } else {                                                          // Additional change made here
                this.path = undefined;                                        // Additional change made here
            }

            if (result.entity) {                                                // Additional change made here
                this.entity = result.entity;                                      // Additional change made here
            } else {                                                          // Additional change made here
                this.entity = undefined;                                        // Additional change made here
            }

            if (result.api) {                                                // Additional change made here
                this.api = result.api;                                      // Additional change made here
            } else {                                                          // Additional change made here
                this.api = undefined;                                        // Additional change made here
            }

        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            this.token = undefined;
            this.path = undefined;                                            // Additional change made here
            this.entity = undefined;
            this.api = undefined;                                          // Additional change made here
        });
    }

    setToken(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/recordedfuture.st.modal.html',
            controller: RecorededFutureSetTokenController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            this.token = result.token;
            return this.MinemeldConfigService.saveDataFile(
                this.nodename + '_side_config',
                { path: this.path, token: this.token, entity: this.entity, api: this.api },
                this.nodename
            );
        })
        .then((result: any) => {
            this.toastr.success('API TOKEN SET');
        }, (error: any) => {
            this.toastr.error('ERROR SETTING TOKEN: ' + error.status);
        });
    }

    setDetails(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/recordedfuture.st.details1.html',          // create the html file
            controller: RecorededFutureSetPathController,                       // define the controller class
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {

            this.entity = result.entity;
            this.path = result.path;
            this.api = result.api;

            console.log(this.entity)
            console.log(this.path)
            console.log(this.api)

            return this.MinemeldConfigService.saveDataFile(
                this.nodename + '_side_config',
                { path: this.path, token: this.token, entity: this.entity, api: this.api  },
                this.nodename
            );
        })
        .then((result: any) => {
            this.toastr.success('DETAILS SET');
        }, (error: any) => {
            this.toastr.error('ERROR SETTING DETAILS: ' + error.status);
        });
    }
  }

  class RecorededFutureSetTokenController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    token: string;
    token2: string;

    valid(): boolean {
        if (this.token != this.token2) {
            angular.element('#fgToken1').addClass('has-error');
            angular.element('#fgToken2').addClass('has-error');

            return false;
        }
        angular.element('#fgToken1').removeClass('has-error');
        angular.element('#fgToken2').removeClass('has-error');

        if (!this.token) {
            return false;
        }

        return true;
    }

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance) {
        this.$modalInstance = $modalInstance;
    }

    save() {
        var result: any = {};

        result.token = this.token;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
  };

  class RecorededFutureSetPathController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    entity: string;
    path1: string;
    path2: string;
    api: string;

    valid(): boolean {

        return true;
    }

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance) {
        this.$modalInstance = $modalInstance;
    }

    save() {
        var result: any = {};
      
        if (this.path1 == undefined) {
          result.path = this.path2;
        }
        if (this.path2 == undefined) {
          result.path = this.path1;
        }

        result.entity = this.entity;
        result.api = this.api;

        console.log(result.entity)
        console.log(result.path)
        console.log(result.api)

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
  };

  console.log('Loading RecordedFuture');
  angular.module('minemeldWebui')
    .config(recordedFutureRouterConfig)
    .run(recordedFutureRegisterClass)
    ;
