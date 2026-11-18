import { Service, computed, signal } from '@angular/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { Motion } from '@capacitor/motion';

/** Gravedad estándar en m/s². */
const GRAVEDAD = 9.81;

/** Factor del filtro paso bajo: valores bajos suavizan más la lectura. */
const SUAVIZADO = 0.2;

/** Inclinación (en grados respecto al plano de la mesa) por debajo de la cual el celular se considera acostado. */
const LIMITE_PLANO = 25;

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Rotacion {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface Posicion {
  nombre: string;
  descripcion: string;
  icono: 'phone-portrait-outline' | 'phone-landscape-outline' | 'layers-outline';
  /** Rotación extra (en grados) que se aplica al ícono para representar la posición. */
  giroIcono: number;
}

type PermisoSensor = { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * Lee el acelerómetro y el giroscopio del dispositivo con `@capacitor/motion`
 * y expone las lecturas como signals, junto con la posición calculada del celular.
 */
@Service()
export class Sensor {
  private handles: PluginListenerHandle[] = [];

  /** Aceleración incluyendo la gravedad (m/s²), ya suavizada. */
  readonly gravedad = signal<Vector3>({ x: 0, y: 0, z: 0 });

  /** Ángulos del evento `deviceorientation` (grados). */
  readonly rotacion = signal<Rotacion>({ alpha: 0, beta: 0, gamma: 0 });

  readonly activo = signal(false);
  readonly recibiendoDatos = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Giro del celular sobre el plano de la pantalla (grados, -180 a 180).
   * 0 = vertical, 90 = girado a la izquierda, -90 = girado a la derecha, ±180 = de cabeza.
   */
  readonly giro = computed(() => {
    const { x, y } = this.gravedad();
    return Math.round((Math.atan2(x, y) * 180) / Math.PI);
  });

  /** Inclinación respecto a la mesa (grados): 0 = acostado, 90 = de pie. */
  readonly inclinacion = computed(() => {
    const { x, y, z } = this.gravedad();
    const total = Math.hypot(x, y, z) || GRAVEDAD;
    const coseno = Math.min(1, Math.abs(z) / total);
    return Math.round((Math.acos(coseno) * 180) / Math.PI);
  });

  readonly posicion = computed<Posicion>(() => {
    if (!this.recibiendoDatos()) {
      return {
        nombre: 'Sin datos',
        descripcion: 'Esperando lecturas del sensor de movimiento.',
        icono: 'phone-portrait-outline',
        giroIcono: 0,
      };
    }

    if (this.inclinacion() < LIMITE_PLANO) {
      const bocaArriba = this.gravedad().z >= 0;
      return {
        nombre: bocaArriba ? 'Acostado (boca arriba)' : 'Acostado (boca abajo)',
        descripcion: bocaArriba ? 'La pantalla mira hacia el techo.' : 'La pantalla mira hacia el suelo.',
        icono: 'layers-outline',
        giroIcono: 0,
      };
    }

    return this.clasificarGiro(this.giro());
  });

  async iniciar(): Promise<void> {
    if (this.activo()) {
      return;
    }

    this.error.set(null);

    if (!(await this.solicitarPermiso())) {
      this.error.set('No se concedió el permiso para usar los sensores de movimiento.');
      return;
    }

    try {
      this.handles = await Promise.all([
        Motion.addListener('accel', (evento) => {
          const g = evento.accelerationIncludingGravity;
          if (g?.x == null || g.y == null || g.z == null) {
            return;
          }
          const previo = this.gravedad();
          this.gravedad.set({
            x: this.filtrar(previo.x, g.x),
            y: this.filtrar(previo.y, g.y),
            z: this.filtrar(previo.z, g.z),
          });
          this.recibiendoDatos.set(true);
        }),
        Motion.addListener('orientation', (evento) => {
          this.rotacion.set({
            alpha: Math.round(evento.alpha ?? 0),
            beta: Math.round(evento.beta ?? 0),
            gamma: Math.round(evento.gamma ?? 0),
          });
        }),
      ]);
      this.activo.set(true);
    } catch {
      this.error.set('El dispositivo no tiene sensores de movimiento disponibles.');
    }
  }

  async detener(): Promise<void> {
    await Promise.all(this.handles.map((handle) => handle.remove()));
    this.handles = [];
    this.activo.set(false);
  }

  private filtrar(anterior: number, actual: number): number {
    return anterior + SUAVIZADO * (actual - anterior);
  }

  /** Divide el giro en sectores de 45°: vertical, diagonal, horizontal y de cabeza. */
  private clasificarGiro(giro: number): Posicion {
    const absoluto = Math.abs(giro);
    const lado = giro > 0 ? 'izquierda' : 'derecha';
    const signo = giro > 0 ? -1 : 1;

    if (absoluto <= 22.5) {
      return {
        nombre: 'Vertical',
        descripcion: 'El celular está de pie, en modo retrato.',
        icono: 'phone-portrait-outline',
        giroIcono: 0,
      };
    }
    if (absoluto <= 67.5) {
      return {
        nombre: `Diagonal (${lado})`,
        descripcion: `El celular está inclinado hacia la ${lado}.`,
        icono: 'phone-portrait-outline',
        giroIcono: 45 * signo,
      };
    }
    if (absoluto <= 112.5) {
      return {
        nombre: `Horizontal (${lado})`,
        descripcion: `Modo paisaje, girado hacia la ${lado}.`,
        icono: 'phone-landscape-outline',
        giroIcono: 0,
      };
    }
    if (absoluto <= 157.5) {
      return {
        nombre: `Diagonal invertida (${lado})`,
        descripcion: `El celular está casi de cabeza, inclinado hacia la ${lado}.`,
        icono: 'phone-portrait-outline',
        giroIcono: 135 * signo,
      };
    }
    return {
      nombre: 'Vertical invertido',
      descripcion: 'El celular está de cabeza.',
      icono: 'phone-portrait-outline',
      giroIcono: 180,
    };
  }

  /** iOS 13+ exige pedir permiso explícito; Android y la web no lo necesitan. */
  private async solicitarPermiso(): Promise<boolean> {
    if (typeof DeviceMotionEvent === 'undefined') {
      return true;
    }
    const evento = DeviceMotionEvent as unknown as PermisoSensor;
    if (typeof evento.requestPermission !== 'function') {
      return true;
    }
    try {
      return (await evento.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  }
}
