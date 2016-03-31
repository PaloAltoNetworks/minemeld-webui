/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IConfirmService } from '../../app/services/confirm';
import { NodeDetailInfoController } from './nodedetail.info.controller';
import { IMinemeldStatus } from  '../../app/services/status';

/** @ngInject */
function credentialsListConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.credentialsinfo', {
            templateUrl: 'app/nodedetail/credentials.info.html',
            controller: NodeDetailCredentialsInfoController,
            controllerAs: 'nodedetailinfo'
        })
        ;
}

/** @ngInject **/
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
}

class NodeDetailCredentialsInfoController extends NodeDetailInfoController {
    MinemeldConfig: IMinemeldConfigService;
    password: string;
    username: string;
    $modal: angular.ui.bootstrap.IModalService;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatus: IMinemeldStatus,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService, MinemeldConfig: IMinemeldConfigService,
        $modal: angular.ui.bootstrap.IModalService) {
        super(toastr, $interval, MinemeldStatus, moment, $scope, $compile, $state, $stateParams);

        this.MinemeldConfig = MinemeldConfig;
        this.$modal = $modal;

        this.loadSideConfig();
    }

    loadSideConfig(): void {
        this.MinemeldConfig.getDataFile(this.nodename + '_side_config')
        .then((result: any) => {
            if (result.password) {
                this.password = result.password;
            } else {
                this.password = undefined;
            }

            if (result.username) {
                this.username = result.username;
            } else {
                this.username = undefined;
            }
        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            this.password = undefined;
            this.username = undefined;
        });
    }

    saveSideConfig(): angular.IPromise<any> {
        var side_config: any = {};

        if (this.password) {
            side_config.password = this.password;
        }
        if (this.username) {
            side_config.username = this.username;
        }

        return this.MinemeldConfig.saveDataFile(
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
            animation: false
        });

        mi.result.then((result: any) => {
            this.password = result.password;

            return this.saveSideConfig();
        })
        .then((result: any) => {
            this.toastr.success('PASSWORD SET');
        }, (error: any) => {
            this.toastr.error('ERROR SETTING PASSWORD: ' + error.status);
        });
    }

    setUsername(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/credentials.su.modal.html',
            controller: CredentialsSetUsernameController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                username: () => { return this.username }
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

    password: string;
    password2: string;

    valid(): boolean {
        if (this.password != this.password2) {
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

    /** @ngInject **/
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance) {
        this.$modalInstance = $modalInstance;
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

    /** @ngInject **/
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

console.log("Loading Credentials");
angular.module('minemeldWebui')
    .config(credentialsListConfig)
    .run(credentialsRegisterClasses)
    ;
