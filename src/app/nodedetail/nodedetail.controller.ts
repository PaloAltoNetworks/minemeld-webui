/** @ngInject */
export class NodeDetailController {
    nodename: string;

    constructor($stateParams: angular.ui.IStateParamsService) {
        this.nodename = $stateParams['nodename'];
    }
}
