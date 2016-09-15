import { IMinemeldPrototypeService, IMinemeldPrototypeLibrary } from '../../services/prototype';

/** @ngInject */
export function prototypeTooltip(): ng.IDirective {
    return {
        restrict: 'E',
        templateUrl: 'app/components/prototypetooltip/prototypetooltip.html',
        scope: {
            name: '='
        },
        controller: PrototypeTooltipController,
        controllerAs: 'vm',
        bindToController: true
    };
}

/** @ngInject */
export class PrototypeTooltipController {
    name: string;

    prototypeName: string;
    libraryName: string;
    prototypeDescription: string;
    libraryDescription: string;

    constructor(MinemeldPrototypeService: IMinemeldPrototypeService) {
        var toks: string[];

        toks = this.name.split('.');

        this.prototypeName = toks[1];
        this.libraryName = toks[0];

        MinemeldPrototypeService.getPrototypeLibrary(toks[0])
        .then((result: IMinemeldPrototypeLibrary) => {
            this.libraryDescription = result.description;

            this.prototypeDescription = result.prototypes[toks[1]].description;
        });
    }
}
