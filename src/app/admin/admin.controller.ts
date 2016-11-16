/// <reference path="../../../typings/main.d.ts" />

interface IAdminTab {
    tooltip: string;
    icon: string;
    active: boolean;
    state: string;
}

/** @ngInject */
export class AdminController {
    $state: angular.ui.IStateService;

    tabs: IAdminTab[] = [
        {
            tooltip: 'ADMINS',
            icon: 'fa fa-user',
            active: true,
            state: 'admin.users'
        },
        {
            tooltip: 'FEEDS USERS',
            icon: 'fa fa-circle',
            active: false,
            state: 'admin.fusers'
        }
    ];

    constructor($state: angular.ui.IStateService) {
        this.$state = $state;
    }

    public select(state: string) {
        this.$state.go(state);
    }
}
