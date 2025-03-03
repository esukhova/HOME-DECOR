import {Component, OnInit} from '@angular/core';
import {FavoriteService} from '../../../shared/services/favorite.service';
import {DefaultResponseType} from '../../../types/default-response.type';
import {FavoriteType} from '../../../types/favorite.type';
import {environment} from '../../../../environments/environment';
import {CartType} from '../../../types/cart.type';
import {CartService} from '../../../shared/services/cart.service';
import {ProductService} from '../../../shared/services/product.service';

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
              private productService: ProductService) {
  }

  ngOnInit() {
    this.favoriteService.getFavorites()
      .subscribe((data: FavoriteType[] | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }

        this.products = data as FavoriteType[];

        //----------------------
        this.cartService.getCart()
          .subscribe((cartData: CartType | DefaultResponseType) => {
            if ((cartData as DefaultResponseType).error !== undefined) {
              throw new Error((cartData as DefaultResponseType).message);
            }

            this.cart = cartData as CartType;

            if (this.cart && this.cart.items.length > 0) {
              this.products.forEach((favoriteProduct) => {
                const productInCart = (this.cart as CartType).items.find(cartProduct => cartProduct.product.id === favoriteProduct.id);
                if (productInCart) {
                  favoriteProduct.quantity = productInCart.quantity;
                }
              })
            }
          })
        //--------------
      })
  }

  removeFromFavorites(id: string) {
    this.favoriteService.removeFavorite(id)
      .subscribe(data => {
        if (data.error) {
          //...
          throw new Error(data.message);
        }

        this.products = this.products.filter(item => item.id !== id);
      })
  }


  //---------------
  updateCount(id: string, count: number) {
    this.cartService.updateCart(id, count)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }

        const updatedInCartProduct = this.products.find(favoriteProduct => favoriteProduct.id === id);
        if (updatedInCartProduct) {
          updatedInCartProduct.quantity = count;
        }
      })
  }
  //--------------

}
