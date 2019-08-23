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

function identity(val) {
  return val;
}

function from_bool(val) {
  return val ? "yes" : "no";
}

function to_bool(val) {
  return val === "yes";
}

const propNameMap = {
  'authType': {key: 'auth_type', from_side_config: identity, to_side_config: identity},
  'apiKey': {key: 'api_key', from_side_config: identity, to_side_config: identity},
  'taxii2DiscoveryService': {key: 'discovery_service', from_side_config: identity, to_side_config: identity},
  'taxii2ApiRoot': {key: 'api_root', from_side_config: identity, to_side_config: identity},
  'taxii2Collection': {key: 'collection', from_side_config: identity, to_side_config: identity},
  'taxii2VerifyCert': {key: 'verify_cert', from_side_config: from_bool, to_side_config: to_bool},
  'taxii2Enabled': {key: 'enabled', from_side_config: from_bool, to_side_config: to_bool}
};

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

  pconfig: any;
  side_config: any;

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

    this.authTypeEnabled = true;
    this.apiKeyEnabled = true;
    this.taxii2DiscoveryServiceEnabled = true;
    this.taxii2ApiRootEnabled = true;
    this.taxii2CollectionEnabled = true;
    this.taxii2VerifyCertEnabled = true;
    this.taxii2EnabledEnabled = true;

    this.pconfig = {};
    this.side_config = {};

    super(
      toastr, $interval, MinemeldStatusService, moment, $scope,
      $compile, $state, $stateParams, MinemeldConfigService, $modal,
      $rootScope, ThrottleService
    );

    this.ConfirmService = ConfirmService;
  }

  mergeMinemeldConfigs() {
    var vm: TAXII2ClientInfoController = this;

    try {
      Object.keys(propNameMap).forEach(k => {
        const field = propNameMap[k];
        const val = vm.side_config[field.key] || vm.pconfig[field.key];
        vm[k] = field.from_side_config(val);
      })
    } catch (e) {
      console.log(e);
    }
  }

  updateMinemeldConfig() {
    var vm: TAXII2ClientInfoController = this;

    vm.MineMeldRunningConfigStatusService.getStatus()
      .then(function (result: IMineMeldRunningConfigStatus) {
        var tnodeConfig: IMinemeldResolvedConfigNode;
        tnodeConfig = result.nodes[vm.nodename];
        vm.pconfig = tnodeConfig.resolvedPrototype ? tnodeConfig.resolvedPrototype.config : {};

        vm.mergeMinemeldConfigs()
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

    if (result) {
      this.side_config = result;
    }

    this.mergeMinemeldConfigs();
  }

  protected prepareSideConfig(): any {
    var side_config: any = super.prepareSideConfig();

    try {
      Object.keys(propNameMap).forEach(k => {
        if (this[k]) {
          const field = propNameMap[k];
          side_config[field.key] = field.to_side_config(this[k]);
        }
      });
    } catch (e) {
      console.log(e);
    }

    this.side_config = side_config;
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
