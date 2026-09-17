import {Injectable} from '@angular/core';
import {Observable, BehaviorSubject, throwError, finalize, shareReplay, of, switchMap} from 'rxjs';
import {LoginResponseType} from '../../types/login-response.type';
import {DefaultResponseType} from '../../types/default-response.type';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    public accessTokenKey = 'accessToken';
    public refreshTokenKey = 'refreshToken';
    public userIdKey = 'userId';

    public isLogged$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private isLogged: boolean = false;
    private refreshInProgress$: Observable<string> | null = null;

    constructor(private http: HttpClient) {
       this.initSession();
    }

    login(email: string, password: string, rememberMe: boolean): Observable<LoginResponseType> {
        return this.http.post<LoginResponseType>(environment.api + 'login', {
            email,
            password,
            rememberMe
        })
    }

    signup(email: string, password: string, passwordRepeat: string): Observable<LoginResponseType> {
        return this.http.post<LoginResponseType>(environment.api + 'signup', {
            email,
            password,
            passwordRepeat
        })
    }

    logout(): Observable<DefaultResponseType> {
        const tokens = this.getTokens();
        if (tokens && tokens.refreshToken) {
            return this.http.post<DefaultResponseType>(environment.api + 'logout', {
                refreshToken: tokens.refreshToken
            })
        } else {
            return throwError(() => 'Cannot find token');
        }
    }

    getIsLoggedIn() {
        return this.isLogged;
    }

    setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
        this.isLogged = true;
        this.isLogged$.next(true);
    }

    removeTokens(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userIdKey);
        this.isLogged = false;
        this.isLogged$.next(false);
    }

    getTokens(): { accessToken: string | null, refreshToken: string | null } {
        return {
            accessToken: localStorage.getItem(this.accessTokenKey),
            refreshToken: localStorage.getItem(this.refreshTokenKey),
        }
    }

    get userId(): string | null {
        return localStorage.getItem(this.userIdKey);
    }

    set userId(userId: string | null) {
        if (userId) {
            localStorage.setItem(this.userIdKey, userId);
        } else {
            localStorage.removeItem(this.userIdKey);
        }
    }

    refresh(): Observable<LoginResponseType> {
        const tokens = this.getTokens();
        if (tokens && tokens.refreshToken) {
            return this.http.post<LoginResponseType>(environment.api + 'refresh', {
                refreshToken: tokens.refreshToken
            })
        }
        return throwError(() => 'Cannot use token')
    }

    refreshAccessToken(): Observable<string> {
        if (!this.refreshInProgress$) {
            this.refreshInProgress$ = this.refresh().pipe(
                switchMap((result: LoginResponseType) => {
                    if (!result.accessToken || !result.refreshToken) {
                        return throwError(() => new Error('Ошибка авторизации'));
                    }

                    this.setTokens(result.accessToken, result.refreshToken);

                    if (result.userId) {
                        this.userId = result.userId;
                    }

                    return of(result.accessToken);
                }),
                finalize(() => this.refreshInProgress$ = null),
                shareReplay(1)
            );
        }

        return this.refreshInProgress$;
    }

    private decodeToken(token: string): {exp?: number} | null {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    }

    isTokenValid(token: string | null): boolean {
        if (!token) {
            return false;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }

        const decoded = this.decodeToken(token);
        if (!decoded?.exp) {
            return false;
        }

        return decoded.exp * 1000 >= Date.now();
    }

    isTokenExpired(token: string): boolean {
        return !this.isTokenValid(token);
    }

    initSession(): void {
        const tokens = this.getTokens();
        const accessValid = this.isTokenValid(tokens.accessToken);
        const refreshValid = this.isTokenValid(tokens.refreshToken);

        if (!accessValid && !refreshValid) {
            this.removeTokens();
            return;
        }

        if (accessValid) {
            this.isLogged = true;
            this.isLogged$.next(true);
            return;
        }

        this.isLogged = true;
        this.isLogged$.next(true);
        this.restoreSession();
    }

    restoreSession(): void {
        this.refreshAccessToken().subscribe({
            error: () => {
                this.removeTokens();
            }
        });
    }
}
