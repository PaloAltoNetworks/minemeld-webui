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
      templateUrl: 'app/nodedetail/view.stats.html',
      controller: 'NodeDetailStatsController',
      controllerAs: 'nodedetailstats'
    })
    .state('nodedetail.info', {
      templateUrl: 'app/nodedetail/view.info.html',
      controller: 'NodeDetailInfoController',
      controllerAs: 'nodedetailinfo'
    })
    .state('nodedetail.graph', {
      templateUrl: 'app/nodedetail/view.graph.html',
      controller: 'NodeDetailGraphController',
      controllerAs: 'vm'
    })
    ;

  $urlRouterProvider.otherwise('/dashboard');
}
