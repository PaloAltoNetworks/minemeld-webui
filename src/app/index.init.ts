import { IMineMeldAPIService } from './services/minemeldapi';
import { IMinemeldStatusService } from './services/status';
import { IMineMeldWebUIExtensionsLoaderService } from './services/webuiextensionsloader';

/** @ngInject */
export function minemeldInit($state: angular.ui.IStateService,
                             $rootScope: any,
                             $cookies: angular.cookies.ICookiesService,
                             MineMeldAPIService: IMineMeldAPIService,
                             MinemeldStatusService: IMinemeldStatusService,
                             MineMeldWebUIExtensionsLoaderService: IMineMeldWebUIExtensionsLoaderService) {
    document.getElementById('loader').style.display = 'none';

    $rootScope.mmBack = (state?: string) => {
        if (($rootScope.mmPreviousState) && (!$rootScope.mmPreviousState.state.abstract)) {
            $state.go($rootScope.mmPreviousState.state, $rootScope.mmPreviousState.params);
            return;
        }

        $state.go(state);
        return;
    };

    $rootScope.$on('$stateChangeStart', (event: any, toState: any, toParams: any) => {
        if (toState.name !== 'login' && !MineMeldAPIService.isLoggedIn()) {
            event.preventDefault();
            $state.go('login');
        }
    });

    $rootScope.$on('$stateChangeSuccess', (event: any, toState: any, toParams: any, fromState: any, fromParams: any) => {
        $rootScope.mmPreviousState = {
            state: fromState,
            params: fromParams
        };

        MineMeldAPIService.cancelAPICalls();
    });
}
