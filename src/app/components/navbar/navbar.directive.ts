import { IMinemeldAuth } from '../../services/auth';

/** @ngInject */
export function appNavbar(): ng.IDirective {

  return {
    restrict: 'E',
    scope: {
      creationDate: '='
    },
    templateUrl: 'app/components/navbar/navbar.html',
    controller: NavbarController,
    controllerAs: 'vm',
    bindToController: true
  };

}

/** @ngInject */
export class NavbarController {
  MinemeldAuth: IMinemeldAuth;
  $state: angular.ui.IStateService;

  constructor(MinemeldAuth: IMinemeldAuth, $state: angular.ui.IStateService) {
    this.MinemeldAuth = MinemeldAuth;
    this.$state = $state;
  }

  logout() {
    this.MinemeldAuth.logOut();
    this.$state.go('login');
  }
}
