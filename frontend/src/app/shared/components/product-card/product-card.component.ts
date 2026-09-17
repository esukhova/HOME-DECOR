import {Component, Input, OnInit} from '@angular/core';
import {ProductType} from '../../../types/product.type';
import {environment} from '../../../../environments/environment';
import {CartService} from '../../services/cart.service';
import {CartType} from '../../../types/cart.type';
import {FavoriteType} from '../../../types/favorite.type';
import {DefaultResponseType} from '../../../types/default-response.type';
import {FavoriteService} from '../../services/favorite.service';
import {AuthService} from '../../../core/auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
    selector: 'product-card',
    standalone: false,
    templateUrl: './product-card.component.html',
    styleUrl: './product-card.component.scss'
})
export class ProductCardComponent implements OnInit {

    @Input() product!: ProductType;
    @Input() countInCart: number | undefined = 0;
    @Input() variant: 'default' | 'light' | 'catalog' = 'default';
    serverStaticPath = environment.serverStaticPath;
    count: number = 1;
    isLogged: boolean = false;

    constructor(private cartService: CartService,
                private favoriteService: FavoriteService,
                private authService: AuthService,
                private _snackBar: MatSnackBar,
                private router: Router) {
        this.isLogged = this.authService.getIsLoggedIn();
    }

    ngOnInit() {
        if (this.countInCart && this.countInCart > 1) {
            this.count = this.countInCart;
        }

        this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
            this.isLogged = isLoggedIn;
        })
    }


    addToCart() {
        this.cartService.updateCart(this.product.id, this.count)
            .subscribe({
                next: (data: CartType) => {
                    this.countInCart = this.count;
                },
                error: (errorResponse: HttpErrorResponse) => {
                    this._snackBar.open('Не удалось добавить товар в корзину')
                }
            })
    }

    removeFromCart() {
        this.cartService.updateCart(this.product.id, 0)
            .subscribe({
                next: (data: CartType) => {
                    this.countInCart = 0;
                    this.count = 1;
                },
                error: (errorResponse: HttpErrorResponse) => {
                    this._snackBar.open('Не удалось удалить товар из корзины')
                }
            })
    }

    updateCount(value: number) {
        this.count = value;
        if (this.countInCart) {
            this.cartService.updateCart(this.product.id, this.count)
                .subscribe({
                    next: (data: CartType) => {
                        this.countInCart = this.count;
                    },
                    error: (errorResponse: HttpErrorResponse) => {
                        this._snackBar.open('Не удалось изменить количество товара в корзине')
                    }
                })
        }
    }

    updateFavorite() {
        if (!this.authService.getIsLoggedIn()) {
            this._snackBar.open('Для добавления в избранное необходимо авторизоваться')
            return;
        }

        if (this.product.isInFavorite) {
            this.favoriteService.removeFavorite(this.product.id)
                .subscribe({
                    next: (data: DefaultResponseType) => {
                        if (data.error) {
                            console.error('Карточка товара: ', data.message);
                            this._snackBar.open('Не удалось удалить товар из избранного')
                            return;
                        }

                        this.product.isInFavorite = false;
                    },
                    error: (errorResponse: HttpErrorResponse) => {
                        this._snackBar.open('Не удалось удалить товар из избранного')
                    }
                })

        } else {
            this.favoriteService.addFavorite(this.product.id)
                .subscribe({
                    next: (data: FavoriteType) => {
                        this.product.isInFavorite = true;
                    },
                    error: (errorResponse: HttpErrorResponse) => {
                        this._snackBar.open('Не удалось добавить товар в избранное')
                    }
                })
        }
    }

    navigate() {
        if (this.variant === 'light') {
            this.router.navigate(['/product/' + this.product.url])
        }
    }
}
