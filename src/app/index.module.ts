/// <reference path="../../typings/main.d.ts" />

import { config } from './index.config';
import { routerConfig } from './index.route';
import { minemeldInit } from './index.init';
import { DashboardController } from './dashboard/dashboard.controller';
import { SystemController } from './dashboard/system.controller';
import { NodesController } from './nodes/nodes.controller';
import { NodeDetailController } from './nodedetail/nodedetail.controller';
import { NodeDetailStatsController } from './nodedetail/nodedetail.stats.controller';
import { NodeDetailInfoController } from './nodedetail/nodedetail.info.controller';
import { NodeDetailGraphController } from './nodedetail/nodedetail.graph.controller';
import { PrototypesController } from './prototypes/prototypes.controller';
import { PrototypedetailController } from './prototypedetail/prototypedetail.controller';
import { PrototypeAddController } from './prototypeadd/prototypeadd.controller';
import { ConfigController } from './config/config.controller';
import { ConfigAddController } from './config/configadd.controller';
import { AboutController } from './about/about.controller';
import { IndicatorAddController } from './indicatoradd/indicatoradd.controller';
import { appNavbar } from '../app/components/navbar/navbar.directive';
import { LoginController } from './login/login.controller';
import { MinemeldStatus } from './services/status';
import { MinemeldMetrics } from './services/metrics';
import { MinemeldAuth } from './services/auth';
import { MinemeldPrototype } from './services/prototype';
import { MinemeldConfig } from './services/config';
import { MinemeldValidate } from './services/validate';
import { NodeDetailResolver } from './services/nodedetailresolver';
import { MinemeldSupervisor } from './services/supervisor';
import { ConfirmService } from './services/confirm';
import { megaNumber } from './filters/megaNumber';
import { minemeldOptions } from '../app/components/options/options.directive';
import { nodeConfig } from '../app/components/nodeconfig/nodeconfig.directive';
import { prototypeTooltip } from'../app/components/prototypetooltip/prototypetooltip.directive';

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
    'ui.ace',
    'toastr',
    'angular-loading-bar',
    'datatables',
    'datatables.bootstrap',
    'easypiechart',
    'nvd3',
    'mmSankey',
    'ui.select'
  ])
  .constant('moment', moment)
  .config(config)
  .config(routerConfig)
  .controller('DashboardController', DashboardController)
  .controller('SystemController', SystemController)
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
  .controller('ConfigAddController', ConfigAddController)
  .controller('IndicatorAddController', IndicatorAddController)
  .controller('AboutController', AboutController)
  .directive('minemeldOptions', minemeldOptions)
  .directive('nodeConfig', nodeConfig)
  .directive('appNavbar', appNavbar)
  .directive('prototypeTooltip', prototypeTooltip)
  .service('MinemeldStatus', MinemeldStatus)
  .service('MinemeldMetrics', MinemeldMetrics)
  .service('NodeDetailResolver', NodeDetailResolver)
  .service('MinemeldAuth', MinemeldAuth)
  .service('MinemeldPrototype', MinemeldPrototype)
  .service('MinemeldConfig', MinemeldConfig)
  .service('ConfirmService', ConfirmService)
  .service('MinemeldSupervisor', MinemeldSupervisor)
  .service('MinemeldValidate', MinemeldValidate)
  .filter('megaNumber', megaNumber)
  .run(minemeldInit)
  ;
}
