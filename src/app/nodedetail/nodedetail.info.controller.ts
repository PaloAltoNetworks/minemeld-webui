/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService, IMinemeldStatusNode, IMinemeldStatus } from  '../../app/services/status';
import { IThrottled, IThrottleService } from '../../app/services/throttle';

interface INGMinemeldStatusNode extends IMinemeldStatusNode {
    indicators: number;
    stateAsString: string;
}

export class NodeDetailInfoController {
    mmstatus: IMinemeldStatusService;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $stateParams: angular.ui.IStateParamsService;

    mmStatusListener: any;
    mmThrottledUpdate: IThrottled;

    nodename: string;

    nodeState: INGMinemeldStatusNode;
    nodeConfig: any;

    updateMinemeldConfigPromise: angular.IPromise<any>;
    updateMinemeldConfigInterval: number = 60 * 1000;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService,
        $rootScope: angular.IRootScopeService,
        ThrottleService: IThrottleService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.$interval = $interval;
        this.moment = moment;
        this.$scope = $scope;
        this.$compile = $compile;
        this.$state = $state;
        this.$stateParams = $stateParams;

        this.nodename = $scope.$parent['nodedetail']['nodename'];

        this.updateMinemeldStatus();

        this.mmThrottledUpdate = ThrottleService.throttle(
            this.updateMinemeldStatus.bind(this),
            250
        );
        this.mmStatusListener = $rootScope.$on(
            'mm-status-changed',
            this.mmThrottledUpdate
        );
        this.updateMinemeldConfig();

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    public renderState(vm: any, ns: IMinemeldStatusNode) {
        vm.nodeState = ns;
        vm.nodeState.indicators = ns.length;
        vm.nodeState.stateAsString = vm.mmstatus.NODE_STATES[ns.state];
    }

    public run(): void {
        this.mmstatus.hup(this.nodename)
            .then(() => {
                this.toastr.success('NEW RUN FOR ' + this.nodename + ' SUCCESSFULLY SCHEDULED');
            })
            .catch((error: any) => {
                this.toastr.error('ERROR HUPPING NODE: ' + error.status);
            });
    }

    private updateMinemeldStatus() {
        var vm: NodeDetailInfoController = this;

        this.mmstatus.getStatus().then((currentStatus: IMinemeldStatus) => {
            vm.renderState(vm, currentStatus[vm.nodename]);
        });
    }

    updateMinemeldConfig() {
        var vm: NodeDetailInfoController = this;

        vm.mmstatus.getConfig()
        .then(function(result: any) {
            vm.nodeConfig = result.nodes[vm.nodename];
            if (vm.nodeConfig.config && (Object.keys(vm.nodeConfig.config).length === 0)) {
                vm.nodeConfig.config = null;
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

    private destroy() {
        if (this.mmThrottledUpdate) {
            this.mmThrottledUpdate.cancel();
        }
        if (this.mmStatusListener) {
            this.mmStatusListener();
        }
        if (this.updateMinemeldConfigPromise) {
            this.$interval.cancel(this.updateMinemeldConfigPromise);
        }
    }
}
