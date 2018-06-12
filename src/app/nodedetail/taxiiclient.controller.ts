/// <reference path="../../../typings/main.d.ts" />

import { NodeDetailCredentialsInfoController } from './credentials.controller';
import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IThrottleService } from '../../app/services/throttle';
import { IConfirmService } from '../../app/services/confirm';
import { IMineMeldRunningConfigStatusService, IMineMeldRunningConfigStatus, IMinemeldResolvedConfigNode } from '../../app/services/runningconfigstatus';

/** @ngInject */
function taxiiClientConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.taxiiclientinfo', {
            templateUrl: 'app/nodedetail/taxiiclient.info.html',
            controller: TAXIIClientInfoController,
            controllerAs: 'nodedetailinfo'
        })
        ;
}

/** @ngInject */
function taxiiClientRegisterClasses(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.taxii.TaxiiClient', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.taxiiclientinfo',
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

interface ITAXIIClientSideConfig {
    username?: string;
    password?: string;
}

class TAXIIClientInfoController extends NodeDetailCredentialsInfoController {
    ConfirmService: IConfirmService;
    MineMeldRunningConfigStatusService: IMineMeldRunningConfigStatusService;

    clientCertEnabled: boolean;
    clientCertSet: boolean;

    serverCAEnabled: boolean;
    serverCASet: boolean;

    subscriptionIdEnabled: boolean;
    subscriptionId: string;

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

        this.clientCertEnabled = false;
        this.clientCertSet = false;

        this.serverCAEnabled = false;
        this.serverCASet = false;

        this.subscriptionIdEnabled = false;

        super(
            toastr, $interval, MinemeldStatusService, moment, $scope,
            $compile, $state, $stateParams, MinemeldConfigService, $modal,
            $rootScope, ThrottleService
        );

        this.ConfirmService = ConfirmService;
    }

    updateMinemeldConfig() {
        var vm: TAXIIClientInfoController = this;

        vm.MineMeldRunningConfigStatusService.getStatus()
        .then(function(result: IMineMeldRunningConfigStatus) {
            var tnodeConfig: IMinemeldResolvedConfigNode;

            tnodeConfig = result.nodes[vm.nodename];
            vm.nodeConfig = tnodeConfig;

            if (vm.nodeConfig.config && (Object.keys(vm.nodeConfig.config).length === 0)) {
                vm.nodeConfig.config = null;
            }

            if (tnodeConfig.resolvedPrototype) {
                var pconfig: any = tnodeConfig.resolvedPrototype.config;

                if (typeof(pconfig.client_credentials_required) == 'boolean' && !pconfig.client_credentials_required) {
                    vm.usernameField = null;
                } else {
                    if (typeof(pconfig.username) === 'undefined' && typeof(pconfig.password) === 'undefined') {
                        vm.usernameField = 'username';
                    }
                }

                if (pconfig.client_cert_required) {
                    vm.clientCertEnabled = true;

                    vm.MinemeldConfigService.getDataFile(vm.nodename, 'cert').then((result: any) => {
                        if (result == null) {
                            vm.clientCertSet = false;
                            return;
                        }

                        vm.MinemeldConfigService.getDataFile(vm.nodename, 'pkey').then((result: any) => {
                            if (result == null) {
                                vm.clientCertSet = false;
                                return;
                            }

                            vm.clientCertSet = true;
                        }, (error: any) => {
                            vm.clientCertSet = false;
                        });
                    }, (error: any) => {
                        vm.clientCertSet = false;
                    });
                }

                if (pconfig.subscription_id_required) {
                    vm.subscriptionIdEnabled = true;
                }

                if (pconfig.discovery_service.startsWith('https://')) {
                    vm.serverCAEnabled = true;

                    vm.MinemeldConfigService.getDataFile(vm.nodename + '-ca', 'cert').then((result: any) => {
                        if (result == null) {
                            vm.serverCASet = false;
                            return;
                        }

                        vm.serverCASet = true;
                    }, (error: any) => {
                        vm.serverCASet = false;
                    });
                }
            }
        }, function(error: any) {
            if (!error.cancelled) {
                vm.toastr.error('ERROR RETRIEVING MINEMELD CONFIG: ' + error.status);
            }
        })
        .finally(function() {
            vm.updateMinemeldConfigPromise = vm.$interval(
                vm.updateMinemeldConfig.bind(vm),
                vm.updateMinemeldConfigInterval,
                1
            );
        })
        ;
    }

    uploadClientCertificate(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/taxiiclient.uploadcert.modal.html',
            controller: UploadClientCertController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                nodeName: () => { return this.nodename; }
            }
        });

        mi.result.then((result: any) => {
            this.$interval.cancel(this.updateMinemeldConfigPromise);
            this.updateMinemeldConfig();
        });
    }

    uploadServerCA(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/taxiiclient.uploadserverca.modal.html',
            controller: UploadServerCACertController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                nodeName: () => { return this.nodename; }
            }
        });

        mi.result.then((result: any) => {
            this.$interval.cancel(this.updateMinemeldConfigPromise);
            this.updateMinemeldConfig();
        });
    }

    setSubscriptionId(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        if (!this.subscriptionIdEnabled) {
            return;
        }

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/taxiiclient.sid.modal.html',
            controller: SetSubscriptionIdController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                subscriptionId: () => { return this.subscriptionId; }
            }
        });

        mi.result.then((result: any) => {
            this.subscriptionId = result.subscriptionId;

            return this.saveSideConfig().then((result: any) => {
                this.toastr.success('SUBSCRIPTION ID SET');
            }, (error: any) => {
                this.toastr.error('ERROR SETTING SUBSCRIPTION ID: ' + error.statusText);
            });
        });
    }

    protected restoreSideConfig(result: any) {
        super.restoreSideConfig(result);

        if (!result) {
            this.subscriptionId = undefined;
        } else {
            if (result.subscription_id) {
                this.subscriptionId = result.subscription_id;
            }
        }
    }

    protected prepareSideConfig(): any {
        var side_config: any = super.prepareSideConfig();

        if (this.subscriptionId) {
            side_config.subscription_id = this.subscriptionId;
        }

        return side_config;
    }
}

