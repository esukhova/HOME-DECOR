import {Component, OnInit} from '@angular/core';
import {OwlOptions} from 'ngx-owl-carousel-o';
import {ProductType} from '../../../types/product.type';
import {ProductService} from '../../../shared/services/product.service';
import {CartType} from '../../../types/cart.type';
import {CartService} from '../../../shared/services/cart.service';
import {environment} from '../../../../environments/environment';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
    selector: 'app-cart',
    standalone: false,
    templateUrl: './cart.component.html',
    styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
    extraProducts: ProductType[] = [];
    cart: CartType | null = null;
    serverStaticPath = environment.serverStaticPath;
    totalAmount: number = 0;
    totalCount: number = 0;

    constructor(private productService: ProductService,
                private cartService: CartService,
                private router: Router,
                private _snackBar: MatSnackBar) {
    }

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
            500: {
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

    ngOnInit() {

        this.productService.getBestProducts()
            .subscribe({
                next: (data: ProductType[]) => {
                    this.extraProducts = data as ProductType[];
                },
                error: () => {
                }
            })


        this.cartService.getCart()
            .subscribe({
                next: (data: CartType) => {
                    this.cart = data as CartType;
                    this.calculateTotal();
                },
                error: (errorResponse: HttpErrorResponse) => {
                    this._snackBar.open('Не удалось загрузить товары в корзине');
                    this.router.navigate(['/catalog']);
                }
            })
    }

    calculateTotal() {
        this.totalCount = 0;
        this.totalAmount = 0;
        if (this.cart) {
            this.cart.items.forEach(item => {
                this.totalCount += item.quantity;
                this.totalAmount += item.quantity * item.product.price;
            })
        }
    }

    updateCount(id: string, count: number) {
        if (this.cart) {
            this.cartService.updateCart(id, count)
                .subscribe({
                    next: (data: CartType) => {
                        this.cart = data as CartType;
                        this.calculateTotal();
                    },
                    error: (errorResponse: HttpErrorResponse) => {
                        this._snackBar.open('Не удалось изменить количество товаров в корзине');
                    }
                })
        }
    }
}
