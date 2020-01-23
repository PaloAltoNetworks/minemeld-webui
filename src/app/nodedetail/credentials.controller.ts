/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { NodeDetailInfoController } from './nodedetail.info.controller';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IThrottleService } from '../../app/services/throttle';

/** @ngInject */
function credentialsListConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.credentialsinfo', {
            templateUrl: 'app/nodedetail/credentials.info.html',
            controller: NodeDetailCredentialsInfoController,
            controllerAs: 'nodedetailinfo'
        })
        .state('nodedetail.phishmeinfo', {
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
        .state('nodedetail.auscertinfo', {
            templateUrl: 'app/nodedetail/credentials.info.html',
            controller: NodeDetailCredentialsInfoController,
            controllerAs: 'nodedetailinfo',
            params: {
                usernameField: {
                    value: null
                },
                secretName: {
                    value: 'API KEY'
                },
                secretField: {
                    value: 'api_key'
                }
            }
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
        .state('nodedetail.vtinfo', {
            templateUrl: 'app/nodedetail/credentials.info.html',
            controller: NodeDetailCredentialsInfoController,
            controllerAs: 'nodedetailinfo',
            params: {
                usernameField: {
                    value: null
                },
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
                usernameField: {
                    value: null
                },
                secretName: {
                    value: 'API KEY'
                },
                secretField: {
                    value: 'api_key'
                }
            }
        })
        .state('nodedetail.threatconnectinfo', {
            templateUrl: 'app/nodedetail/credentials.info.html',
            controller: NodeDetailCredentialsInfoController,
            controllerAs: 'nodedetailinfo',
            params: {
                usernameName: {
                    value: 'API KEY'
                },
                usernameField: {
                    value: 'apikey'
                },
                secretName: {
                    value: 'API SECRET'
                },
                secretField: {
                    value: 'apisecret'
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
            state: 'nodedetail.auscertinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.mm.JSONSEQMiner', {
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

    NodeDetailResolver.registerClass('minemeld.ft.vt.Notifications', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.vtinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.phishme.Intelligence', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.phishmeinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.threatconnect.IndicatorsMiner', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.threatconnectinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.threatconnect.GroupsMiner', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.threatconnectinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.bambenek.Miner', {
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
}

export class NodeDetailCredentialsInfoController extends NodeDetailInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    secret: string;
    username: string;
    $modal: angular.ui.bootstrap.IModalService;

    usernameName: string = 'USERNAME';
    usernameField: string = 'username';
    secretName: string = 'PASSWORD';
    secretField: string = 'password';

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService, MinemeldConfigService: IMinemeldConfigService,
        $modal: angular.ui.bootstrap.IModalService,
        $rootScope: angular.IRootScopeService,
        ThrottleService: IThrottleService) {
        super(
            toastr, $interval, MinemeldStatusService, moment, $scope,
            $compile, $state, $stateParams, $rootScope, ThrottleService
        );

        this.MinemeldConfigService = MinemeldConfigService;
        this.$modal = $modal;

        if (typeof($stateParams['usernameField']) !== 'undefined') {
            this.usernameField = $stateParams['usernameField'];
        }
        if ($stateParams['usernameName']) {
            this.usernameName = $stateParams['usernameName'];
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
        .then(this.restoreSideConfig.bind(this), (error: any) => {
            this.toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            this.secret = undefined;
            this.username = undefined;
        });
    }

    saveSideConfig(): angular.IPromise<any> {
        var side_config: any;
        var hup_node: string = undefined;

        side_config = this.prepareSideConfig();

        if (this.usernameField && typeof(this.username) !== 'undefined' && typeof(this.secret) !== 'undefined') {
            hup_node = this.nodename;
        }

        return this.MinemeldConfigService.saveDataFile(
            this.nodename + '_side_config',
            side_config,
            hup_node
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

        if (!this.usernameField) {
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
                username: () => { return this.username; },
                usernameName: () => { return this.usernameName }
            }
        });

        mi.result.then((result: any) => {
            this.username = result.username;

            return this.saveSideConfig();
        }, (error: any) => {
            this.toastr.error('ERROR SETTING USERNAME: ' + error.statusText);
        })
        .then((result: any) => {
            this.toastr.success('USERNAME SET');
        });
    }

    protected restoreSideConfig(result: any) {
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

        if (this.usernameField && result[this.usernameField]) {
            this.username = result[this.usernameField];
        } else {
            this.username = undefined;
        }
    }

    protected prepareSideConfig(): any {
        var side_config: any = {};

        if (this.secret) {
            side_config[this.secretField] = this.secret;
        }
        if (this.username && this.usernameField) {
            side_config[this.usernameField] = this.username;
        }

        return side_config;
    }
}

class CredentialsSetPasswordController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    secretName: string;

    password: string;
    password2: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                secretName: string) {
        this.$modalInstance = $modalInstance;
        this.secretName = secretName;
    }

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
    usernameName: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance, username: string, usernameName: string) {
        this.$modalInstance = $modalInstance;
        this.username = username;
        this.usernameName = usernameName;
    }

    valid(): boolean {
        if (!this.username) {
            return false;
        }

        return true;
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
