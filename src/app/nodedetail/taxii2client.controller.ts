/// <reference path="../../../typings/main.d.ts" />

import {NodeDetailCredentialsInfoController} from './credentials.controller';
import {INodeDetailResolverService} from '../../app/services/nodedetailresolver';
import {IMinemeldConfigService} from '../../app/services/config';
import {IMinemeldStatusService} from '../../app/services/status';
import {IThrottleService} from '../../app/services/throttle';
import {IConfirmService} from '../../app/services/confirm';
import {
  IMinemeldResolvedConfigNode,
  IMineMeldRunningConfigStatus,
  IMineMeldRunningConfigStatusService
} from '../../app/services/runningconfigstatus';

/** @ngInject */
function taxii2ClientConfig($stateProvider: ng.ui.IStateProvider) {
  $stateProvider
    .state('nodedetail.taxii2clientinfo', {
      templateUrl: 'app/nodedetail/taxii2client.info.html',
      controller: TAXII2ClientInfoController,
      controllerAs: 'nodedetailinfo'
    })
  ;
}

/** @ngInject */
function taxii2ClientRegisterClasses(NodeDetailResolver: INodeDetailResolverService) {
  NodeDetailResolver.registerClass('minemeld.ft.taxii2.Taxii2Client', {
    tabs: [{
      icon: 'fa fa-circle-o',
      tooltip: 'INFO',
      state: 'nodedetail.taxii2clientinfo',
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

interface ITAXII2ClientSideConfig {
  username?: string;
  password?: string;
}

class TAXII2ClientInfoController extends NodeDetailCredentialsInfoController {
  ConfirmService: IConfirmService;
  MineMeldRunningConfigStatusService: IMineMeldRunningConfigStatusService;

  apiKeyEnabled: boolean;
  apiKey: string;

  taxii2DiscoveryServiceEnabled: boolean;
  taxii2DiscoveryService: string;

  taxii2ApiRootEnabled: boolean;
  taxii2ApiRoot: string;

  taxii2CollectionEnabled: boolean;
  taxii2Collection: string;

  /* @ngInject */
  constructor(toastr: any, $interval: angular.IIntervalService,
              MinemeldStatusService: IMinemeldStatusService,
              moment: moment.MomentStatic, $scope: angular.IScope,
              $compile: angular.ICompileService, $state: angular.ui.IStateService,
              $stateParams: angular.ui.IStateParamsService, MinemeldConfigService: IMinemeldConfigService,
              $modal: angular.ui.bootstrap.IModalService,
              $rootScope: angular.IRootScopeService,
              ThrottleService: IThrottleService,
              MineMeldRunningConfigStatusService: IMineMeldRunningConfigStatusService,
              ConfirmService: IConfirmService) {
    this.MineMeldRunningConfigStatusService = MineMeldRunningConfigStatusService;

    this.apiKeyEnabled = false;
    this.taxii2DiscoveryServiceEnabled = false;
    this.taxii2CollectionEnabled = false;
    this.taxii2CollectionEnabled = false;

    super(
      toastr, $interval, MinemeldStatusService, moment, $scope,
      $compile, $state, $stateParams, MinemeldConfigService, $modal,
      $rootScope, ThrottleService
    );

    this.ConfirmService = ConfirmService;
  }

  updateMinemeldConfig() {
    var vm: TAXII2ClientInfoController = this;

    vm.MineMeldRunningConfigStatusService.getStatus()
      .then(function (result: IMineMeldRunningConfigStatus) {
        var tnodeConfig: IMinemeldResolvedConfigNode;

        tnodeConfig = result.nodes[vm.nodename];
        vm.nodeConfig = tnodeConfig;

        if (vm.nodeConfig.config && (Object.keys(vm.nodeConfig.config).length === 0)) {
          vm.nodeConfig.config = null;
        }

        if (tnodeConfig.resolvedPrototype) {
          var pconfig: any = tnodeConfig.resolvedPrototype.config;

          if (typeof (pconfig.client_credentials_required) == 'boolean' && !pconfig.client_credentials_required) {
            vm.usernameField = null;
          } else {
            if (typeof (pconfig.username) === 'undefined' && typeof (pconfig.password) === 'undefined') {
              vm.usernameField = 'username';
            }
          }

          if (pconfig.api_key === "") {
            vm.apiKeyEnabled = true;
          }

           if (pconfig.discovery_service === "") {
             vm.taxii2DiscoveryServiceEnabled = true;
           }

           if (pconfig.api_root === "") {
             vm.taxii2ApiRootEnabled = true;
           }

          if (pconfig.collection === "") {
            vm.taxii2CollectionEnabled = true;
          }

        }
      }, function (error: any) {
        if (!error.cancelled) {
          vm.toastr.error('ERROR RETRIEVING MINEMELD CONFIG: ' + error.status);
        }
      })
      .finally(function () {
        vm.updateMinemeldConfigPromise = vm.$interval(
          vm.updateMinemeldConfig.bind(vm),
          vm.updateMinemeldConfigInterval,
          1
        );
      })
    ;
  }

  setApiKey(): void {
    var mi: angular.ui.bootstrap.IModalServiceInstance;

    if (!this.apiKeyEnabled) {
      return;
    }

    mi = this.$modal.open({
      templateUrl: 'app/nodedetail/taxii2client.apikey.modal.html',
      controller: SetApiKeyController,
      controllerAs: 'vm',
      bindToController: true,
      backdrop: 'static',
      animation: false,
      resolve: {
        apiKey: () => {
          return this.apiKey;
        }
      }
    });

    mi.result.then((result: any) => {
      this.apiKey = result.apiKey;

      return this.saveSideConfig().then((result: any) => {
        this.toastr.success('API KEY SET');
      }, (error: any) => {
        this.toastr.error('ERROR SETTING API KEY: ' + error.statusText);
      });
    });
  }

  setTaxii2DiscoveryService(): void {
    var mi: angular.ui.bootstrap.IModalServiceInstance;

    if (!this.taxii2DiscoveryServiceEnabled) {
      return;
    }

    mi = this.$modal.open({
      templateUrl: 'app/nodedetail/taxii2client.discovery.modal.html',
      controller: SetTaxii2DiscoveryServiceController,
      controllerAs: 'vm',
      bindToController: true,
      backdrop: 'static',
      animation: false,
      resolve: {
        taxii2DiscoveryService: () => {
          return this.taxii2DiscoveryService;
        }
      }
    });

    mi.result.then((result: any) => {
      this.taxii2DiscoveryService = result.taxii2DiscoveryService;

      return this.saveSideConfig().then((result: any) => {
        this.toastr.success('TAXII 2 DISCOVERY SERVICE URL SET');
      }, (error: any) => {
        this.toastr.error('ERROR SETTING TAXII 2 DISCOVERY SERVICE URL: ' + error.statusText);
      });
    });
  }

  setTaxii2ApiRoot(): void {
    var mi: angular.ui.bootstrap.IModalServiceInstance;

    if (!this.taxii2DiscoveryServiceEnabled) {
      return;
    }

    mi = this.$modal.open({
      templateUrl: 'app/nodedetail/taxii2client.apiroot.modal.html',
      controller: SetTaxii2ApiRootController,
      controllerAs: 'vm',
      bindToController: true,
      backdrop: 'static',
      animation: false,
      resolve: {
        taxii2ApiRoot: () => {
          return this.taxii2ApiRoot;
        }
      }
    });

    mi.result.then((result: any) => {
      this.taxii2ApiRoot = result.taxii2ApiRoot;

      return this.saveSideConfig().then((result: any) => {
        this.toastr.success('TAXII 2 API ROOT SET');
      }, (error: any) => {
        this.toastr.error('ERROR SETTING TAXII 2 API ROOT: ' + error.statusText);
      });
    });
  }

  setTaxii2Collection(): void {
    var mi: angular.ui.bootstrap.IModalServiceInstance;

    if (!this.taxii2CollectionEnabled) {
      return;
    }

    mi = this.$modal.open({
      templateUrl: 'app/nodedetail/taxii2client.collection.modal.html',
      controller: SetTaxii2CollectionController,
      controllerAs: 'vm',
      bindToController: true,
      backdrop: 'static',
      animation: false,
      resolve: {
        taxii2Collection: () => {
          return this.taxii2Collection;
        }
      }
    });

    mi.result.then((result: any) => {
      this.taxii2Collection = result.taxii2Collection;

      return this.saveSideConfig().then((result: any) => {
        this.toastr.success('TAXII 2 COLLECTION URL SET');
      }, (error: any) => {
        this.toastr.error('ERROR SETTING TAXII 2 COLLECTION URL: ' + error.statusText);
      });
    });
  }

  protected restoreSideConfig(result: any) {
    super.restoreSideConfig(result);

    if (!result) {
      this.apiKey = undefined;
      this.taxii2DiscoveryService = undefined;
      this.taxii2Collection = undefined;
    } else {
      if (result.api_key) {
        this.apiKey = result.api_key;
      }

      if (result.discovery_service) {
        this.taxii2DiscoveryService = result.discovery_service;
      }

      if (result.api_root) {
        this.taxii2ApiRoot = result.api_root;
      }

      if (result.collection) {
        this.taxii2Collection = result.collection;
      }
    }
  }

  protected prepareSideConfig(): any {
    var side_config: any = super.prepareSideConfig();

    if (this.apiKey) {
      side_config.api_key = this.apiKey;
    }

    if (this.taxii2DiscoveryService) {
      side_config.discovery_service = this.taxii2DiscoveryService;
    }

    if (this.taxii2ApiRoot) {
      side_config.api_root = this.taxii2ApiRoot;
    }

    if (this.taxii2Collection) {
      side_config.collection = this.taxii2Collection;
    }

    return side_config;
  }
}

class SetApiKeyController {
  $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

  apiKey: string;

  /** @ngInject */
  constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, apiKey: string) {
    this.$modalInstance = $modalInstance;
    this.apiKey = apiKey;
  }

  valid(): boolean {
    if (!this.apiKey) {
      return false;
    }

    return true;
  }

  save() {
    var result: any = {};

    result.apiKey = this.apiKey;

    this.$modalInstance.close(result);
  }

  cancel() {
    this.$modalInstance.dismiss();
  }
};

class SetTaxii2DiscoveryServiceController {
  $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

  taxii2DiscoveryService: string;

  /** @ngInject */
  constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, taxii2DiscoveryService: string) {
    this.$modalInstance = $modalInstance;
    this.taxii2DiscoveryService = taxii2DiscoveryService;
  }

  valid(): boolean {
    if (!this.taxii2DiscoveryService) {
      return false;
    }

    return true;
  }

  save() {
    var result: any = {};

    result.taxii2DiscoveryService = this.taxii2DiscoveryService;

    this.$modalInstance.close(result);
  }

  cancel() {
    this.$modalInstance.dismiss();
  }
}

class SetTaxii2ApiRootController {
  $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

  taxii2ApiRoot: string;

  /** @ngInject */
  constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, taxii2ApiRoot: string) {
    this.$modalInstance = $modalInstance;
    this.taxii2ApiRoot = taxii2ApiRoot;
  }

  valid(): boolean {
    if (!this.taxii2ApiRoot) {
      return false;
    }

    return true;
  }

  save() {
    var result: any = {};

    result.taxii2ApiRoot = this.taxii2ApiRoot;

    this.$modalInstance.close(result);
  }

  cancel() {
    this.$modalInstance.dismiss();
  }
}

class SetTaxii2CollectionController {
  $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

  taxii2Collection: string;

  /** @ngInject */
  constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, taxii2Collection: string) {
    this.$modalInstance = $modalInstance;
    this.taxii2Collection = taxii2Collection;
  }

  valid(): boolean {
    if (!this.taxii2Collection) {
      return false;
    }

    return true;
  }

  save() {
    var result: any = {};

    result.taxii2Collection = this.taxii2Collection;

    this.$modalInstance.close(result);
  }

  cancel() {
    this.$modalInstance.dismiss();
  }
};

console.log('Loading TAXII 2 Client');
angular.module('minemeldWebui')
  .config(taxii2ClientConfig)
  .run(taxii2ClientRegisterClasses)
;
