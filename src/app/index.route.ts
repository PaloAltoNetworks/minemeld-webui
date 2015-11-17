/** @ngInject */
export function routerConfig($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider) {
  $stateProvider
    .state('dashboard', {
      url: '/dashboard',
      templateUrl: 'app/dashboard/view.html',
      controller: 'DashboardController',
      controllerAs: 'dashboard'
    })
    .state('nodes', {
        url: '/nodes',
        templateUrl: 'app/nodes/view.html',
        controller: 'NodesController',
        controllerAs: 'nodes'
    })
    ;

  $urlRouterProvider.otherwise('/dashboard');
}
