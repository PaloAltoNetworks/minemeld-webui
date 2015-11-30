/** @ngInject */
export function routerConfig($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider) {
  $stateProvider
    .state('login', {
      url:'/login',
      templateUrl: 'app/login/view.html',
      controller: 'LoginController',
      controllerAs: 'login'
    })
    .state('system', {
      url: '/system',
      templateUrl: 'app/dashboard/system.view.html',
      controller: 'SystemController',
      controllerAs: 'vm'
    })
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
    .state('prototypedetail', {
      url: '/prototypes/:libraryName/:prototypeName',
      templateUrl: 'app/prototypedetail/view.html',
      controller: 'PrototypedetailController',
      controllerAs: 'vm'
    })
    .state('config', {
      url: '/config',
      templateUrl: 'app/config/view.html',
      controller: 'ConfigController',
      controllerAs: 'vm'
    })
    .state('configadd', {
      url: '/config/add',
      templateUrl: 'app/config/configadd.view.html',
      controller: 'ConfigAddController',
      controllerAs: 'vm'
    })
    ;

  $urlRouterProvider.otherwise('/dashboard');
}
