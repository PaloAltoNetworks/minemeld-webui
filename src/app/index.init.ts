import { IMineMeldAPIService } from './services/minemeldapi';

/** @ngInject */
export function minemeldInit($state: angular.ui.IStateService,
                             $rootScope: any,
                             $cookies: angular.cookies.ICookiesService,
                             MineMeldAPIService: IMineMeldAPIService) {
    document.getElementById('loader').style.display = 'none';

    $rootScope.mmBack = (state?: string) => {
        if (($rootScope.mmPreviousState) && (!$rootScope.mmPreviousState.state.abstract)) {
            $state.go($rootScope.mmPreviousState.state, $rootScope.mmPreviousState.params);
            return;
        }

        $state.go(state);
        return;
    };

    $rootScope.$on('$stateChangeSuccess', (event: any, toState: any, toParams: any, fromState: any, fromParams: any) => {
        $rootScope.mmPreviousState = {
            state: fromState,
            params: fromParams
        };

        MineMeldAPIService.cancelAPICalls();
    });
}
