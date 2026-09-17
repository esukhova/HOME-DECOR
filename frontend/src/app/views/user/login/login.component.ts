import {Component} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {AuthService} from '../../../core/auth/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {LoginResponseType} from '../../../types/login-response.type';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {CartService} from '../../../shared/services/cart.service';
import {CartType} from '../../../types/cart.type';
import {catchError, EMPTY, map, of, switchMap} from 'rxjs';

@Component({
    selector: 'app-login',
    standalone: false,
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {

    loginForm;

    constructor(private fb: FormBuilder,
                private authService: AuthService,
                private cartService: CartService,
                private _snackBar: MatSnackBar,
                private router: Router) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.email, Validators.required]],
            password: ['', [Validators.required]],
            rememberMe: [false]
        });
    }

    login(): void {
        const email = this.loginForm.value.email;
        const password = this.loginForm.value.password;
        const rememberMe = !!this.loginForm.value.rememberMe;

        if (!this.loginForm.valid || !email || !password) {
            return;
        }

        this.cartService.getCart().pipe(
            catchError(() => of({items: []} as CartType)),
            switchMap((guestCart: CartType) =>
                this.authService.login(email, password, rememberMe)
                    .pipe(map(data => ({guestCart, data})))
            ),
            switchMap(({guestCart, data}) => {
                if (!data.accessToken || !data.refreshToken || !data.userId) {
                    this._snackBar.open('Ошибка авторизации');
                    return EMPTY;
                }

                this.authService.setTokens(data.accessToken, data.refreshToken);
                this.authService.userId = data.userId;

                return this.cartService.mergeGuestCart(guestCart);
            })
        ).subscribe({
            next: () => {
                this._snackBar.open('Вы успешно авторизовались');
                this.router.navigate(['/']);
            },
            error: (errorResponse: HttpErrorResponse) => {
                this._snackBar.open(errorResponse.error?.message ?? 'Ошибка авторизации');
            }
        });
    }

}
