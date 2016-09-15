import { IMinemeldStatusService } from  '../../app/services/status';
import { INodeDetailResolverService, INodeDetailTab, INodeDetailClass } from '../../app/services/nodedetailresolver';

/** @ngInject */
export class NodeDetailController {
    $state: angular.ui.IStateService;
    toastr: any;

    nodename: string;

    tabs: INodeDetailTab[];

    constructor($stateParams: angular.ui.IStateParamsService,
                $state: angular.ui.IStateService,
                MinemeldStatusService: IMinemeldStatusService,
                toastr: any, NodeDetailResolver: INodeDetailResolverService) {
        this.nodename = $stateParams['nodename'];
        this.$state = $state;
        this.toastr = toastr;

        NodeDetailResolver.resolveNode(this.nodename)
        .then((details: INodeDetailClass) => {
            var atabs: any[];

            this.tabs = angular.copy(details.tabs);
            atabs = this.tabs.filter((x: any) => { return x.state === $state.current.name; });

            if (atabs.length === 0) {
                this.tabs[0].active = true;
                $state.go(this.tabs[0].state, { nodename: this.nodename });
            } else {
                atabs[0].active = true;
            }
        }, (error: any) => {
            this.toastr.error('ERROR RESOLVING NODE ' + this.nodename + ': ' + error.status);
        });
    }

    public select(state: string) {
        this.$state.go(state, { nodename: this.nodename });
    }
}
