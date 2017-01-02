/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService, IMinemeldStatusNode, IMinemeldStatus } from  '../../app/services/status';
import { IMineMeldRunningConfigStatusService, IMineMeldRunningConfigStatus, IMinemeldResolvedConfigNode } from '../../app/services/runningconfigstatus';
import { IThrottled, IThrottleService } from '../../app/services/throttle';

export class NodeDetailGraphController {
    mmstatus: IMinemeldStatusService;
    MineMeldRunningConfigStatusService: IMineMeldRunningConfigStatusService;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $stateParams: angular.ui.IStateParamsService;

    mmStatusListener: () => void;
    mmRunningConfigListener: () => void;
    mmThrottledUpdate: IThrottled;

    nodename: string;

    nodes: { status: IMinemeldStatusNode, nodeType: string }[];

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        MineMeldRunningConfigStatusService: IMineMeldRunningConfigStatusService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService,
        $rootScope: angular.IRootScopeService,
        ThrottleService: IThrottleService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.MineMeldRunningConfigStatusService = MineMeldRunningConfigStatusService;
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
        this.mmRunningConfigListener = $rootScope.$on(
            'mm-running-config-changed',
            this.mmThrottledUpdate
        );

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    private updateMinemeldStatus() {
        var k: number;
        var i: any;
        var nodes: { status: IMinemeldStatusNode, nodeType: string }[] = [];
        var members: string[] = [];
        var tobeadded: string[] = [this.nodename];
        var clength: number;
        var rcnode: IMinemeldResolvedConfigNode;
        var nodeType: string;

        this.MineMeldRunningConfigStatusService.getStatus().then((rconfig: IMineMeldRunningConfigStatus) => {
            this.mmstatus.getStatus().then((currentStatus: IMinemeldStatus) => {
                do {
                    clength = members.length;

                    angular.forEach(currentStatus, (cnode: IMinemeldStatusNode, nname: string) => {
                        rcnode = rconfig.nodes[nname];

                        nodeType = 'unknown';
                        if (typeof rcnode !== 'undefined') {
                            if (rcnode.resolvedPrototype && rcnode.resolvedPrototype.node_type) {
                                nodeType = rcnode.resolvedPrototype.node_type;
                            }
                        }

                        if (members.indexOf(nname) > -1) {
                            return;
                        }

                        k = tobeadded.indexOf(nname);
                        if (k > -1) {
                            nodes.push({ status: cnode, nodeType: nodeType });
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
            });
        });
    }

    private destroy() {
        if (this.mmThrottledUpdate) {
            this.mmThrottledUpdate.cancel();
        }
        if (this.mmStatusListener) {
            this.mmStatusListener();
        }
        if (this.mmRunningConfigListener) {
            this.mmRunningConfigListener();
        }
    }
}
