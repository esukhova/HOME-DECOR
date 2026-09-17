import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, finalize, Observable, switchMap, throwError} from 'rxjs';
import {Injectable} from '@angular/core';
import {AuthService} from './auth.service';
import {Router} from '@angular/router';
import {LoaderService} from '../../shared/services/loader.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private readonly publicUrls = [
        '/login',
        '/signup',
        '/refresh',
        '/products',
        '/categories',
        '/types'
    ]

    constructor(private authService: AuthService,
                private router: Router,
                private loaderService: LoaderService,
                private _snackBar: MatSnackBar) {
    }

    private isPublicRequest(url: string): boolean {
        return this.publicUrls.some(publicUrl => url.includes(publicUrl));
    }

    private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
        return req.clone({
            headers: req.headers.set('x-access-token', token)
        })
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.loaderService.show();

        const tokens = this.authService.getTokens();
        const shouldAttachToken = !!tokens.accessToken && !this.isPublicRequest(req.url);

        const request = shouldAttachToken
            ? this.addToken(req, tokens.accessToken!)
            : req;

        return next.handle(request).pipe(
            catchError((error) => {
                const isAuthError =
                    shouldAttachToken &&
                    !this.isPublicRequest(request.url) &&
                    (error.status === 401 || error.status === 500);

                if (isAuthError) {
                    return this.handle401Error(request, next);
                }

                console.error(`[HTTP ${error.status}] ${request.method} ${request.url}`, error.error);
                return throwError(() => error);
            }),
            finalize(() => this.loaderService.hide())
        )
    }


    handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return this.authService.refreshAccessToken().pipe(
            switchMap((accessToken) => {
                return next.handle(this.addToken(req, accessToken))
            }),
            catchError((error) => {
                this.authService.removeTokens();
                this._snackBar.open('Сессия истекла, войдите заново');
                this.router.navigate(['/']);
                return throwError(() => error);
            })
        );
    }
}
