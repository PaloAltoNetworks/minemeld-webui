/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService, IMinemeldStatusNode } from  '../../app/services/status';
import { IThrottled, IThrottleService } from '../../app/services/throttle';

export class NodeDetailGraphController {
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

    nodes: IMinemeldStatusNode[];

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
            500
        );
        this.mmStatusListener = $rootScope.$on(
            'mm-status-changed',
            this.mmThrottledUpdate
        );

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    private updateMinemeldStatus() {
        var cnode: IMinemeldStatusNode;
        var k: number;
        var i: any;
        var nodes: IMinemeldStatusNode[] = [];
        var members: string[] = [];
        var tobeadded: string[] = [this.nodename];
        var clength: number;

        do {
            clength = members.length;

            Object.keys(this.mmstatus.currentStatus).forEach((nname: string) => {
                cnode = this.mmstatus.currentStatus[nname];

                if (members.indexOf(nname) > -1) {
                    return;
                }

                k = tobeadded.indexOf(nname);
                if (k > -1) {
                    nodes.push(cnode);
                    members.push(nname);
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
                            if (tobeadded.indexOf(nname) <= -1) {
                                tobeadded.push(nname);
                            }
                        }
                    }
                }
            });
        } while ((clength !== members.length) || (tobeadded.length !== 0));

        this.nodes = nodes;
    }

    private destroy() {
        if (this.mmThrottledUpdate) {
            this.mmThrottledUpdate.cancel();
        }
        if (this.mmStatusListener) {
            this.mmStatusListener();
        }
    }
}
