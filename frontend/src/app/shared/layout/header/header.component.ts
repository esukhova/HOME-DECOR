import {Component, HostListener, Input, OnInit} from '@angular/core';
import {AuthService} from '../../../core/auth/auth.service';
import {DefaultResponseType} from '../../../types/default-response.type';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {CategoryWithTypeType} from '../../../types/category-with-type.type';
import {CartService} from '../../services/cart.service';
import {ProductService} from '../../services/product.service';
import {ProductType} from '../../../types/product.type';
import {environment} from '../../../../environments/environment';
import {FormControl} from '@angular/forms';
import {debounceTime} from 'rxjs';

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
  @Input() categories: CategoryWithTypeType[] = [];

  constructor(private authService: AuthService,
              private _snackBar: MatSnackBar,
              private router: Router,
              private cartService: CartService,
              private productService: ProductService) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit() {

    this.searchField.valueChanges
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
      })


    this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
      this.isLogged = isLoggedIn;
    })

    this.cartService.getCartCount()
      .subscribe((data: { count: number } | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.cartCount = (data as { count: number }).count;
      })

    this.cartService.cartCount$
      .subscribe(cartCount => {
        this.cartCount = cartCount;
      })
  }

  logout(): void {
    this.authService.logout()
      .subscribe({
        next: () => {
          this.doLogout();
        },
        error: () => {
          this.doLogout();
        }
      })
  }

  doLogout(): void {
    this.authService.removeTokens();
    this.authService.userId = null;
    this._snackBar.open('Вы вышли из системы');
    this.router.navigate(['/']);
  }

  selectProduct(productUrl: string) {
    this.router.navigate(['/product/' + productUrl]);
    this.searchField.setValue('');
    this.products = [];
  }

  @HostListener('document:click', ['$event'])
  click(event: Event) {
    if (this.showedSearch && (event.target as HTMLElement).className.indexOf('search-product') === -1) {
      this.showedSearch = false;
    }
  }


}
