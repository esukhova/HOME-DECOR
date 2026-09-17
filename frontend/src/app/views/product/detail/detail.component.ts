import {Component, OnInit} from '@angular/core';
import {ProductType} from '../../../types/product.type';
import {OwlOptions} from 'ngx-owl-carousel-o';
import {ProductService} from '../../../shared/services/product.service';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import {CartType} from '../../../types/cart.type';
import {CartService} from '../../../shared/services/cart.service';
import {FavoriteService} from '../../../shared/services/favorite.service';
import {FavoriteType} from '../../../types/favorite.type';
import {DefaultResponseType} from '../../../types/default-response.type';
import {AuthService} from '../../../core/auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
    selector: 'app-detail',
    standalone: false,
    templateUrl: './detail.component.html',
    styleUrl: './detail.component.scss'
})
export class DetailComponent implements OnInit {
    recommendedProducts: ProductType[] = [];
    product!: ProductType;
    serverStaticPath = environment.serverStaticPath;
    count: number = 1;
    isLogged: boolean = false;

    customOptions: OwlOptions = {
        loop: true,
        mouseDrag: false,
        touchDrag: false,
        pullDrag: false,
        margin: 25,
        dots: false,
        navSpeed: 700,
        navText: ['', ''],
        responsive: {
            0: {
                items: 1
            },
            550: {
                items: 2
            },
            740: {
                items: 3
            },
            940: {
                items: 4
            }
        },
        nav: false
    }

    constructor(private productService: ProductService,
                private activatedRoute: ActivatedRoute,
                private cartService: CartService,
                private favoriteService: FavoriteService,
                private authService: AuthService,
                private _snackBar: MatSnackBar,
                private router: Router) {
        this.isLogged = this.authService.getIsLoggedIn();
    }

    ngOnInit() {

        this.activatedRoute.params.subscribe(params => {
            this.productService.getProduct(params['url'])
                .subscribe({
                    next: (data: ProductType) => {
                        this.product = data;

                        this.cartService.getCart().subscribe({
                            next: (cartData: CartType) => {
                                const cartDataResponse = cartData;
                                if (cartDataResponse && cartDataResponse.items.length > 0) {
                                    const productInCart = cartDataResponse.items.find(cartProduct => cartProduct.product.id === data.id);
                                    if (productInCart) {
                                        this.product.countInCart = productInCart.quantity;
                                        this.count = this.product.countInCart;
                                    }
                                }
                            },
                            error: () => {
                            }
                        })

                        if (this.authService.getIsLoggedIn()) {
                            this.favoriteService.getFavorites()
                                .subscribe({
                                    next: (data: FavoriteType[]) => {
                                        const products = data as FavoriteType[];
                                        const currentProductExists = products.find(item => item.id === this.product.id);
                                        if (currentProductExists) {
                                            this.product.isInFavorite = true;
                                        }
                                    },
                                    error: () => {
                                    }
                                })
                        }
                    },
                    error: () => {
                        this._snackBar.open('Товар не найден');
                        this.router.navigate(['/catalog']);
                    }
                })
        })


        this.productService.getBestProducts()
            .subscribe({
                next: (data: ProductType[]) => {
                    this.recommendedProducts = data as ProductType[];
                },
                error: () => {
                }
            })

        this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
            this.isLogged = isLoggedIn;
        })
    }

    updateCount(value: number) {
        this.count = value;
        if (this.product.countInCart) {
            this.cartService.updateCart(this.product.id, this.count)
                .subscribe({
                    next: (data: CartType) => {
                        this.product.countInCart = this.count;
                    },
                    error: (errorResponse: HttpErrorResponse) => {
                        this._snackBar.open('Не удалось изменить количество товара в корзине')
                    }
                })
        }
    }

    addToCart() {
        this.cartService.updateCart(this.product.id, this.count)
            .subscribe({
                next: (data: CartType) => {
                    this.product.countInCart = this.count;
                },
                error: (errorResponse: HttpErrorResponse) => {
                    this._snackBar.open('Не удалось добавить товар в корзину');
                }
            })
    }

    removeFromCart() {
        this.cartService.updateCart(this.product.id, 0)
            .subscribe({
                next: (data: CartType) => {
                    this.product.countInCart = 0;
                    this.count = 1;
                },
                error: (errorResponse: HttpErrorResponse) => {
                    this._snackBar.open('Не удалось удалить товар из корзины');
                }
            })
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
                            console.error('Details: removeFavorite - ', data.message);
                            this._snackBar.open('Не удалось удалить товар из избранного');
                            return;
                        }

                        this.product.isInFavorite = false;
                    },
                    error: (errorResponse: HttpErrorResponse) => {
                        this._snackBar.open('Не удалось удалить товар из избранного');
                    }
                })

        } else {
            this.favoriteService.addFavorite(this.product.id)
                .subscribe({
                    next: (data: FavoriteType) => {
                        this.product.isInFavorite = true;
                    },
                    error: (errorResponse: HttpErrorResponse) => {
                        this._snackBar.open('Не удалось добавить товар в избранное');
                    }
                })
        }
    }
}
