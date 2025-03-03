import {Injectable} from '@angular/core';
import {Observable, Subject, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {CartType} from '../../types/cart.type';
import {DefaultResponseType} from '../../types/default-response.type';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartCount: number = 0;
  cartCount$: Subject<number> = new Subject<number>();

  constructor(private http: HttpClient) {
  }

  setCartCount(cartCount: number) {
    this.cartCount = cartCount;
    this.cartCount$.next(this.cartCount);
  }

  getCart(): Observable<CartType | DefaultResponseType> {
    return this.http.get<CartType | DefaultResponseType>(environment.api + 'cart', {withCredentials: true});
  }

  getCartCount(): Observable<{ count: number } | DefaultResponseType> {
    return this.http.get<{
      count: number
    } | DefaultResponseType>(environment.api + 'cart/count', {withCredentials: true})
      .pipe(
        tap(data => {
          if (!data.hasOwnProperty('error')) {
            this.setCartCount((data as { count: number }).count);
          }
        })
      )
  }

  updateCart(productId: string, quantity: number): Observable<CartType | DefaultResponseType> {
    return this.http.post<CartType | DefaultResponseType>(environment.api + 'cart', {
      productId,
      quantity
    }, {withCredentials: true})
      .pipe(
        tap(data => {
          if (!data.hasOwnProperty('error')) {
            let cartCount = 0;
            (data as CartType).items.forEach(item => {
              cartCount += item.quantity;
            });
            this.setCartCount(cartCount);
          }
        })
      )
  }
}
