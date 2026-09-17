import {Component} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {AuthService} from '../../../core/auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {CartService} from '../../../shared/services/cart.service';
import {CartType} from '../../../types/cart.type';
import {catchError, EMPTY, map, of, switchMap} from 'rxjs';

@Component({
    selector: 'app-signup',
    standalone: false,
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.scss'
})
export class SignupComponent {

    signupForm;

    constructor(private fb: FormBuilder,
                private authService: AuthService,
                private cartService: CartService,
                private _snackBar: MatSnackBar,
                private router: Router) {

        this.signupForm = this.fb.group({
            email: ['', [Validators.email, Validators.required]],
            password: ['', [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)]],
            passwordRepeat: ['', [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)]],
            agree: [false, [Validators.requiredTrue]]
        });
    }

    signup() {
        const email = this.signupForm.value.email;
        const password = this.signupForm.value.password;
        const passwordRepeat = this.signupForm.value.passwordRepeat;
        const agree = this.signupForm.value.agree;

        if (!this.signupForm.valid || !email || !password || !passwordRepeat || !agree) {
            return;
        }

        this.cartService.getCart().pipe(
            catchError(() => of({items: []} as CartType)),
            switchMap((guestCart: CartType) =>
                this.authService.signup(email, password, passwordRepeat)
                    .pipe(map(data => ({guestCart, data})))
            ),
            switchMap(({guestCart, data}) => {
                if (!data.accessToken || !data.refreshToken || !data.userId) {
                    this._snackBar.open('Ошибка регистрации');
                    return EMPTY;
                }

                this.authService.setTokens(data.accessToken, data.refreshToken);
                this.authService.userId = data.userId;

                return this.cartService.mergeGuestCart(guestCart);
            })
        ).subscribe({
            next: () => {
                this._snackBar.open('Вы успешно зарегистрировались');
                this.router.navigate(['/']);
            },
            error: (errorResponse: HttpErrorResponse) => {
                this._snackBar.open(errorResponse.error?.message ?? 'Ошибка регистрации');
            }
        });
    }

}
