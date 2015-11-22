import { IMinemeldStatus } from  '../../app/services/status';
import { IMinemeldMetrics } from  '../../app/services/metrics';

/** @ngInject */
export class LoginController {
    username: string;
    password: string;

    checking: boolean = false;

    $resource: angular.resource.IResourceService;
    toastr: any;
    $state: angular.ui.IStateService;
    MinemeldStatus: IMinemeldStatus;
    MinemeldMetrics: IMinemeldMetrics;

    constructor($state: angular.ui.IStateService,
                MinemeldStatus: IMinemeldStatus, MinemeldMetrics: IMinemeldMetrics,
                toastr: any, $resource: angular.resource.IResourceService) {
        this.$resource = $resource;
        this.toastr = toastr;
        this.$state = $state;
        this.MinemeldStatus = MinemeldStatus;
        this.MinemeldMetrics = MinemeldMetrics;
    }

    public submit() {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;;

        this.checking = true;
        r = this.$resource('/status/minemeld', {}, {
            get: {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + window.btoa(this.username + ':' + this.password)
                }
            }
        });
        r.get().$promise
            .then((result: any) => {
                this.MinemeldStatus.setAuthorization(this.username, this.password);
                this.MinemeldMetrics.setAuthorization(this.username, this.password);
                this.checking = false;
                this.$state.go('dashboard');
            }, (error: any) => {
                this.checking = false;
                this.toastr.error("ERROR CHECKING CREDENTIALS: " + error.statusText);
            });
    }
}
