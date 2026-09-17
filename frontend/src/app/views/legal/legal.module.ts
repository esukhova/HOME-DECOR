import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PrivacyComponent} from './privacy/privacy.component';
import {TermsComponent} from './terms/terms.component';
import {ConsentComponent} from './consent/consent.component';
import {LegalRoutingModule} from './legal-routing.module';


@NgModule({
    declarations: [
        PrivacyComponent,
        TermsComponent,
        ConsentComponent
    ],
    imports: [
        CommonModule,
        LegalRoutingModule,
    ]
})
export class LegalModule {
}
