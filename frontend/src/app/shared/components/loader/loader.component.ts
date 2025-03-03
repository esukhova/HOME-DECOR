import {Component, OnInit} from '@angular/core';
import {LoaderService} from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: false,
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent implements OnInit {

  isShowed: boolean = false;

  constructor(private loaderService: LoaderService) {
  }

  ngOnInit() {
    this.loaderService.isShowed$.subscribe((isShowed: boolean) => {
      this.isShowed = isShowed;
    })
  }
}
