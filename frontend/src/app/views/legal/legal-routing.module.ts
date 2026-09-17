import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ConsentComponent} from './consent/consent.component';
import {PrivacyComponent} from './privacy/privacy.component';
import {TermsComponent} from './terms/terms.component';

const routes: Routes = [
    {path: 'privacy', component: PrivacyComponent},
    {path: 'terms', component: TermsComponent},

    {path: 'consent', component: ConsentComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LegalRoutingModule {
}
