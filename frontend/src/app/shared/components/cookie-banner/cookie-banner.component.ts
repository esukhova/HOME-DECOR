import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'app-cookie-banner',
    standalone: false,
    templateUrl: './cookie-banner.component.html',
    styleUrl: './cookie-banner.component.scss'
})
export class CookieBannerComponent implements OnInit {
    visible = false;
    private readonly storageKey = 'cookieConsent';

    ngOnInit(): void {
        this.visible = localStorage.getItem(this.storageKey) !== 'accepted';
    }

    accept() {
        localStorage.setItem(this.storageKey, 'accepted');
        this.visible = false;
    }

}
