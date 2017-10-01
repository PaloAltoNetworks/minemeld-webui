/// <reference path="../../../../typings/main.d.ts" />

import { IMineMeldAPIService } from '../../services/minemeldapi';
import { MinemeldStatusService } from '../../services/status';

/** @ngInject */
export function suggestion(): ng.IDirective {
    return {
        restrict: 'E',
        scope: {
            creationDate: '='
        },
        templateUrl: 'app/components/suggestion/suggestion.html',
        controller: SuggestionController,
        controllerAs: 'vm',
        bindToController: true
    };
}

/** @ngInject */
class SuggestionController {
    MineMeldAPIService: IMineMeldAPIService;
    MineMeldStatusService: MinemeldStatusService;

    minimized: boolean = true;
    disabled: boolean = false;
    snsAvailable: boolean = false;

    constructor(MineMeldAPIService: IMineMeldAPIService,
        MinemeldStatusService: MinemeldStatusService,
        private toastr: any,
        private $modal: angular.ui.bootstrap.IModalService) {
        this.MineMeldAPIService = MineMeldAPIService;
        this.MineMeldStatusService = MinemeldStatusService;

        this.MineMeldAPIService.onLogin(this.checkSNS.bind(this));
        this.MineMeldAPIService.onLogout(this.destroySNS.bind(this));
        if (this.MineMeldAPIService.isLoggedIn()) {
            this.checkSNS();
        }
    }

    showModal(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        this.minimized = false;

        mi = this.$modal.open({
            templateUrl: 'app/components/suggestion/suggestion.modal.html',
            controller: SuggestionModalController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then(
            result => {
                this.MineMeldStatusService.mkwish(result.email, result.suggestion).then(
                    success => {
                        this.toastr.success('SUGGESTION SENT. THANKS !!');
                    },
                    error => {
                        this.toastr.error('ERROR SENDING YOUR SUGGESTION' + error.statusText);
                    }
                );
            }
        ).finally(() => {
            this.minimized = true;
        });
    }

    private checkSNS(): void {
        this.MineMeldStatusService.getInfo().then(
            result => {
                if (result.sns) {
                    this.snsAvailable = true;
                }
            }
        );
    }

    private destroySNS(): void {
        this.snsAvailable = false;
    }
}

/** @ngInject */
class SuggestionModalController {
    email: string = null;
    suggestion: string = null;

    constructor(private $modalInstance: angular.ui.bootstrap.IModalServiceInstance) { }

    valid(): boolean {
        return (this.email && this.email.length !== 0) && (this.suggestion && this.suggestion.length !== 0);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }

    submit() {
        this.$modalInstance.close({
            email: this.email,
            suggestion: this.suggestion
        });
    }
}
