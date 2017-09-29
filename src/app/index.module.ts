/// <reference path="../../typings/main.d.ts" />

import { config } from './index.config';
import { routerConfig } from './index.route';
import { minemeldInit } from './index.init';
import { DashboardController } from './dashboard/dashboard.controller';
import { SystemController } from './system/system.controller';
import { SystemDashboardController } from './system/system.controller';
import { SystemExtensionsController } from './system/extensions.controller';
import { NodesController } from './nodes/nodes.controller';
import { NodeDetailController } from './nodedetail/nodedetail.controller';
import { NodeDetailStatsController } from './nodedetail/nodedetail.stats.controller';
import { NodeDetailInfoController } from './nodedetail/nodedetail.info.controller';
import { NodeDetailGraphController } from './nodedetail/nodedetail.graph.controller';
import { PrototypesController } from './prototypes/prototypes.controller';
import { PrototypedetailController } from './prototypedetail/prototypedetail.controller';
import { PrototypeAddController } from './prototypeadd/prototypeadd.controller';
import { ConfigController } from './config/config.controller';
import { ConfigureImportController } from './config/configimport.controller';
import { ConfigureExportController } from './config/configexport.controller';
import { ConfigAddController } from './config/configadd.controller';
import { AboutController } from './about/about.controller';
import { AdminController } from './admin/admin.controller';
import { AdminUsersController } from './admin/admin.users.controller';
import { AdminFUsersController } from './admin/admin.fusers.controller';
import { IndicatorAddController } from './indicatoradd/indicatoradd.controller';
import { LogsController } from './logs/logs.controller';
import { LoginController } from './login/login.controller';
import { MineMeldAPIService } from './services/minemeldapi';
import { MinemeldStatusService } from './services/status';
import { MinemeldMetricsService } from './services/metrics';
import { MinemeldPrototypeService } from './services/prototype';
import { MinemeldConfigService } from './services/config';
import { MinemeldValidateService } from './services/validate';
import { NodeDetailResolver } from './services/nodedetailresolver';
import { MinemeldSupervisorService } from './services/supervisor';
import { MineMeldExtensionsService } from './services/extensions';
import { ConfirmService } from './services/confirm';
import { MinemeldEventsService } from './services/events';
import { MinemeldTracedService } from './services/traced';
import { ThrottleService } from './services/throttle';
import { MinemeldAAAService } from './services/aaa';
import { MineMeldEngineStatusService } from './services/enginestatus';
import { MineMeldRunningConfigStatusService } from './services/runningconfigstatus';
import { MineMeldJobsService } from './services/jobs';
import { MineMeldCurrentUserService } from './services/currentuser';
import { MineMeldWebUIExtensionsLoaderService } from './services/webuiextensionsloader';
import { megaNumber } from './filters/megaNumber';
import { appNavbar } from '../app/components/navbar/navbar.directive';
import { minemeldOptions } from '../app/components/options/options.directive';
import { nodeConfig } from '../app/components/nodeconfig/nodeconfig.directive';
import { prototypeTooltip } from'../app/components/prototypetooltip/prototypetooltip.directive';
import { suggestion } from '../app/components/suggestion/suggestion.directive';

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
    'ui.ace',
    'toastr',
    'angular-loading-bar',
    'datatables',
    'datatables.bootstrap',
    'easypiechart',
    'nvd3',
    'mmSankey',
    'ui.select',
    'angularFileUpload',
    'oc.lazyLoad'
  ])
  .constant('moment', moment)
  .config(config)
  .config(routerConfig)
  .controller('DashboardController', DashboardController)
  .controller('SystemController', SystemController)
  .controller('SystemDashboardController', SystemDashboardController)
  .controller('SystemExtensionsController', SystemExtensionsController)
  .controller('NodesController', NodesController)
  .controller('NodeDetailController', NodeDetailController)
  .controller('NodeDetailStatsController', NodeDetailStatsController)
  .controller('NodeDetailInfoController', NodeDetailInfoController)
  .controller('NodeDetailGraphController', NodeDetailGraphController)
  .controller('LoginController', LoginController)
  .controller('PrototypesController', PrototypesController)
  .controller('PrototypedetailController', PrototypedetailController)
  .controller('PrototypeAddController', PrototypeAddController)
  .controller('ConfigController', ConfigController)
  .controller('ConfigureImportController', ConfigureImportController)
  .controller('ConfigureExportController', ConfigureExportController)
  .controller('ConfigAddController', ConfigAddController)
  .controller('IndicatorAddController', IndicatorAddController)
  .controller('AboutController', AboutController)
  .controller('LogsController', LogsController)
  .controller('AdminController', AdminController)
  .controller('AdminUsersController', AdminUsersController)
  .controller('AdminFUsersController', AdminFUsersController)
  .directive('minemeldOptions', minemeldOptions)
  .directive('nodeConfig', nodeConfig)
  .directive('appNavbar', appNavbar)
  .directive('prototypeTooltip', prototypeTooltip)
  .directive('suggestion', suggestion)
  .service('MineMeldAPIService', MineMeldAPIService)
  .service('MinemeldStatusService', MinemeldStatusService)
  .service('MinemeldMetricsService', MinemeldMetricsService)
  .service('NodeDetailResolver', NodeDetailResolver)
  .service('MinemeldPrototypeService', MinemeldPrototypeService)
  .service('MinemeldConfigService', MinemeldConfigService)
  .service('ConfirmService', ConfirmService)
  .service('MinemeldSupervisorService', MinemeldSupervisorService)
  .service('MinemeldValidateService', MinemeldValidateService)
  .service('MinemeldEventsService', MinemeldEventsService)
  .service('MinemeldTracedService', MinemeldTracedService)
  .service('MinemeldAAAService', MinemeldAAAService)
  .service('ThrottleService', ThrottleService)
  .service('MineMeldEngineStatusService', MineMeldEngineStatusService)
  .service('MineMeldRunningConfigStatusService', MineMeldRunningConfigStatusService)
  .service('MineMeldExtensionsService', MineMeldExtensionsService)
  .service('MineMeldJobsService', MineMeldJobsService)
  .service('MineMeldCurrentUserService', MineMeldCurrentUserService)
  .service('MineMeldWebUIExtensionsLoaderService', MineMeldWebUIExtensionsLoaderService)
  .filter('megaNumber', megaNumber)
  .run(minemeldInit)
  ;
}
