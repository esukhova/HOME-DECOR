import {Component, HostListener, Input, OnInit} from '@angular/core';
import {AuthService} from '../../../core/auth/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {CategoryWithTypeType} from '../../../types/category-with-type.type';
import {CartService} from '../../services/cart.service';
import {ProductService} from '../../services/product.service';
import {ProductType} from '../../../types/product.type';
import {environment} from '../../../../environments/environment';
import {FormControl} from '@angular/forms';
import {debounceTime, Subscription} from 'rxjs';

@Component({
    selector: 'app-header',
    standalone: false,
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

    searchField = new FormControl();
    showedSearch: boolean = false;
    serverStaticPath = environment.serverStaticPath;
    products: ProductType[] = [];
    cartCount: number = 0;
    isLogged: boolean = false;
    isMobileMenuOpen = false;
    private _subscriptions: Subscription = new Subscription();
    @Input() categories: CategoryWithTypeType[] = [];

    constructor(private authService: AuthService,
                private _snackBar: MatSnackBar,
                private router: Router,
                private cartService: CartService,
                private productService: ProductService) {
        this.isLogged = this.authService.getIsLoggedIn();
    }

    ngOnInit() {

        this._subscriptions.add(this.searchField.valueChanges
            .pipe(
                debounceTime(500)
            )
            .subscribe(value => {
                if (value && value.length > 2) {
                    this.productService.searchProducts(value)
                        .subscribe((data: ProductType[]) => {
                            this.products = data;
                            this.showedSearch = true;
                        })
                } else {
                    this.products = [];
                }
            }))


        this._subscriptions.add(this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
            this.isLogged = isLoggedIn;
            this.refreshCartCount();
        }))

        this._subscriptions.add(this.cartService.cartCount$
            .subscribe(cartCount => {
                this.cartCount = cartCount;
            }))
    }

    logout(): void {
        this._subscriptions.add(this.authService.logout()
            .subscribe({
                next: () => {
                    this.doLogout();
                },
                error: () => {
                    this.doLogout();
                }
            }))
    }

    doLogout(): void {
        this.authService.removeTokens();
        this.authService.userId = null;
        this._snackBar.open('Вы вышли из системы');
        this.router.navigate(['/']);
    }

    private refreshCartCount(): void {
        this._subscriptions.add(this.cartService.getCartCount()
            .subscribe({
                next: (data: { count: number }) => {
                    this.cartCount = data.count;
                },
                error: () => {
                    this.cartCount = 0;
                    this.cartService.setCartCount(0);
                }
            }));
    }

    selectProduct(productUrl: string) {
        this.router.navigate(['/product/' + productUrl]);
        this.searchField.setValue('');
        this.products = [];
    }

    @HostListener('document:click', ['$event'])
    click(event: Event) {
        if (this.showedSearch && !(event.target as HTMLElement).classList.contains('search-product')) {
            this.showedSearch = false;
        }
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        document.body.style.height = this.isMobileMenuOpen ? '100vh' : '';
        document.body.style.overflowY = this.isMobileMenuOpen ? 'hidden' : '';
    }

    isFragmentActive(path: string, fragment: string) {
        const currentUrl = this.router.url.split('#')[0];
        const currentFragment = this.router.parseUrl(this.router.url).fragment;
        return currentUrl === path && currentFragment === fragment;
    }

}
