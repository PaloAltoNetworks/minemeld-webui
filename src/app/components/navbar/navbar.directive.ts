/// <reference path="../../../../typings/main.d.ts" />

import { IMineMeldAPIService } from '../../services/minemeldapi';
import { IMineMeldEngineStatusService, IMineMeldEngineStatus } from '../../services/enginestatus';
import { IMineMeldCurrentUserService } from '../../services/currentuser';

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
  MineMeldEngineStatusService: IMineMeldEngineStatusService;
  MineMeldCurrentUserService: IMineMeldCurrentUserService;
  $state: angular.ui.IStateService;
  $timeout: angular.ITimeoutService;
  $rootScope: angular.IRootScopeService;
  toastr: any;

  read_write: boolean = false;

  engineStatusChangeSubscription: () => void;
  lastToast: any;

  engineStatename: string;
  engineStateIcon: string;

  ICON_MAP: any = {
    'RUNNING': 'running',
    'STARTING': 'starting',
    'STOPPING': 'stopping'
  };

  constructor(MineMeldAPIService: IMineMeldAPIService,
              MineMeldEngineStatusService: IMineMeldEngineStatusService,
              MineMeldCurrentUserService: IMineMeldCurrentUserService,
              $timeout: angular.ITimeoutService,
              $rootScope: angular.IRootScopeService,
              toastr: any,
              $state: angular.ui.IStateService) {
    this.MineMeldAPIService = MineMeldAPIService;
    this.MineMeldEngineStatusService = MineMeldEngineStatusService;
    this.MineMeldCurrentUserService = MineMeldCurrentUserService;
    this.$rootScope = $rootScope;
    this.$state = $state;
    this.$timeout = $timeout;
    this.toastr = toastr;

    this.MineMeldAPIService.onLogin(this.initReadWrite.bind(this));
    this.MineMeldAPIService.onLogout(this.destroyReadWrite.bind(this));
    if (this.MineMeldAPIService.isLoggedIn()) {
        this.initReadWrite();
    }

    this.updateEngineStatus();
  }

  logout() {
    this.MineMeldAPIService.logOut().finally(() => {
      this.$state.go('login');
    });
  }

  private updateEngineStatus() {
    this.MineMeldEngineStatusService.getStatus().then((result: IMineMeldEngineStatus) => {
      if (result.statename != this.engineStatename) {
        this.$timeout(() => {
          var firstStatus, newStatus: boolean;

          firstStatus = (typeof this.engineStatename === 'undefined');
          newStatus = (this.engineStatename != result.statename);

          this.engineStatename = result.statename;

          this.updateEngineStateIcon();

          if ((firstStatus && (this.engineStatename !== 'RUNNING')) || (!firstStatus && newStatus)) {
            this.showNotification();
          }
        });
      }

      if (!this.engineStatusChangeSubscription) {
        this.engineStatusChangeSubscription = this.$rootScope.$on(
          'mm-engine-status-changed',
          this.updateEngineStatus.bind(this)
        );
      }
    });
  }

  private updateEngineStateIcon(): void {
    // we do this here because I can't find a good way to express
    // this logic inside the template
    if (this.ICON_MAP.hasOwnProperty(this.engineStatename)) {
      this.engineStateIcon = this.ICON_MAP[this.engineStatename];
      return;
    }

    this.engineStateIcon = 'stopped';
  }

  private showNotification(): void {
    if (this.lastToast) {
      (<JQuery>this.lastToast.el).hide();
      this.lastToast.scope.close(true);
      this.lastToast = undefined;
    }

    if (this.engineStatename === 'RUNNING' || this.engineStatename === 'STARTING') {
      this.lastToast = this.toastr.success('ENGINE STATUS: ' + this.engineStatename);
      return;
    }
    if (this.engineStatename === 'STOPPING') {
      this.lastToast = this.toastr.warning('ENGINE STATUS: ' + this.engineStatename);
      return;
    }
    this.lastToast = this.toastr.error('ENGINE STATUS: ' + this.engineStatename);
  }

  private initReadWrite() {
    this.MineMeldCurrentUserService.getReadWrite().then((result: boolean) => {
      this.read_write = result;
    });
  }

  private destroyReadWrite() {
    this.read_write = false;
  }
}
