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

  authTypeEnabled: boolean;
  authType: string;

  apiKeyEnabled: boolean;
  apiKey: string;

  taxii2DiscoveryServiceEnabled: boolean;
  taxii2DiscoveryService: string;

  taxii2ApiRootEnabled: boolean;
  taxii2ApiRoot: string;

  taxii2CollectionEnabled: boolean;
  taxii2Collection: string;

  taxii2EnabledEnabled: boolean;
  taxii2Enabled: string;

  taxii2VerifyCertEnabled: boolean;
  taxii2VerifyCert: string;

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

    this.authTypeEnabled = false;
    this.apiKeyEnabled = false;
    this.taxii2DiscoveryServiceEnabled = false;
    this.taxii2CollectionEnabled = false;
    this.taxii2EnabledEnabled = false;
    this.taxii2VerifyCertEnabled = false;

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

          // if (typeof (pconfig.client_credentials_required) == 'boolean' && !pconfig.client_credentials_required) {
          //   vm.usernameField = null;
          // } else {
          //   if (typeof (pconfig.username) === 'undefined' && typeof (pconfig.password) === 'undefined') {
          //     vm.usernameField = 'username';
          //   }
          // }

          vm.authTypeEnabled = true;
          // vm.authType = pconfig.authType || "none";

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

          if (pconfig.enabled === "" || pconfig.enabled === false) {
            vm.taxii2EnabledEnabled = true;
          }

          vm.taxii2VerifyCertEnabled = true;

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

  setAuthType(): void {
    var mi: angular.ui.bootstrap.IModalServiceInstance;

    if (!this.authTypeEnabled) {
      return;
    }

    mi = this.$modal.open({
      templateUrl: 'app/nodedetail/taxii2client.authtype.modal.html',
      controller: SetAuthTypeController,
      controllerAs: 'vm',
      bindToController: true,
      backdrop: 'static',
      animation: false,
      resolve: {
        authType: () => {
          return this.authType;
        }
      }
    });

    mi.result.then((result: any) => {
      this.authType = result.authType;

      return this.saveSideConfig().then((result: any) => {
        this.toastr.success('AUTH TYPE SET');
      }, (error: any) => {
        this.toastr.error('ERROR SETTING AUTH TYPE: ' + error.statusText);
      });
    });
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

  setTaxii2Enabled(): void {
    var mi: angular.ui.bootstrap.IModalServiceInstance;

    if (!this.taxii2EnabledEnabled) {
      return;
    }

    mi = this.$modal.open({
      templateUrl: 'app/nodedetail/taxii2client.enabled.modal.html',
      controller: SetTaxii2EnabledController,
      controllerAs: 'vm',
      bindToController: true,
      backdrop: 'static',
      animation: false,
      resolve: {
        taxii2Enabled: () => {
          return this.taxii2Enabled;
        }
      }
    });

    mi.result.then((result: any) => {
      this.taxii2Enabled = result.taxii2Enabled;

      return this.saveSideConfig().then((result: any) => {
        this.toastr.success('NODE STATE SET');
      }, (error: any) => {
        this.toastr.error('ERROR SETTING TAXII 2 ENABLE NODE: ' + error.statusText);
      });
    });
  }

  setTaxii2VerifyCert(): void {
    var mi: angular.ui.bootstrap.IModalServiceInstance;

    if (!this.taxii2VerifyCertEnabled) {
      return;
    }

    mi = this.$modal.open({
      templateUrl: 'app/nodedetail/taxii2client.verifycert.modal.html',
      controller: SetTaxii2VerifyCertController,
      controllerAs: 'vm',
      bindToController: true,
      backdrop: 'static',
      animation: false,
      resolve: {
        taxii2VerifyCert: () => {
          return this.taxii2VerifyCert;
        }
      }
    });

    mi.result.then((result: any) => {
      this.taxii2VerifyCert = result.taxii2VerifyCert;

      return this.saveSideConfig().then((result: any) => {
        this.toastr.success('TAXII 2 VERIFY CERT SET');
      }, (error: any) => {
        this.toastr.error('ERROR SETTING TAXII 2 VERIFY CERT: ' + error.statusText);
      });
    });
  }

  protected restoreSideConfig(result: any) {
    super.restoreSideConfig(result);

    if (!result) {
      this.authType = 'none';
      this.apiKey = undefined;
      this.taxii2DiscoveryService = undefined;
      this.taxii2Collection = undefined;
      this.taxii2Enabled = 'no';
      this.taxii2VerifyCert = 'yes';
    } else {
      if (result.auth_type) {
        this.authType = result.auth_type;
      }

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

      if (result.enabled) {
        this.taxii2Enabled = result.enabled;
      }

      if (result.verify_cert) {
        this.taxii2VerifyCert = result.verify_cert;
      }
    }
  }

  protected prepareSideConfig(): any {
    var side_config: any = super.prepareSideConfig();

    if (this.authType) {
      side_config.auth_type = this.authType;
    }

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

    if (this.taxii2Enabled) {
      side_config.enabled = this.taxii2Enabled;
    }

    if (this.taxii2VerifyCert) {
      side_config.verify_cert = this.taxii2VerifyCert;
    }

    return side_config;
  }
}

class SetAuthTypeController {
  $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

  authType: string;

  /** @ngInject */
  constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, authType: string) {
    this.$modalInstance = $modalInstance;
    this.authType = authType || 'none';
  }

  valid(): boolean {
    if (!this.authType) {
      return false;
    }

    return true;
  }

  save() {
    var result: any = {};

    result.authType = this.authType;

    this.$modalInstance.close(result);
  }

  cancel() {
    this.$modalInstance.dismiss();
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
}

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
}

class SetTaxii2EnabledController {
  $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

  taxii2Enabled: string;

  /** @ngInject */
  constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, taxii2Enabled: string) {
    this.$modalInstance = $modalInstance;
    this.taxii2Enabled = taxii2Enabled || 'no';
  }

  valid(): boolean {
    if (!this.taxii2Enabled) {
      return false;
    }

    return true;
  }

  save() {
    var result: any = {};

    result.taxii2Enabled = this.taxii2Enabled;

    this.$modalInstance.close(result);
  }

  cancel() {
    this.$modalInstance.dismiss();
  }
}

class SetTaxii2VerifyCertController {
  $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

  taxii2VerifyCert: string;

  /** @ngInject */
  constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, taxii2VerifyCert: string) {
    this.$modalInstance = $modalInstance;
    this.taxii2VerifyCert = taxii2VerifyCert || 'yes';
  }

  valid(): boolean {
    if (!this.taxii2VerifyCert) {
      return false;
    }

    return true;
  }

  save() {
    var result: any = {};

    result.taxii2VerifyCert = this.taxii2VerifyCert;

    this.$modalInstance.close(result);
  }

  cancel() {
    this.$modalInstance.dismiss();
  }
}

console.log('Loading TAXII 2 Client');
angular.module('minemeldWebui')
  .config(taxii2ClientConfig)
  .run(taxii2ClientRegisterClasses)
;
