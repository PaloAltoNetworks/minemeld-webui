/** @ngInject */
export function minemeldOptions(): ng.IDirective {
    return {
        restrict: 'E',
        templateUrl: 'app/components/options/options.html',
        bindToController: true,
        transclude: true,
        link: function(scope: any, element: JQuery, attr: ng.IAttributes) {
            var divCtr: JQuery = element.children('.minemeld-options').children('div');

            element.find('.minemeld-options-knob').bind('click', function() {
                divCtr.toggleClass('minemeld-options-show');
            });
        }
    };
}
