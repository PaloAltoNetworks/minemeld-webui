/// <reference path="../../.tmp/typings/tsd.d.ts" />

import { config } from './index.config';
import { routerConfig } from './index.route';
import { DashboardController } from './dashboard/dashboard.controller';
import { NodesController } from './nodes/nodes.controller';
import { NodeDetailController } from './nodedetail/nodedetail.controller';
import { NodeDetailsStatsController } from './nodedetail/nodedetail.stats.controller';
import { appNavbar } from '../app/components/navbar/navbar.directive';
import { MinemeldStatus } from './services/status';
import { MinemeldMetrics } from './services/metrics';
import { megaNumber } from './filters/megaNumber';
import { minemeldOptions } from '../app/components/options/options.directive';

declare var malarkey: any;
declare var moment: moment.MomentStatic;

module minemeldWebui {
  'use strict';

  angular.module('minemeldWebui', [
    'ngAnimate',
    'ngCookies',
    'ngSanitize',
    'ngMessages',
    'ngAria',
    'ngResource',
    'ui.router',
    'ui.bootstrap',
    'toastr',
    'angular-loading-bar',
    'datatables',
    'datatables.bootstrap',
    'easypiechart',
    'nvd3'
  ])
  .constant('moment', moment)
  .config(config)
  .config(routerConfig)
  .directive('minemeldOptions', minemeldOptions)
  .controller('DashboardController', DashboardController)
  .controller('NodesController', NodesController)
  .controller('NodeDetailController', NodeDetailController)
  .controller('NodeDetailsStatsController', NodeDetailsStatsController)
  .directive('appNavbar', appNavbar)
  .service('MinemeldStatus', MinemeldStatus)
  .service('MinemeldMetrics', MinemeldMetrics)
  .filter('megaNumber', megaNumber)
  ;
}
