import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoaderService {

    isShowed$ = new BehaviorSubject<boolean>(false);

    private activeRequests = 0;
    private showTimer: ReturnType<typeof setTimeout> | null = null;
    private hideTimer: ReturnType<typeof setTimeout> | null = null;
    private shownAt : number | null = null;

    private readonly SHOW_DELAY = 300;
    private readonly MIN_VISIBLE = 400;

    constructor() {
    }

    show(): void     {
        this.activeRequests++;

        if (this.activeRequests === 1) {
            this.showTimer = setTimeout(() => {
                this.showTimer = null;
                if (this.activeRequests > 0) {
                    this.isShowed$.next(true);
                    this.shownAt = Date.now();
                }
            }, this.SHOW_DELAY);
        }
    }

    hide(): void {
        this.activeRequests = Math.max(0, this.activeRequests - 1);

        if (this.activeRequests > 0) {
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
            return;
        }

        if (this.showTimer) {
            clearTimeout(this.showTimer);
            this.showTimer = null;
            return;
        }

        if (!this.shownAt) {
            return;
        }

        const elapsed = Date.now() - this.shownAt;
        const remaining = this.MIN_VISIBLE - elapsed;
        if (remaining > 0) {
            this.hideTimer = setTimeout(()=> this.hideNow(), remaining);
        } else {
            this.hideNow();
        }
    }

    hideNow (): void {
        this.isShowed$.next(false);
        this.shownAt = null;
        this.showTimer = null;
        this.hideTimer = null;
    }
}
