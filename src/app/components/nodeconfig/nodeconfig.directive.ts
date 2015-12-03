/** @ngInject */
export function nodeConfig(): ng.IDirective {
    return {
        restrict: 'E',
        templateUrl: 'app/components/nodeconfig/nodeconfig.html',
        scope: {
            config: '='
        },
        controller: NodeConfigController,
        controllerAs: 'vm',
        bindToController: true
    };
}

/** @ngInject */
export class NodeConfigController {
    config: any;

    constructor() {
        ;
    }

    typeOf(o: any) {
        if (Array.isArray(o)) {
            return 'list';
        }

        if (o === null) {
            return 'null';
        }

        return typeof (o);
    }
}
