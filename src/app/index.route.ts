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
    .state('nodedetail', {
      url: '/nodes/:nodename',
      templateUrl: 'app/nodedetail/view.html',
      controller: 'NodeDetailController',
      controllerAs: 'nodedetail'
    })
    .state('nodedetail.stats', {
      url: '/stats',
      templateUrl: 'app/nodedetail/view.stats.html',
      controller: 'NodeDetailsStatsController',
      controllerAs: 'nodedetailstats'
    })
    ;

  $urlRouterProvider.otherwise('/dashboard');
}
