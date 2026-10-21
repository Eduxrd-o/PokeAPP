import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Pokemon {
  private url = 'https://pokeapi.co/api/v2';
  constructor(private http: HttpClient) {}

  getPokemons(limit: number = 20, offset: number = 0): Observable<any> {
    return this.http.get(`${this.url}/pokemon?limit=${limit}&offset=${offset}`);
  }

  pokemonDetails(nameOrId: string): Observable<any> {
    return this.http.get(`${this.url}/pokemon/${nameOrId}`);
  }

  pokemonAbilities(nameOrId: string): Observable<any> {
    return this.http.get(`${this.url}/ability/${nameOrId}`);
  }

  pokemonSpecies(nameOrId: string): Observable<any> {
    return this.http.get(`${this.url}/pokemon-species/${nameOrId}`);
  }

  // Corrige la ruta: PokeAPI no tiene el endpoint /pokemon-sprites/.
  // Los sprites se obtienen de /pokemon/{nameOrId} y los transformamos
  // para entregar la galería de más de 5 imágenes y el GIF animado.
  pokemonSprites(nameOrId: string): Observable<any> {
    return this.pokemonDetails(nameOrId).pipe(
      map((details) => {
        const sprites = details.sprites;
        const gallery = [
          { label: 'Oficial', url: sprites.other?.['official-artwork']?.front_default },
          { label: 'Frente', url: sprites.front_default },
          { label: 'Espalda', url: sprites.back_default },
          { label: 'Shiny Frente', url: sprites.front_shiny },
          { label: 'Shiny Espalda', url: sprites.back_shiny },
          { label: '3D Home', url: sprites.other?.home?.front_default },
        ].filter((img) => Boolean(img.url));

        const gif =
          sprites.other?.showdown?.front_default ||
          sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
          null;

        const main =
          sprites.other?.['official-artwork']?.front_default ||
          sprites.front_default;

        return {
          main,
          gif,
          gallery,
          raw: sprites,
        };
      })
    );
  }

  pokemonType(nameOrId: string): Observable<any> {
    return this.http.get(`${this.url}/type/${nameOrId}`);
  }  

  pokemonEvolutionChain(nameOrId: string): Observable<any> {
    return this.http.get(`${this.url}/evolution-chain/${nameOrId}`);
  }

  pokemonItems(nameOrId: string): Observable<any> {
    return this.http.get(`${this.url}/item/${nameOrId}`);
  }

  pokemonSound(audioUrl: string) {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => console.warn('Error al reproducir audio:', err));
    }
  }
}

