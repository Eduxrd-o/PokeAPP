import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-pokemos-detail',
  templateUrl: './pokemos-detail.page.html',
  styleUrls: ['./pokemos-detail.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PokemosDetailPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
