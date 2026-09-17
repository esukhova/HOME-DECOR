import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, RouterStateSnapshot} from '@angular/router';
import {AuthService} from "./auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private authService: AuthService,
                private _snackBar: MatSnackBar) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): MaybeAsync<GuardResult> {
        const isLoggedIn = this.authService.getIsLoggedIn();
        if (!isLoggedIn) {
            this._snackBar.open('Для доступа необходимо авторизоваться');
        }
        return isLoggedIn;
    }

}