class UploadClientCertController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    toastr: any;

    uploading: boolean = false;
    certUploader: any;
    keyUploader: any;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                FileUploader: any,
                toastr: any,
                nodeName: string) {
        this.$modalInstance = $modalInstance;
        this.toastr = toastr;

        this.certUploader = new FileUploader({
            url: '/config/data/' + nodeName + '?t=cert',
            method: 'PUT',
            queueLimit: 1,
            removeAfterUpload: true
        });
        this.keyUploader = new FileUploader({
            url: '/config/data/' + nodeName + '?t=pkey',
            method: 'PUT',
            queueLimit: 1,
            removeAfterUpload: true
        });
        this.certUploader.onErrorItem = this.onErrorItem;
        this.keyUploader.onErrorItem = this.onErrorItem;
        this.certUploader.onSuccessItem = (item: any) => {
            this.keyUploader.uploadAll();
        };
        this.keyUploader.onSuccessItem = (item: any) => {
            this.uploading = false;
            this.toastr.success('CLIENT CERT SET');
            this.$modalInstance.close('ok');
        };
    }

    uploadAll() {
        this.uploading = true;
        this.certUploader.uploadAll();
    }

    cancel() {
        this.$modalInstance.dismiss('cancel');
    }

    private onErrorItem(item: any, response: any, status: any) {
        this.uploading = false;

        if (status === 400) {
            this.toastr.error('ERROR UPLOADING: ' + response.error.message);
            return;
        }

        this.toastr.error('ERROR UPLOADING: ' + status);
    };
}

class UploadServerCACertController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    toastr: any;

    uploading: boolean = false;
    certUploader: any;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                FileUploader: any,
                toastr: any,
                nodeName: string) {
        this.$modalInstance = $modalInstance;
        this.toastr = toastr;

        this.certUploader = new FileUploader({
            url: '/config/data/' + nodeName + '-ca?t=cert',
            method: 'PUT',
            queueLimit: 1,
            removeAfterUpload: true
        });

        this.certUploader.onErrorItem = this.onErrorItem;
        this.certUploader.onSuccessItem = (item: any) => {
            this.uploading = false;
            this.toastr.success('SERVER CA SET');
            this.$modalInstance.close('ok');
        };
    }

    uploadAll() {
        this.uploading = true;
        this.certUploader.uploadAll();
    }

    cancel() {
        this.$modalInstance.dismiss('cancel');
    }

    private onErrorItem(item: any, response: any, status: any) {
        this.uploading = false;

        if (status === 400) {
            this.toastr.error('ERROR UPLOADING: ' + response.error.message);
            return;
        }

        this.toastr.error('ERROR UPLOADING: ' + status);
    };
}

class SetSubscriptionIdController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    subscriptionId: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, subscriptionId: string) {
        this.$modalInstance = $modalInstance;
        this.subscriptionId = subscriptionId;
    }

    valid(): boolean {
        if (!this.subscriptionId) {
            return false;
        }

        return true;
    }

    save() {
        var result: any = {};

        result.subscriptionId = this.subscriptionId;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

console.log('Loading TAXII Client');
angular.module('minemeldWebui')
    .config(taxiiClientConfig)
    .run(taxiiClientRegisterClasses)
    ;
