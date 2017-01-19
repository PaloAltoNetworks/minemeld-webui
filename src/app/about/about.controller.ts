/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldCurrentUserService } from '../services/currentuser';

export class AboutController {
    MineMeldCurrentUserService: IMineMeldCurrentUserService;

    /** @ngInject */
    constructor(MineMeldCurrentUserService: IMineMeldCurrentUserService) {
        this.MineMeldCurrentUserService = MineMeldCurrentUserService;
    }
}
