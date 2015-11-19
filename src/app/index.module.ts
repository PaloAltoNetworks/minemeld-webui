/// <reference path="../../.tmp/typings/tsd.d.ts" />

import { config } from './index.config';
import { routerConfig } from './index.route';
import { DashboardController } from './dashboard/dashboard.controller';
import { NodesController } from './nodes/nodes.controller';
import { NodeDetailController } from './nodedetail/nodedetail.controller';
import { NodeDetailStatsController } from './nodedetail/nodedetail.stats.controller';
import { NodeDetailInfoController } from './nodedetail/nodedetail.info.controller';
import { NodeDetailGraphController } from './nodedetail/nodedetail.graph.controller';
import { appNavbar } from '../app/components/navbar/navbar.directive';
import { MinemeldStatus } from './services/status';
import { MinemeldMetrics } from './services/metrics';
import { NodeDetailResolver } from './services/nodedetailresolver';
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
    'nvd3',
    'mmSankey'
  ])
  .constant('moment', moment)
  .config(config)
  .config(routerConfig)
  .directive('minemeldOptions', minemeldOptions)
  .controller('DashboardController', DashboardController)
  .controller('NodesController', NodesController)
  .controller('NodeDetailController', NodeDetailController)
  .controller('NodeDetailStatsController', NodeDetailStatsController)
  .controller('NodeDetailInfoController', NodeDetailInfoController)
  .controller('NodeDetailGraphController', NodeDetailGraphController)
  .directive('appNavbar', appNavbar)
  .service('MinemeldStatus', MinemeldStatus)
  .service('MinemeldMetrics', MinemeldMetrics)
  .service('NodeDetailResolver', NodeDetailResolver)
  .filter('megaNumber', megaNumber)
  ;
}
