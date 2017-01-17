/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldCurrentUserService } from '../services/currentuser';
import { IMinemeldCurrentUser } from '../services/aaa';

export class AboutController {
    MineMeldCurrentUserService: IMineMeldCurrentUserService;

    /** @ngInject */
    constructor(MineMeldCurrentUserService: IMineMeldCurrentUserService) {
        this.MineMeldCurrentUserService = MineMeldCurrentUserService;
    }
}
