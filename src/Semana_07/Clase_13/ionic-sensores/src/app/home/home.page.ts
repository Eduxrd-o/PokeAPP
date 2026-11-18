import type { OnDestroy, OnInit } from '@angular/core';
import { Component, computed, inject } from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  compassOutline,
  layersOutline,
  pauseOutline,
  phoneLandscapeOutline,
  phonePortraitOutline,
  playOutline,
  speedometerOutline,
} from 'ionicons/icons';

import { Sensor } from '../services/sensor';

/** Radio (px) que puede recorrer la burbuja del nivel. */
const RADIO_NIVEL = 70;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonText,
    IonTitle,
    IonToolbar,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  protected readonly sensor = inject(Sensor);

  /** Posición de la burbuja: siempre "flota" hacia el lado más alto del celular. */
  protected readonly burbuja = computed(() => {
    const { x, y } = this.sensor.gravedad();
    let dx = (x / 9.81) * RADIO_NIVEL;
    let dy = (-y / 9.81) * RADIO_NIVEL;
    const distancia = Math.hypot(dx, dy);
    if (distancia > RADIO_NIVEL) {
      dx = (dx / distancia) * RADIO_NIVEL;
      dy = (dy / distancia) * RADIO_NIVEL;
    }
    return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  });

  constructor() {
    addIcons({
      compassOutline,
      layersOutline,
      pauseOutline,
      phoneLandscapeOutline,
      phonePortraitOutline,
      playOutline,
      speedometerOutline,
    });
  }

  ngOnInit(): void {
    void this.sensor.iniciar();
  }

  ngOnDestroy(): void {
    void this.sensor.detener();
  }

  protected alternar(): void {
    void (this.sensor.activo() ? this.sensor.detener() : this.sensor.iniciar());
  }
}
