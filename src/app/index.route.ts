/** @ngInject */
export function routerConfig($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider) {
  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'app/login/view.html',
      controller: 'LoginController',
      controllerAs: 'login'
    })
    .state('about', {
      url: '/about',
      templateUrl: 'app/about/view.html',
      controller: 'AboutController',
      controllerAs: 'vm'
    })
    .state('system', {
      url: '/system',
      templateUrl: 'app/system/view.html',
      controller: 'SystemController',
      controllerAs: 'vm',
      abstract: true
    })
    .state('system.dashboard', {
      url: '/dashboard',
      templateUrl: 'app/system/dashboard.view.html',
      controller: 'SystemDashboardController',
      controllerAs: 'vm'
    })
    .state('system.extensions', {
      url: '/extensions',
      templateUrl: 'app/system/extensions.view.html',
      controller: 'SystemExtensionsController',
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
    .state('prototypes', {
      url: '/prototypes',
      templateUrl: 'app/prototypes/view.html',
      controller: 'PrototypesController',
      controllerAs: 'vm'
    })
    .state('prototypedetail', {
      url: '/prototypes/:libraryName/:prototypeName',
      templateUrl: 'app/prototypedetail/view.html',
      controller: 'PrototypedetailController',
      controllerAs: 'vm'
    })
    .state('prototypeadd', {
      url: '/prototypeadd',
      templateUrl: 'app/prototypeadd/view.html',
      controller: 'PrototypeAddController',
      controllerAs: 'vm',
      params: {
        prototype: {
          value: 'none'
        }
      }
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
      controllerAs: 'vm',
      params: {
        prototype: {
          value: 'none'
        }
      }
    })
    .state('indicatoradd', {
      url: '/indicator/add?indicator&indicatorType',
      templateUrl: 'app/indicatoradd/view.html',
      controller: 'IndicatorAddController',
      controllerAs: 'vm'
    })
    .state('logs', {
      url: '/logs?q',
      templateUrl: 'app/logs/view.html',
      controller: 'LogsController',
      controllerAs: 'vm'
    })
    .state('admin', {
      abstract: true,
      url: '/admin',
      templateUrl: 'app/admin/view.html',
      controller: 'AdminController',
      controllerAs: 'vm'
    })
    .state('admin.users', {
      url: '/users',
      templateUrl: 'app/admin/view.users.html',
      controller: 'AdminUsersController',
      controllerAs: 'vm'
    })
    .state('admin.fusers', {
      url: '/fusers',
      templateUrl: 'app/admin/view.fusers.html',
      controller: 'AdminFUsersController',
      controllerAs: 'vm'
    })
    ;

  $urlRouterProvider.otherwise('/login');
}
