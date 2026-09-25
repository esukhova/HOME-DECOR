import {AfterViewInit, Component, DestroyRef, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ProductService} from '../../../shared/services/product.service';
import {ProductType} from '../../../types/product.type';
import {CategoryService} from '../../../shared/services/category.service';
import {CategoryWithTypeType} from '../../../types/category-with-type.type';
import {ActivatedRoute, Router} from '@angular/router';
import {ActiveParamsType} from '../../../types/active-params.type';
import {ActiveParamsUtil} from '../../../shared/utils/active-params.util';
import {AppliedFilterType} from '../../../types/applied-filter.type';
import {debounceTime} from 'rxjs';
import {CartService} from '../../../shared/services/cart.service';
import {CartType} from '../../../types/cart.type';
import {FavoriteService} from '../../../shared/services/favorite.service';
import {FavoriteType} from '../../../types/favorite.type';
import {AuthService} from '../../../core/auth/auth.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-catalog',
    standalone: false,
    templateUrl: './catalog.component.html',
    styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit, AfterViewInit, OnDestroy {

    products: ProductType[] = [];
    categoriesWithTypes: CategoryWithTypeType[] = [];
    activeParams: ActiveParamsType = {types: []};
    appliedFilters: AppliedFilterType[] = [];
    sortingOpen = false;
    filtersVisible = false;
    sortingOptions: { name: string, value: string }[] = [
        {name: 'От А до Я', value: 'az-asc'},
        {name: 'От Я до А', value: 'az-desc'},
        {name: 'По возрастанию цены', value: 'price-asc'},
        {name: 'По убыванию цены', value: 'price-desc'}
    ];
    pages: number[] = [];
    cart: CartType | null = null;
    favoriteProducts: FavoriteType[] | null = null;
    productsLoading: boolean = true;
    productsRefreshing: boolean = false;
    private productsLoadTimeout: ReturnType<typeof setTimeout> | null = null;
    private queryParamsInitialized = false;
    private readonly destroyRef = inject(DestroyRef);

    @ViewChild('appliedFiltersContent') appliedFiltersContent?: ElementRef<HTMLElement>;
    appliedFiltersHeight = 0;
    private resizeAppliedFiltersObserver?: ResizeObserver;

    constructor(private productService: ProductService,
                private categoryService: CategoryService,
                private activatedRoute: ActivatedRoute,
                private cartService: CartService,
                private router: Router,
                private favoriteService: FavoriteService,
                private authService: AuthService) {
    }


    ngOnInit() {

        this.cartService.getCart()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: CartType) => {
                    this.cart = data;
                    this.processFavorites();
                },
                error: () => {
                    this.processFavorites();
                }
            })

        this.filtersVisible = window.innerWidth > 768;
    }

    ngAfterViewInit() {
        const el = this.appliedFiltersContent?.nativeElement;
        if (!el) return;

        this.resizeAppliedFiltersObserver = new ResizeObserver(entries => {
            const height = Math.ceil(entries[0]?.target.scrollHeight ?? 0);
            this.appliedFiltersHeight = (height + 2);
        })

        this.resizeAppliedFiltersObserver.observe(el);
    }

    private processFavorites(): void {
        if (!this.authService.getIsLoggedIn()) {
            this.processCatalog();
            return;
        }

        this.favoriteService.getFavorites()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                    next: (data: FavoriteType[]) => {
                        this.favoriteProducts = data;
                        this.processCatalog();
                    },
                    error: () => {
                        this.processCatalog();
                    }
                }
            );
    }

    processCatalog() {
        this.categoryService.getCategoriesWithTypes()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                this.categoriesWithTypes = data;
                this.initQueryParamsListener();
            })
    }

    private initQueryParamsListener(): void {
        if (this.queryParamsInitialized) {
            return;
        }
        this.queryParamsInitialized = true;

        this.activatedRoute.queryParams
            .pipe(
                debounceTime(500),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(queryParams => {
                this.activeParams = ActiveParamsUtil.processParams(queryParams);

                this.appliedFilters = [];
                this.activeParams.types.forEach(typeUrl => {
                    for (let i = 0; i < this.categoriesWithTypes.length; i++) {
                        const foundType = this.categoriesWithTypes[i].types.find(type => type.url === typeUrl);
                        if (foundType) {
                            this.appliedFilters.push({
                                name: foundType.name,
                                url: foundType.url
                            })
                        }
                    }
                })

                if (this.activeParams.heightFrom) {
                    this.appliedFilters.push({
                        name: 'Высота: от ' + this.activeParams.heightFrom + ' см',
                        url: 'heightFrom'
                    })
                }
                if (this.activeParams.heightTo) {
                    this.appliedFilters.push({
                        name: 'Высота: до ' + this.activeParams.heightTo + ' см',
                        url: 'heightTo'
                    })
                }

                if (this.activeParams.diameterFrom) {
                    this.appliedFilters.push({
                        name: 'Диаметр: от ' + this.activeParams.diameterFrom + ' см',
                        url: 'diameterFrom'
                    })
                }
                if (this.activeParams.diameterTo) {
                    this.appliedFilters.push({
                        name: 'Диаметр: до ' + this.activeParams.diameterTo + ' см',
                        url: 'diameterTo'
                    })
                }

                this.loadProducts();
            });
    }

    loadProducts(): void {
        if (this.products.length === 0) {
            this.productsLoading = true;
        } else {
            this.productsRefreshing = true;
        }

        if (this.productsLoadTimeout) {
            clearTimeout(this.productsLoadTimeout);
        }

        this.productsLoadTimeout = setTimeout(() => {
            if (this.productsLoading) {
                this.productsLoading = false;
                this.products = [];
            }
        }, 7000);

        this.productService.getProducts(this.activeParams)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                if (this.productsLoadTimeout) {
                    clearTimeout(this.productsLoadTimeout);
                    this.productsLoadTimeout = null;
                }

                this.productsLoading = false;
                this.productsRefreshing = false;

                this.pages = [];
                for (let i = 1; i <= data.pages; i++) {
                    this.pages.push(i);
                }

                if (this.cart && this.cart.items.length > 0) {
                    this.products = data.items.map(product => {
                        if (this.cart) {
                            const productInCart = this.cart.items.find(item => item.product.id === product.id);
                            if (productInCart) {
                                product.countInCart = productInCart.quantity;
                            }
                        }

                        return product;
                    });
                } else {
                    this.products = data.items;
                }

                if (this.favoriteProducts) {
                    this.products = this.products.map(product => {
                        const productInFavorites = this.favoriteProducts?.find(item => item.id === product.id);
                        if (productInFavorites) {
                            product.isInFavorite = true;
                        }
                        return product;
                    })
                }
            },
            error: () => {
                if (this.productsLoadTimeout) {
                    clearTimeout(this.productsLoadTimeout);
                    this.productsLoadTimeout = null;
                }

                this.productsLoading = false;
                this.productsRefreshing = false;
                this.products = [];
            }
        });
    }

    removeAppliedFilter(appliedFilter: AppliedFilterType): void {
        if (appliedFilter.url === 'heightFrom' || appliedFilter.url === 'heightTo' || appliedFilter.url === 'diameterFrom' || appliedFilter.url === 'diameterTo') {
            delete this.activeParams[appliedFilter.url];
        } else {
            this.activeParams.types = this.activeParams.types.filter(item => item !== appliedFilter.url);
        }

        this.activeParams.page = 1;
        this.router.navigate(['/catalog'], {queryParams: this.activeParams});
    }

    toggleSorting() {
        this.sortingOpen = !this.sortingOpen;
    }

    sort(value: string) {
        this.activeParams.sort = value;
        this.router.navigate(['/catalog'], {queryParams: this.activeParams});
    }

    openPage(page: number) {
        this.activeParams.page = page;
        this.router.navigate(['/catalog'], {queryParams: this.activeParams});
    }

    openPrevPage() {
        if (this.activeParams.page && this.activeParams.page > 1) {
            this.activeParams.page--;
            this.router.navigate(['/catalog'], {queryParams: this.activeParams});
        }
    }

    openNextPage() {
        if (this.activeParams.page && this.activeParams.page < this.pages.length) {
            this.activeParams.page++;
            this.router.navigate(['/catalog'], {queryParams: this.activeParams});
        }
    }

    toggleFiltersVisibility() {
        this.filtersVisible = !this.filtersVisible;
    }

    trackByProductId(index: number, product: ProductType): string {
        return product.id;
    }

    ngOnDestroy(): void {
        if (this.productsLoadTimeout) {
            clearTimeout(this.productsLoadTimeout);
            this.productsLoadTimeout = null;
        }
        this.resizeAppliedFiltersObserver?.disconnect();
    }
}
