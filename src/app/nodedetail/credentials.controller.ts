/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { NodeDetailInfoController } from './nodedetail.info.controller';
import { IMinemeldStatusService } from  '../../app/services/status';

/** @ngInject */
function credentialsListConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.credentialsinfo', {
            templateUrl: 'app/nodedetail/credentials.info.html',
            controller: NodeDetailCredentialsInfoController,
            controllerAs: 'nodedetailinfo'
        })
        .state('nodedetail.anomaliinfo', {
            templateUrl: 'app/nodedetail/credentials.info.html',
            controller: NodeDetailCredentialsInfoController,
            controllerAs: 'nodedetailinfo',
            params: {
                secretName: {
                    value: 'API KEY'
                },
                secretField: {
                    value: 'api_key'
                }
            }
        })
        .state('nodedetail.tmtinfo', {
            templateUrl: 'app/nodedetail/credentials.info.html',
            controller: NodeDetailCredentialsInfoController,
            controllerAs: 'nodedetailinfo',
            params: {
                usernameEnabled: {
                    value: false
                },
                secretName: {
                    value: 'API KEY'
                },
                secretField: {
                    value: 'api_key'
                }
            }
        })
        ;
}

/** @ngInject */
function credentialsRegisterClasses(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.auscert.MaliciousURLFeed', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.credentialsinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.taxii.TaxiiClient', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.credentialsinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.anomali.Intelligence', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.anomaliinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.tmt.DTIAPI', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.tmtinfo',
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

class NodeDetailCredentialsInfoController extends NodeDetailInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    secret: string;
    username: string;
    $modal: angular.ui.bootstrap.IModalService;

    usernameEnabled: boolean = true;
    secretName: string = 'PASSWORD';
    secretField: string = 'password';

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService, MinemeldConfigService: IMinemeldConfigService,
        $modal: angular.ui.bootstrap.IModalService,
        $rootScope: angular.IRootScopeService, $timeout: angular.ITimeoutService) {
        super(
            toastr, $interval, MinemeldStatusService, moment, $scope,
            $compile, $state, $stateParams, $rootScope, $timeout
        );

        this.MinemeldConfigService = MinemeldConfigService;
        this.$modal = $modal;

        if (typeof($stateParams['usernameEnabled']) !== 'undefined') {
            this.usernameEnabled = $stateParams['usernameEnabled'];
        }
        if ($stateParams['secretName']) {
            this.secretName = $stateParams['secretName'];
        }
        if ($stateParams['secretField']) {
            this.secretField = $stateParams['secretField'];
        }

        this.loadSideConfig();
    }

    loadSideConfig(): void {
        this.MinemeldConfigService.getDataFile(this.nodename + '_side_config')
        .then((result: any) => {
            if (!result) {
                this.username = undefined;
                this.secret = undefined;

                return;
            }
            if (result[this.secretField]) {
                this.secret = result[this.secretField];
            } else {
                this.secret = undefined;
            }

            if (this.usernameEnabled && result.username) {
                this.username = result.username;
            } else {
                this.username = undefined;
            }
        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            this.secret = undefined;
            this.username = undefined;
        });
    }

    saveSideConfig(): angular.IPromise<any> {
        var side_config: any = {};

        if (this.secret) {
            side_config[this.secretField] = this.secret;
        }
        if (this.username && this.usernameEnabled) {
            side_config.username = this.username;
        }

        return this.MinemeldConfigService.saveDataFile(
            this.nodename + '_side_config',
            side_config,
            this.nodename
        );
    }

    setPassword(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/credentials.sp.modal.html',
            controller: CredentialsSetPasswordController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                secretName: () => { return this.secretName; }
            }
        });

        mi.result.then((result: any) => {
            this.secret = result.password;

            return this.saveSideConfig();
        })
        .then((result: any) => {
            this.toastr.success(this.secretName + ' SET');
        }, (error: any) => {
            this.toastr.error('ERROR SETTING ' + this.secretName + ': ' + error.status);
        });
    }

    setUsername(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        if (!this.usernameEnabled) {
            return;
        }

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/credentials.su.modal.html',
            controller: CredentialsSetUsernameController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                username: () => { return this.username; }
            }
        });

        mi.result.then((result: any) => {
            this.username = result.username;

            return this.saveSideConfig();
        })
        .then((result: any) => {
            this.toastr.success('USERNAME SET');
        }, (error: any) => {
            this.toastr.error('ERROR SETTING USERNAME: ' + error.status);
        });
    }
}

class CredentialsSetPasswordController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    secretName: string;

    password: string;
    password2: string;

    valid(): boolean {
        if (this.password !== this.password2) {
            angular.element('#fgPassword1').addClass('has-error');
            angular.element('#fgPassword2').addClass('has-error');

            return false;
        }
        angular.element('#fgPassword1').removeClass('has-error');
        angular.element('#fgPassword2').removeClass('has-error');

        if (!this.password) {
            return false;
        }

        return true;
    }

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                secretName: string) {
        this.$modalInstance = $modalInstance;
        this.secretName = secretName;
    }

    save() {
        var result: any = {};

        result.password = this.password;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

class CredentialsSetUsernameController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    username: string;

    valid(): boolean {
        if (!this.username) {
            return false;
        }

        return true;
    }

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, username: string) {
        this.$modalInstance = $modalInstance;
        this.username = username;
    }

    save() {
        var result: any = {};

        result.username = this.username;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

console.log('Loading Credentials');
angular.module('minemeldWebui')
    .config(credentialsListConfig)
    .run(credentialsRegisterClasses)
    ;
