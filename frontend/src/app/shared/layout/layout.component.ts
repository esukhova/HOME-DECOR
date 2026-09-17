import {Component} from '@angular/core';
import {CategoryService} from '../services/category.service';
import {CategoryWithTypeType} from '../../types/category-with-type.type';

@Component({
    selector: 'app-layout',
    standalone: false,
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss',
})
export class LayoutComponent {

    categories: CategoryWithTypeType[] = [];

    constructor(private categoryService: CategoryService) {
    }

    ngOnInit() {
        this.categoryService.getCategoriesWithTypes()
            .subscribe({
                next: (categories: CategoryWithTypeType[]) => {
                    this.categories = categories.map(category => {
                        return Object.assign({typesUrl: category.types.map(type => type.url)}, category);
                    });
                },
                error: () => {
                }
            })
    }

}
