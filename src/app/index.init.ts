import { IMinemeldAuth }  from './services/auth';

/** @ngInject */
export function minemeldInit(MinemeldAuth: IMinemeldAuth, $state: angular.ui.IStateService,
                             $rootScope: any) {
    document.getElementById('loader').style.display = 'none';

    if (!MinemeldAuth.authorizationSet) {
        $state.go('login');
        return;
    }

    $rootScope.$on('$stateChangeSuccess', (event: any, toState: any, toParams: any, fromState: any, fromParams: any) => {
        $rootScope.mmPreviousState = {
            state: fromState,
            params: fromParams
        };

        $rootScope.mmBack = (state?: string) => {
            if (($rootScope.mmPreviousState) && (!$rootScope.mmPreviousState.state.abstract)) {
                $state.go($rootScope.mmPreviousState.state, $rootScope.mmPreviousState.params);
                return;
            }

            $state.go(state);
            return;
        };
    });
}
