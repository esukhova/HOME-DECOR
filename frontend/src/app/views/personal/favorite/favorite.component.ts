import {Component, OnInit} from '@angular/core';
import {FavoriteService} from '../../../shared/services/favorite.service';
import {DefaultResponseType} from '../../../types/default-response.type';
import {FavoriteType} from '../../../types/favorite.type';
import {environment} from '../../../../environments/environment';
import {CartType} from '../../../types/cart.type';
import {CartService} from '../../../shared/services/cart.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';

@Component({
    selector: 'app-favorite',
    standalone: false,
    templateUrl: './favorite.component.html',
    styleUrl: './favorite.component.scss'
})
export class FavoriteComponent implements OnInit {

    cart: CartType | null = null;
    products: FavoriteType[] = [];
    serverStaticPath = environment.serverStaticPath;

    constructor(private favoriteService: FavoriteService,
                private cartService: CartService,
                private router: Router,
                private _snackBar: MatSnackBar) {
    }

    ngOnInit() {
        this.favoriteService.getFavorites()
            .subscribe({
                next: (data: FavoriteType[]) => {
                    this.products = data as FavoriteType[];

                    this.cartService.getCart()
                        .subscribe({
                            next: (cartData: CartType) => {
                                this.cart = cartData as CartType;

                                if (this.cart && this.cart.items.length > 0) {
                                    this.products.forEach((favoriteProduct) => {
                                        const productInCart = (this.cart as CartType).items.find(cartProduct => cartProduct.product.id === favoriteProduct.id);
                                        if (productInCart) {
                                            favoriteProduct.quantity = productInCart.quantity;
                                        }
                                    })
                                }
                            },
                            error: () => {
                            }
                        })
                },
                error: () => {
                    this._snackBar.open('Не удалось загрузить избранное');
                    this.router.navigate(['/']);
                }
            })
    }

    removeFromFavorites(id: string) {
        this.favoriteService.removeFavorite(id)
            .subscribe({
                next: (data: DefaultResponseType) => {
                    if (data.error) {
                        console.error('Избранное: ', data.message);
                        this._snackBar.open('Не удалось удалить товар из избранного');
                        return;
                    }

                    this.products = this.products.filter(item => item.id !== id);
                },
                error: () => {
                    this._snackBar.open('Не удалось удалить товар из избранного');
                }
            })
    }

    updateCount(id: string, count: number) {
        this.cartService.updateCart(id, count)
            .subscribe({
                next: (data: CartType) => {
                    const updatedInCartProduct = this.products.find(favoriteProduct => favoriteProduct.id === id);
                    if (updatedInCartProduct) {
                        updatedInCartProduct.quantity = count;
                    }
                },
                error: () => {
                    this._snackBar.open('Не удалось изменить количество товаров в корзине');
                }
            })
    }
}
