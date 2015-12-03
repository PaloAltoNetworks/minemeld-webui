import { IMinemeldAuth }  from './services/auth';

/** @ngInject */
export function minemeldInit(MinemeldAuth: IMinemeldAuth, $state: angular.ui.IStateService) {
  document.getElementById('loader').style.display = 'none';

  if (!MinemeldAuth.authorizationSet) {
    $state.go('login');
    return;
  }
}
