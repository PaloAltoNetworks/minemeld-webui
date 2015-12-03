/** @ngInject */
export function config($logProvider: ng.ILogProvider, toastrConfig: any, cfpLoadingBarProvider: any) {
  // enable log
  $logProvider.debugEnabled(true);

  // set options third-party lib
  toastrConfig.allowHtml = true;
  toastrConfig.timeOut = 3000;
  toastrConfig.positionClass = 'toast-top-right';
  toastrConfig.preventDuplicates = false;
  toastrConfig.progressBar = true;

  // set options for loading-bar
  cfpLoadingBarProvider.includeSpinner = false;
}
