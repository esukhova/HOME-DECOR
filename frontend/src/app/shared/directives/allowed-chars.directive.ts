import {Directive, ElementRef, HostListener, Input, numberAttribute, Optional} from '@angular/core';
import {NgControl} from '@angular/forms';

@Directive({
  selector: '[allowedChars]',
  standalone: false
})
export class AllowedCharsDirective {

    @Input() allowedChars: string = '0-9';
    @Input({transform: numberAttribute}) maxChars: number | null = null;

    constructor(private elementRef: ElementRef<HTMLInputElement>,
                @Optional() private ngControl: NgControl) {}

    @HostListener('input')
    onInput(): void {
        const input  = this.elementRef.nativeElement;
        let cleaned = input.value.replace(new RegExp(`[^${this.allowedChars}]`, 'g'), '');
        if (this.maxChars != null && this.maxChars > 0) {
            cleaned = cleaned.slice(0, this.maxChars);
        }
        if (cleaned === input.value) return;

        const position = Math.max((input.selectionStart ?? cleaned.length) - 1, 0);
        input.value = cleaned;
        input.setSelectionRange(position, position);
        this.ngControl?.control?.setValue(cleaned, {emitModelToViewChange: false});
    }
}

