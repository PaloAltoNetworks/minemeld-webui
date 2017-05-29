/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { NodeDetailInfoController } from './nodedetail.info.controller';
import { IMinemeldStatusService } from  '../../app/services/status';
import { IThrottleService } from '../../app/services/throttle';

class ET {
    static CATNAMES: string[] = [
        'CnC',
        'Bot',
        'Spam',
        'Drop',
        'SpywareCnC',
        'OnlineGaming',
        'DriveBySrc',
        'ChatServer',
        'TorNode',
        'Compromised',
        'P2P',
        'Proxy',
        'IPCheck',
        'Utility',
        'DDoSTarget',
        'Scanner',
        'Brute_Forcer',
        'FakeAV',
        'DynDNS',
        'Undesirable',
        'AbusedTLD',
        'SelfSignedSSL',
        'Blackhole',
        'RemoteAccessService',
        'P2PCnC',
        'Parking',
        'VPN',
        'EXE_Source',
        'Mobile_CnC',
        'Mobile_Spyware_CnC',
        'Skype_SuperNode',
        'Bitcoin_Related',
        'DDoSAttacker'
    ];

    static numberToName(catnum: number): string {
        if ((catnum <= 0) || (catnum > ET.CATNAMES.length)) {
            return '' + catnum;
        }

        return ET.CATNAMES[catnum - 1];
    }

    static nameToNumber(cat: string): number {
        return ET.CATNAMES.indexOf(cat) + 1;
    }
}

/** @ngInject */
function proofpointRouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.proofpointinfo', {
            templateUrl: 'app/nodedetail/proofpoint.info.html',
            controller: NodeDetailProofpointInfoController,
            controllerAs: 'nodedetailinfo'
        })
        ;
}

/** @ngInject */
function proofpointRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.proofpoint.EmergingThreatsIP', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.proofpointinfo',
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

    NodeDetailResolver.registerClass('minemeld.ft.proofpoint.EmergingThreatsDomain', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.proofpointinfo',
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

class NodeDetailProofpointInfoController extends NodeDetailInfoController {
    MinemeldConfigService: IMinemeldConfigService;
    $modal: angular.ui.bootstrap.IModalService;

    authCode: string;
    monitoredCategories: number[];
    monitoredCategoriesRepr: string;

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

        this.loadSideConfig();
    }

    loadSideConfig(): void {
        this.MinemeldConfigService.getDataFile(this.nodename + '_side_config')
        .then((result: any) => {
            if (!result) {
                this.authCode = undefined;
                this.monitoredCategories = undefined;
                this.monitoredCategoriesRepr = undefined;

                return;
            }

            if (result.auth_code) {
                this.authCode = result.auth_code;
            } else {
                this.authCode = undefined;
            }

            if (result.monitored_categories) {
                this.monitoredCategories = result.monitored_categories;
                this.updateMonitoredCategoriesRepr();
            } else {
                this.monitoredCategories = undefined;
                this.monitoredCategoriesRepr = undefined;
            }
        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING NODE SIDE CONFIG: ' + error.status);
            this.authCode = undefined;
            this.monitoredCategories = undefined;
            this.monitoredCategoriesRepr = undefined;
        });
    }

    updateMonitoredCategoriesRepr(): void {
        this.monitoredCategoriesRepr = this.monitoredCategories
            .map(ET.numberToName)
            .join(', ');
    }

    setAuthCode(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/proofpoint.sac.modal.html',
            controller: ProofpointSetAuthCodeController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            var sconfig: any = {};

            this.authCode = result.authCode;

            sconfig.auth_code = this.authCode;

            if (this.monitoredCategories) {
                sconfig.monitored_categories = this.monitoredCategories;
            }

            return this.MinemeldConfigService.saveDataFile(
                this.nodename + '_side_config',
                sconfig
            );
        })
        .then((result: any) => {
            this.toastr.success('AUTH CODE SET');
        }, (error: any) => {
            if (!error) {
                return;
            }

            this.toastr.error('ERROR SETTING AUTH CODE: ' + error.statusText);
        });
    }

    setMonitoredCategories(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/proofpoint.smc.modal.html',
            controller: ProofpointSetCategoriesController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            resolve: {
                categories: () => { return this.monitoredCategories; }
            }
        });

        mi.result.then((result: any) => {
            var sconfig: any = {};

            this.monitoredCategories = result.monitoredCategories;
            this.updateMonitoredCategoriesRepr();

            sconfig.monitored_categories = this.monitoredCategories;
            if (this.authCode) {
                sconfig.auth_code = this.authCode;
            }

            return this.MinemeldConfigService.saveDataFile(
                this.nodename + '_side_config',
                sconfig
            );
        })
        .then((result: any) => {
            this.toastr.success('CATEGORIES SET');
        }, (error: any) => {
            if (!error) {
                return;
            }

            this.toastr.error('ERROR SETTING CATEGORIES: ' + error.statusText);
        });
    }
}

class ProofpointSetAuthCodeController {
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

        result.authCode = this.token;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

class ProofpointSetCategoriesController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    categories: string[];
    availableCategories: string[] = ET.CATNAMES;
    changed: boolean = false;

    /* @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                categories: number[]) {
        this.$modalInstance = $modalInstance;
        if (categories) {
            this.categories = categories.map(ET.numberToName);
        }
    }

    hasChanged() {
        this.changed = true;
    }

    save() {
        var result: any = {};

        result.monitoredCategories = this.categories.map(ET.nameToNumber);

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}

console.log('Loading Proofpoint ET');
angular.module('minemeldWebui')
    .config(proofpointRouterConfig)
    .run(proofpointRegisterClass)
    ;
