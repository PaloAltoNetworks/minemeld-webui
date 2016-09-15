/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService } from  '../../app/services/status';
import { IMinemeldConfigService } from '../../app/services/config';

export class IndicatorAddController {
    toastr: any;
    $scope: angular.IScope;
    MinemeldStatusService: IMinemeldStatusService;
    MinemeldConfigService: IMinemeldConfigService;
    $rootScope: any;
    $state: angular.ui.IStateService;

    indicator: string;
    $type: string;
    share_level: string;
    comment: string;
    nodes: string[];

    availableTypes: string[] = [
        'IPv4',
        'IPv6',
        'URL',
        'domain'
    ];

    availableNodes: any = {
        IPv4: [],
        domain: [],
        URL: [],
        IPv6: []
    };
    currAvailableNodes: string[];

    /* @ngInject */
    constructor($stateParams: angular.ui.IStateParamsService,
                $scope: angular.IScope, toastr: any,
                MinemeldStatusService: IMinemeldStatusService,
                $rootScope: angular.IRootScopeService,
                MinemeldConfigService: IMinemeldConfigService,
                $state: angular.ui.IStateService) {
        this.toastr = toastr;
        this.$scope = $scope;
        this.MinemeldStatusService = MinemeldStatusService;
        this.MinemeldConfigService = MinemeldConfigService;
        this.$rootScope = $rootScope;
        this.$state = $state;

        this.indicator = $stateParams['indicator'];
        this.$type = $stateParams['indicatorType'];

        this.MinemeldStatusService.getConfig().then((response: any) => {
            var nodes: any[] = response.nodes;
            var tnodes: string[] = [];

            angular.forEach(nodes, (node: any, nodeName: string) => {
                var pname: any;

                if (node.prototype === undefined) {
                    return;
                }

                pname = node.prototype.split('.')[1];

                if (pname.startsWith('listIPv4')) {
                    tnodes.push(nodeName);
                    this.availableNodes.IPv4.push(nodeName);
                    return;
                }
                if (pname.startsWith('listIPv6')) {
                    tnodes.push(nodeName);
                    this.availableNodes.IPv6.push(nodeName);
                    return;
                }
                if (pname.startsWith('listURL')) {
                    tnodes.push(nodeName);
                    this.availableNodes.URL.push(nodeName);
                    return;
                }
                if (pname.startsWith('listDomain')) {
                    tnodes.push(nodeName);
                    this.availableNodes.domain.push(nodeName);
                    return;
                }
            });

            if (this.$type) {
                this.currAvailableNodes = this.availableNodes[this.$type];
            } else {
                this.currAvailableNodes = tnodes;
            }
        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING MINEMELD RUNNING CONFIG: ' + error.statusText);
        });
    }

    typeSelected(item: number, model: any) {
        var newnodes: string[];

        this.currAvailableNodes = this.availableNodes[item];

        if (!this.nodes) {
            return;
        }

        newnodes = this.nodes.filter((node: string) => {
            return (this.currAvailableNodes.indexOf(node) > -1);
        });

        this.nodes = newnodes;
    }

    save() {
        var rindicator: any = {
            indicator: this.indicator,
            type: this.$type
        };

        if (this.share_level) {
            rindicator.share_level = this.share_level;
        }

        if (this.comment) {
            rindicator.comment = this.comment;
        }

        angular.forEach(this.nodes, (node: string) => {
            var cfd_name = node + '_indicators';

            this.MinemeldConfigService.appendDataFile(cfd_name, rindicator, node)
                .then((result: any) => {
                    this.toastr.success('INDICATOR ADDED TO ' + node);
                }, (error: any) => {
                    this.toastr.error('ERROR APPENDING INDICATOR TO NODE ' + node + ': ' + error.statusText);
                });
        });

        this.$state.go('nodes');
    }

    back() {
        this.$rootScope.mmBack('nodes');
    }

    valid(): boolean {
        if (!this.indicator) {
            return false;
        }

        if (!this.validateIndicator()) {
            angular.element('#fgIndicator').addClass('has-error');
            return false;
        }
        angular.element('#fgIndicator').removeClass('has-error');

        if (!this.$type) {
            return false;
        }

        if (!this.nodes || this.nodes.length === 0) {
            return false;
        }

        return true;
    }

    private validateIPv4(addr: string): number {
        var toks: string[];
        var j: number;
        var tn: number;
        var result: number;

        toks = addr.split('.');
        if (toks.length !== 4) {
            return -1;
        }

        result = 0;
        for (j = toks.length - 1; j >= 0; j--) {
            tn = parseInt(toks[j], 10);
            if (isNaN(tn)) {
                return -1;
            }
            if ((tn < 0) || (tn > 255)) {
                return -1;
            }

            result += tn * (1 << 8 * j);
        }

        return result;
    }

    private validateIndicator(): boolean {
        var addresses: string[];
        var toks: string[];
        var nmbits: number;
        var t0, t1: number;

        if (!this.$type || this.$type !== 'IPv4') {
            return true;
        }

        addresses = this.indicator.split('-');
        if (addresses.length > 2) {
            return false;
        }

        if (addresses.length === 2) {
            t0 = this.validateIPv4(addresses[0]);
            if (t0 < 0) {
                return false;
            }

            t1 = this.validateIPv4(addresses[1]);
            if (t1 < 0) {
                return false;
            }

            return (t0 <= t1);
        }

        toks = addresses[0].split('/');
        if (toks.length > 2) {
            return false;
        }

        if (toks.length === 2) {
            nmbits = parseInt(toks[1], 10);
            if (isNaN(nmbits)) {
                return false;
            }
            if ((nmbits < 0) || (nmbits > 32)) {
                return false;
            }
        }

        return (this.validateIPv4(toks[0]) > 0);
    }
}
