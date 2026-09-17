import {Injectable} from '@angular/core';
import {forkJoin, Observable, Subject, switchMap, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {CartType} from '../../types/cart.type';

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

    getCart(): Observable<CartType> {
        return this.http.get<CartType>(environment.api + 'cart', {withCredentials: true});
    }

    getCartCount(): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(environment.api + 'cart/count', {withCredentials: true})
            .pipe(
                tap(data => {
                    this.setCartCount((data as { count: number }).count);
                })
            )
    }

    updateCart(productId: string, quantity: number): Observable<CartType> {
        return this.http.post<CartType>(environment.api + 'cart', {
            productId,
            quantity
        }, {withCredentials: true})
            .pipe(
                tap(data => {
                    let cartCount = 0;
                    data.items.forEach(item => {
                        cartCount += item.quantity;
                    });
                    this.setCartCount(cartCount);
                })
            )
    }

    mergeGuestCart(guestCart: CartType): Observable<{ count: number }> {
        if (!guestCart.items.length) {
            return this.getCartCount();
        }

        const requests = guestCart.items.map(item =>
            this.updateCart(item.product.id, item.quantity)
        );

        return forkJoin(requests).pipe(
            switchMap(() => this.getCartCount())
        );
    }
}
