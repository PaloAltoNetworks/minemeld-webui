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
            var cnode: IMinemeldStatusNode;
            var j: number;
            var k: number;
            var i: any;
            var nodes: IMinemeldStatusNode[] = [];
            var members: string[] = [];
            var tobeadded: string[] = [this.nodename];
            var clength: number;

            do {
                clength = members.length;

                for (var j = 0; j < result.length; j++) {
                    cnode = <IMinemeldStatusNode>result[j];

                    if (members.indexOf(cnode.name) > -1) {
                        continue;
                    }

                    k = tobeadded.indexOf(cnode.name);
                    if (k > -1) {
                        nodes.push(cnode);
                        members.push(cnode.name);
                        tobeadded.splice(k, 1);

                        for (i in cnode.inputs) {
                            if ((tobeadded.indexOf(cnode.inputs[i]) <= -1) &&
                                (members.indexOf(cnode.inputs[i]) <= -1)) {
                                tobeadded.push(cnode.inputs[i]);
                            }
                        }
                    } else {
                        for (i in cnode.inputs) {
                            if (members.indexOf(cnode.inputs[i]) > -1) {
                                if (tobeadded.indexOf(cnode.name) <= -1) {
                                    tobeadded.push(cnode.name);
                                }
                            }
                        }
                    }
                }
            } while ((clength != members.length) || (tobeadded.length != 0));

            vm.nodes = nodes;
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
