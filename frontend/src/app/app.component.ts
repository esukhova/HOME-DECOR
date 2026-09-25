import {Component, OnInit} from '@angular/core';
import {AuthService} from './core/auth/auth.service';
import { CatalogScrollService } from './core/routing/catalog-scroll.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: false,
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

    constructor(private authService: AuthService, private catalogScroll: CatalogScrollService) {}

    ngOnInit(): void {
        this.authService.initSession();
    }
}
