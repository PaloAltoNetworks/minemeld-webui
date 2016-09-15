import { IMineMeldAPIService } from  '../../app/services/minemeldapi';

/** @ngInject */
export class LoginController {
    username: string;
    password: string;

    checking: boolean = false;

    toastr: any;
    $state: angular.ui.IStateService;
    MineMeldAPIService: IMineMeldAPIService;

    constructor($state: angular.ui.IStateService,
                MineMeldAPIService: IMineMeldAPIService,
                toastr: any) {
        this.toastr = toastr;
        this.$state = $state;
        this.MineMeldAPIService = MineMeldAPIService;
    }

    public submit() {
        this.checking = true;
        this.MineMeldAPIService.logIn(this.username, this.password)
            .then((result: any) => {
                this.checking = false;
                this.$state.go('dashboard');
            }, (error: any) => {
                this.checking = false;
                this.toastr.error('ERROR CHECKING CREDENTIALS: ' + error.statusText);
                this.password = '';
            });
    }
}
