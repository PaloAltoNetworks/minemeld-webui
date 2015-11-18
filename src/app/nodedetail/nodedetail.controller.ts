/** @ngInject */
export class NodeDetailController {
    $state: angular.ui.IStateService;

    nodename: string;

    tabs: any[] = [
        {
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.info',
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
        }
    ];

    constructor($stateParams: angular.ui.IStateParamsService,
                $state: angular.ui.IStateService) {
        var atab: any;

        this.nodename = $stateParams['nodename'];
        this.$state = $state;

        atab = this.tabs.filter((x) => { return x.state === $state.current.name })[0];
        atab.active = true;
    }

    public select(state: string) {
        this.$state.go(state, { nodename: this.nodename });
    }
}
