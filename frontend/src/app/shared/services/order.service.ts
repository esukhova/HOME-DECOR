import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {OrderType} from '../../types/order.type';

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    constructor(private http: HttpClient) {
    }

    createOrder(params: OrderType): Observable<OrderType> {
        return this.http.post<OrderType>(environment.api + 'orders', params, {withCredentials: true});
    }

    getOrders(): Observable<OrderType[]> {
        return this.http.get<OrderType[]>(environment.api + 'orders');
    }
}
