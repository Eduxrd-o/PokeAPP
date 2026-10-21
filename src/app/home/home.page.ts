import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonContent,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonRow,
  IonCol,
  IonProgressBar,
  IonGrid,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonAvatar,
} from '@ionic/angular';
import { Pokemon } from '../services/pokemon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  alertCircleOutline,
  volumeHigh,
  trophyOutline,
  flameOutline,
  refreshOutline,
  imagesOutline,
  videocamOutline,
  flashOutline,
  shieldOutline,
  heartOutline,
  speedometerOutline,
  sparklesOutline,
  playOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonContent,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonRow,
    IonCol,
    IonProgressBar,
    IonGrid,
    IonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonAvatar,
  ],
})
export class HomePage implements OnInit {
  seccionActiva: string = 'pokedex';

  pokemonList: any[] = [];
  thisPokemon: any = null;
  isLoading = false;
  errorMessage = '';
  selectedImage: string = '';
  showingGif: boolean = false;

  luchador1: any = null;
  luchador2: any = null;
  cargandoLuchador1 = false;
  cargandoLuchador2 = false;
  resultadoBatalla: string | null = null;
  ganador: any = null;
  peleando = false;

  sugerenciasPelea = ['pikachu', 'charizard', 'mewtwo', 'gengar', 'lucario', 'blastoise', 'eevee'];

  constructor(private pokemon: Pokemon) {
    addIcons({
      closeOutline,
      alertCircleOutline,
      volumeHigh,
      trophyOutline,
      flameOutline,
      refreshOutline,
      imagesOutline,
      videocamOutline,
      flashOutline,
      shieldOutline,
      heartOutline,
      speedometerOutline,
      sparklesOutline,
      playOutline,
    });
  }

  ngOnInit() {
    this.cargarListaInicial();
  }

  cargarListaInicial() {
    this.isLoading = true;
    this.pokemon.getPokemons(20, 0).subscribe({
      next: (res) => {
        this.pokemonList = res.results;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  cambiarSeccion(event: any) {
    this.seccionActiva = event.detail.value;
  }

  buscarPokemon(event: any) {
    const texto = event.target?.value ? event.target.value.toLowerCase().trim() : '';
    this.errorMessage = '';

    if (!texto) {
      this.thisPokemon = null;
      return;
    }

    this.isLoading = true;

    forkJoin({
      details: this.pokemon
        .pokemonDetails(texto)
        .pipe(catchError(() => of(null))),
      species: this.pokemon
        .pokemonSpecies(texto)
        .pipe(catchError(() => of(null))),
      spritesData: this.pokemon
        .pokemonSprites(texto)
        .pipe(catchError(() => of(null))),
    }).subscribe(({ details, species, spritesData }) => {
      this.isLoading = false;

      if (!details) {
        this.thisPokemon = null;
        this.errorMessage =
          'Pokémon no encontrado. Intenta con otro nombre o ID.';
        return;
      }

      let description = 'Descripción no disponible.';
      if (species) {
        const entry =
          species.flavor_text_entries?.find(
            (f: any) => f.language.name === 'es',
          ) ||
          species.flavor_text_entries?.find(
            (f: any) => f.language.name === 'en',
          );
        if (entry) {
          description = entry.flavor_text.replace(/[\n\f]/g, ' ');
        }
      }

      // Consumimos la galería (5+ imágenes) y el GIF desde el servicio pokemonSprites
      const gallery = spritesData?.gallery || [];
      const gifUrl = spritesData?.gif || null;
      const mainImage = spritesData?.main || details.sprites.front_default;

      this.thisPokemon = {
        id: details.id,
        name: details.name,
        image: mainImage,
        gallery: gallery,
        gif: gifUrl,
        types: details.types.map((t: any) => t.type.name),
        stats: details.stats.map((s: any) => ({
          name: s.stat.name,
          value: s.base_stat,
          normalized: s.base_stat / 255,
        })),
        height: details.height / 10,
        weight: details.weight / 10,
        cry: details.cries?.latest,
        description: description,
      };

      // Por defecto mostramos la imagen principal
      this.selectedImage = mainImage;
      this.showingGif = false;
    });
  }

  verDetalleDeLista(name: string) {
    this.buscarPokemon({ target: { value: name } });
  }

  seleccionarImagenGaleria(url: string) {
    this.selectedImage = url;
    this.showingGif = false;
  }

  alternarGif() {
    this.showingGif = !this.showingGif;
  }

  reproducirSonido(audioUrl?: string) {
    const sonido = audioUrl || this.thisPokemon?.cry;
    if (sonido) {
      this.pokemon.pokemonSound(sonido);
    }
  }

  cerrarDetalle() {
    this.thisPokemon = null;
  }

  cargarLuchador(posicion: 1 | 2, nombreOId: string) {
    const texto = nombreOId.toLowerCase().trim();
    if (!texto) return;

    if (posicion === 1) this.cargandoLuchador1 = true;
    else this.cargandoLuchador2 = true;

    this.resultadoBatalla = null;
    this.ganador = null;

    this.pokemon
      .pokemonDetails(texto)
      .pipe(catchError(() => of(null)))
      .subscribe((details) => {
        if (posicion === 1) this.cargandoLuchador1 = false;
        else this.cargandoLuchador2 = false;

        if (!details) return;

        
        const getStat = (statName: string) =>
          details.stats.find((s: any) => s.stat.name === statName)?.base_stat || 50;

        const luchador = {
          id: details.id,
          name: details.name,
          image:
            details.sprites.other?.showdown?.front_default ||
            details.sprites.other?.['official-artwork']?.front_default ||
            details.sprites.front_default,
          hp: getStat('hp'),
          attack: getStat('attack'),
          defense: getStat('defense'),
          speed: getStat('speed'),
          specialAttack: getStat('special-attack'),
          cry: details.cries?.latest,
          types: details.types.map((t: any) => t.type.name),
        };

        if (posicion === 1) {
          this.luchador1 = luchador;
        } else {
          this.luchador2 = luchador;
        }
      });
  }

  iniciarPelea() {
    if (!this.luchador1 || !this.luchador2) return;

    this.peleando = true;
    this.resultadoBatalla = null;
    this.ganador = null;

    setTimeout(() => {
      this.peleando = false;
      
      const poder1 =
        this.luchador1.hp +
        this.luchador1.attack * 1.4 +
        this.luchador1.defense * 1.1 +
        this.luchador1.speed * 1.3;

      const poder2 =
        this.luchador2.hp +
        this.luchador2.attack * 1.4 +
        this.luchador2.defense * 1.1 +
        this.luchador2.speed * 1.3;

      if (poder1 > poder2) {
        this.ganador = this.luchador1;
        this.resultadoBatalla = `¡${this.luchador1.name.toUpperCase()} es el vencedor! Su ofensiva y velocidad superaron la defensa de ${this.luchador2.name}.`;
        this.reproducirSonido(this.luchador1.cry);
      } else if (poder2 > poder1) {
        this.ganador = this.luchador2;
        this.resultadoBatalla = `¡${this.luchador2.name.toUpperCase()} es el vencedor! Su gran poder superó a ${this.luchador1.name}.`;
        this.reproducirSonido(this.luchador2.cry);
      } else {
        this.ganador = null;
        this.resultadoBatalla = '¡INCREIBLEE! Ha sido un empate entre ambos luchadores.';
      }
    }, 1200);
  }

  reiniciarPelea() {
    this.luchador1 = null;
    this.luchador2 = null;
    this.resultadoBatalla = null;
    this.ganador = null;
  }
}

