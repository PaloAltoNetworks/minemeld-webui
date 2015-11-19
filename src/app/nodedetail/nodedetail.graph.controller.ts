/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldStatus, IMinemeldStatusNode } from  '../../app/services/status';

export class NodeDetailGraphController {
    mmstatus: IMinemeldStatus;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $stateParams: angular.ui.IStateParamsService;

    nodename: string;

    nodes: IMinemeldStatusNode[];

    updateMinemeldStatusPromise: angular.IPromise<any>;
    updateMinemeldStatusInterval: number = 5 * 60 * 1000;

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

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    private updateMinemeldStatus() {
        var vm: any = this;

        vm.mmstatus.getMinemeld()
        .then((result: any) => {
            var nodes: IMinemeldStatusNode[] = [];
            var members: string[] = [];
            var clength: number;

/*            do {
                clength = members.length;


            } while (clength != members.length);*/

            vm.nodes = result;
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

    private destroy() {
        if (this.updateMinemeldStatusPromise) {
            this.$interval.cancel(this.updateMinemeldStatusPromise);
        }
    }
}
