/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldStatus, IMinemeldStatusNode } from  '../../app/services/status';

interface INGMinemeldStatusNode extends IMinemeldStatusNode {
    indicators: number;
    stateAsString: string;
}

export class NodeDetailInfoController {
    mmstatus: IMinemeldStatus;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $stateParams: angular.ui.IStateParamsService;

    nodename: string;

    nodeState: INGMinemeldStatusNode;
    nodeConfig: any;

    updateMinemeldStatusPromise: angular.IPromise<any>;
    updateMinemeldStatusInterval: number = 5 * 60 * 1000;

    updateMinemeldConfigPromise: angular.IPromise<any>;
    updateMinemeldConfigInterval: number = 5 * 60 * 1000;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatus: IMinemeldStatus,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatus;
        this.$interval = $interval;
        this.moment = moment;
        this.$scope = $scope;
        this.$compile = $compile;
        this.$state = $state;
        this.$stateParams = $stateParams;

        this.nodename = $scope.$parent['nodedetail']['nodename'];

        this.updateMinemeldStatus();
        this.updateMinemeldConfig();

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    public renderState(vm: any, ns: IMinemeldStatusNode) {
        vm.nodeState = ns;
        vm.nodeState.indicators = ns.length;
        vm.nodeState.stateAsString = vm.mmstatus.NODE_STATES[ns.state];
    }

    private updateMinemeldStatus() {
        var vm: any = this;

        vm.mmstatus.getMinemeld()
        .then(function(result: any) {
            var ns: IMinemeldStatusNode;

            ns = <IMinemeldStatusNode>(result.filter(function(x: any) { return x.name === vm.nodename; })[0]);
            vm.renderState(vm, ns);
        }, function(error: any) {
            vm.toastr.error('ERROR RETRIEVING MINEMELD STATUS: ' + error.status);
        })
        .finally(function() {
            vm.updateMinemeldStatusPromise = vm.$interval(
                vm.updateMinemeldStatus.bind(vm),
                vm.updateMinemeldStatusInterval,
                1
            );
        })
        ;
    }

    private updateMinemeldConfig() {
        var vm: any = this;

        vm.mmstatus.getConfig()
        .then(function(result: any) {
            vm.nodeConfig = result.nodes[vm.nodename];
        }, function(error: any) {
            vm.toastr.error('ERROR RETRIEVING MINEMELD CONFIG: ' + error.status);
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
        if (this.updateMinemeldStatusPromise) {
            this.$interval.cancel(this.updateMinemeldStatusPromise);
        }
        if (this.updateMinemeldConfigPromise) {
            this.$interval.cancel(this.updateMinemeldConfigPromise);
        }
    }
}
