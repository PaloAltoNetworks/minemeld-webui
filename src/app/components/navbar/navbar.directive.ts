/// <reference path="../../../../typings/main.d.ts" />

import { IMineMeldAPIService } from '../../services/minemeldapi';

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
  MineMeldAPIService: IMineMeldAPIService;
  $state: angular.ui.IStateService;
  $cookies: angular.cookies.ICookiesService;

  constructor(MineMeldAPIService: IMineMeldAPIService,
              $state: angular.ui.IStateService,
              $cookies: angular.cookies.ICookiesService) {
    this.MineMeldAPIService = MineMeldAPIService;
    this.$state = $state;
    this.$cookies = $cookies;
  }

  logout() {
    this.MineMeldAPIService.logOut().finally(() => {
      this.$cookies.remove('mm-session');
      this.$state.go('login');
    });
  }
}
