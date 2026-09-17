import {Component, OnInit} from '@angular/core';
import {OrderService} from '../../../shared/services/order.service';
import {OrderType} from '../../../types/order.type';
import {OrderStatusUtil} from '../../../shared/utils/order-status.util';
import {HttpErrorResponse} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
    selector: 'app-orders',
    standalone: false,
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {

    orders: OrderType[] = [];

    constructor(private orderService: OrderService,
                private _snackBar: MatSnackBar) {
    }

    ngOnInit() {
        this.orderService.getOrders()
            .subscribe({
                next: (data: OrderType[]) => {
                    this.orders = data.map(item => {

                        const status = OrderStatusUtil.getStatusAndColor(item.status);
                        item.statusRus = status.name;
                        item.color = status.color;
                        return item;
                    })
                },
                error: (errorResponse: HttpErrorResponse) => {
                    this._snackBar.open('Заказы не найдены');
                }
            });
    }
}
