import {ViewportScroller} from '@angular/common';
import {Injectable, NgZone} from '@angular/core';
import {
    NavigationStart, Params,
    Router,
    Scroll,
    UrlTree,
} from '@angular/router';
import {filter} from 'rxjs';

@Injectable({providedIn: 'root'})
export class CatalogScrollService {
    private pendingRestore: [number, number] | null = null;

    constructor(
        private router: Router,
        private viewportScroller: ViewportScroller,
        private ngZone: NgZone,
    ) {
        this.router.events
            .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
            .subscribe((event) => {
                if (event.navigationTrigger === 'popstate') {
                    return;
                }
                const fromUrl = this.router.parseUrl(this.router.url);
                const toUrl = this.router.parseUrl(event.url);
                const from = this.path(fromUrl);
                const to = this.path(toUrl);
                if (from !== to || to !== 'catalog') {
                    return;
                }
                if (this.isOnlyPageChange(fromUrl, toUrl)) {
                    this.pendingScrollTop = true;
                    return;
                }
                this.pendingRestore = this.viewportScroller.getScrollPosition();
            });
        this.router.events
            .pipe(filter((e): e is Scroll => e instanceof Scroll))
            .subscribe(() => {
                if (this.pendingScrollTop) {
                    this.pendingScrollTop = false;
                    this.ngZone.run(() => {
                        requestAnimationFrame(() => {
                            this.viewportScroller.scrollToPosition([0, 0]);
                        });
                    });
                    return;
                }
                if (!this.pendingRestore) {
                    return;
                }
                const pos = this.pendingRestore;
                this.pendingRestore = null;
                this.ngZone.run(() => {
                    requestAnimationFrame(() => {
                        this.viewportScroller.scrollToPosition(pos);
                    });
                });
            });
    }

    private path(url: UrlTree): string {
        return url.root.children['primary']?.segments.map(s => s.path).join('/') ?? '';
    }

    private pendingScrollTop = false;

    private isOnlyPageChange(from: UrlTree, to: UrlTree): boolean {
        const fromPage = String(from.queryParams['page'] ?? 1);
        const toPage = String(to.queryParams['page'] ?? 1);
        if (fromPage === toPage) {
            return false;
        }
        return this.sameQueryExcept(from.queryParams, to.queryParams, 'page');
    }

    private sameQueryExcept(a: Params, b: Params, exclude: string): boolean {
        const strip = (params: Params) => {
            const copy = {...params};
            delete copy[exclude];
            return JSON.stringify(this.normalizeParams(copy));
        };
        return strip(a) === strip(b);
    }

    private normalizeParams(params: Params): Record<string, string | string[]> {
        return Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                const value = params[key];
                acc[key] = Array.isArray(value) ? [...value].sort() : String(value);
                return acc;
            }, {} as Record<string, string | string[]>);
    }
}
