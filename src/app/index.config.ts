/** @ngInject */
export function config($logProvider: ng.ILogProvider, $compileProvider: angular.ICompileProvider,
                       $ocLazyLoadProvider: any, toastrConfig: any, cfpLoadingBarProvider: any) {
  // https://code.angularjs.org/1.5.5/docs/guide/production
  $compileProvider.debugInfoEnabled(false);

  // enable log
  $logProvider.debugEnabled(true);

  $ocLazyLoadProvider.config({
    debug: true
  });

  // set options third-party lib
  toastrConfig.allowHtml = false;
  toastrConfig.timeOut = 3000;
  toastrConfig.positionClass = 'toast-top-right';
  toastrConfig.preventDuplicates = false;
  toastrConfig.progressBar = true;

  // set options for loading-bar
  cfpLoadingBarProvider.includeSpinner = false;
}
