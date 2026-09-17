import {Component, OnInit} from '@angular/core';
import {DeliveryType} from "../../../types/delivery.type";
import {PaymentType} from "../../../types/payment.type";
import {FormBuilder, Validators} from '@angular/forms';
import {UserService} from '../../../shared/services/user.service';
import {DefaultResponseType} from '../../../types/default-response.type';
import {UserInfoType} from '../../../types/user-info.type';
import {HttpErrorResponse} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
    selector: 'app-info',
    standalone: false,
    templateUrl: './info.component.html',
    styleUrl: './info.component.scss'
})
export class InfoComponent implements OnInit {

    userInfoForm;
    deliveryType: DeliveryType = DeliveryType.delivery;

    deliveryTypes = DeliveryType;
    paymentTypes = PaymentType;

    constructor(private fb: FormBuilder,
                private userService: UserService,
                private _snackBar: MatSnackBar,) {

        this.userInfoForm = this.fb.group({
            firstName: [''],
            lastName: [''],
            phone: [''],
            fatherName: [''],
            paymentType: [PaymentType.cashToCourier],
            email: ['', Validators.required],
            street: [''],
            house: [''],
            entrance: [''],
            apartment: ['']
        })
    }

    ngOnInit() {
        this.userService.getUserInfo()
            .subscribe({
                next: (data: UserInfoType) => {
                    const userInfo = data;

                    const paramsToUpdate = {
                        firstName: userInfo.firstName ? userInfo.firstName : '',
                        lastName: userInfo.lastName ? userInfo.lastName : '',
                        phone: userInfo.phone ? userInfo.phone : '',
                        fatherName: userInfo.fatherName ? userInfo.fatherName : '',
                        paymentType: userInfo.paymentType ? userInfo.paymentType : PaymentType.cashToCourier,
                        email: userInfo.email ? userInfo.email : '',
                        street: userInfo.street ? userInfo.street : '',
                        house: userInfo.house ? userInfo.house : '',
                        entrance: userInfo.entrance ? userInfo.entrance : '',
                        apartment: userInfo.apartment ? userInfo.apartment : ''
                    }

                    this.userInfoForm.setValue(paramsToUpdate);
                    if (userInfo.deliveryType) {
                        this.deliveryType = userInfo.deliveryType;
                    }
                },
                error: () => {
                }
            })
    }


    changeDeliveryType(deliveryType: DeliveryType) {
        this.deliveryType = deliveryType;

        this.userInfoForm.markAsDirty();
    }

    updateUserInfo() {
        if (this.userInfoForm.valid) {

            const paramsObject: UserInfoType = {
                email: this.userInfoForm.value.email ? this.userInfoForm.value.email : '',
                deliveryType: this.deliveryType,
                paymentType: this.userInfoForm.value.paymentType ? this.userInfoForm.value.paymentType : PaymentType.cashToCourier
            }

            if (this.userInfoForm.value.firstName) {
                paramsObject.firstName = this.userInfoForm.value.firstName;
            }
            if (this.userInfoForm.value.lastName) {
                paramsObject.lastName = this.userInfoForm.value.lastName;
            }
            if (this.userInfoForm.value.phone) {
                paramsObject.phone = this.userInfoForm.value.phone;
            }
            if (this.userInfoForm.value.fatherName) {
                paramsObject.fatherName = this.userInfoForm.value.fatherName;
            }
            if (this.userInfoForm.value.street) {
                paramsObject.street = this.userInfoForm.value.street;
            }
            if (this.userInfoForm.value.house) {
                paramsObject.house = this.userInfoForm.value.house;
            }
            if (this.userInfoForm.value.entrance) {
                paramsObject.entrance = this.userInfoForm.value.entrance;
            }
            if (this.userInfoForm.value.apartment) {
                paramsObject.apartment = this.userInfoForm.value.apartment;
            }


            this.userService.updateUserInfo(paramsObject)
                .subscribe({
                    next: (data: DefaultResponseType) => {
                        if (data.error) {
                            this._snackBar.open(data.message);
                            return;
                        }
                        this._snackBar.open('Данные успешно сохранены');
                        this.userInfoForm.markAsPristine();
                    },
                    error: (errorResponse: HttpErrorResponse) => {
                        this._snackBar.open(errorResponse.error?.message ?? 'Ошибка сохранения')
                    }
                })
        }
    }
}
