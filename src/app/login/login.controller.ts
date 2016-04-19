import { IMinemeldAuth } from  '../../app/services/auth';

/** @ngInject */
export class LoginController {
    username: string;
    password: string;

    checking: boolean = false;

    $resource: angular.resource.IResourceService;
    toastr: any;
    $state: angular.ui.IStateService;
    MinemeldAuth: IMinemeldAuth;
    $cookies: angular.cookies.ICookiesService;

    constructor($state: angular.ui.IStateService,
                MinemeldAuth: IMinemeldAuth,
                toastr: any, $resource: angular.resource.IResourceService,
                $cookies: angular.cookies.ICookiesService) {
        this.$resource = $resource;
        this.toastr = toastr;
        this.$state = $state;
        this.MinemeldAuth = MinemeldAuth;
        this.$cookies = $cookies;
    }

    public submit() {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;

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
                this.$cookies.put('mmar', btoa(this.username + ':' + this.password));
                this.MinemeldAuth.setAuthorization(this.username, this.password);
                this.checking = false;
                this.$state.go('dashboard');
            }, (error: any) => {
                this.checking = false;
                this.toastr.error('ERROR CHECKING CREDENTIALS: ' + error.statusText);
            });
    }
}
