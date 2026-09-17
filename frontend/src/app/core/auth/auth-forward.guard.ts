import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, RouterStateSnapshot} from '@angular/router';
import {AuthService} from "./auth.service";
import {Location} from "@angular/common";

@Injectable({
    providedIn: 'root'
})
export class AuthForwardGuard implements CanActivate {

    constructor(private authService: AuthService,
                private location: Location) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): MaybeAsync<GuardResult> {
        if (this.authService.getIsLoggedIn()) {
            this.location.back();
            return false;
        }
        return true;
    }

}
