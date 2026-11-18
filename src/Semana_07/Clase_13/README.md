# Ionic - Sensores || `SEMANA 07 - CLASE 13 (12|11|2026)`

Se realizó esta práctica en la materia de Desarrollo de Aplicaciones Móviles para demostrar el uso de los **sensores de movimiento** del dispositivo con **Ionic**, **Angular (Standalone Components)** y **Capacitor**. La aplicación **ionic-sensores** lee el acelerómetro y la orientación del celular mediante el plugin `@capacitor/motion` y muestra en pantalla, en tiempo real, si el dispositivo está **vertical**, **horizontal**, en **diagonal**, **de cabeza** o **acostado** (boca arriba / boca abajo), junto con un nivel de burbuja y las lecturas crudas de cada eje.

> **Nota:** en el navegador de escritorio la app muestra _"Sin datos"_ porque no hay sensores físicos. Para ver la demostración se debe ejecutar en un celular Android (o abrir `ionic serve` desde el navegador del celular).

---

## Cómo Instalar y Ejecutar

### Prerrequisitos

Antes de empezar, asegúrate de contar con el entorno base:

| Herramienta                                            | Versión recomendada                                       |
| ------------------------------------------------------ | --------------------------------------------------------- |
| [Node.js](https://nodejs.org/)                         | v20.x o LTS vigente                                       |
| [npm](https://www.npmjs.com/)                          | v10.x o superior                                          |
| [Ionic CLI](https://ionicframework.com/docs/intro/cli) | Incluido en dependencias o global (`npm i -g @ionic/cli`) |
| [Android Studio](https://developer.android.com/studio) | Para compilación y ejecución nativa en Android            |
| [Visual Studio Code](https://code.visualstudio.com/)   | Editor de código recomendado                              |

---

### Pasos

1. **Clona el repositorio y navega al directorio de la clase**

```bash
git clone https://github.com/NW08/Apps_GR1.git
cd Apps_GR1/src/Semana_07/Clase_13
```

_(o `cd src/Semana_07/Clase_13` si ya estás dentro del repositorio)_

2. **Instala las dependencias raíz de la clase**

```bash
npm install
```

3. **Ingresa a la carpeta `ionic-sensores` e instala las dependencias de la aplicación**

```bash
cd ionic-sensores
npm install
```

4. **Ejecuta el servidor de desarrollo local en el navegador**

```bash
npx ionic serve
```

> **Nota:** Se usa `npx` para ejecutar Ionic CLI directamente desde las dependencias del proyecto.

5. **Compila la aplicación para producción**

```bash
npx ionic build
```

6. **Compila y sincroniza con Android Studio (Nativo)**

```bash
npx ionic build
npx cap add android   # solo la primera vez (la carpeta android/ no se versiona)
npx cap sync android
npx cap open android
```

Una vez en Android Studio, ejecuta el proyecto en un dispositivo físico con depuración USB habilitada (los emuladores también permiten simular la rotación desde **Extended controls > Virtual sensors**), o genera el APK desde **Build > Build APK(s)**.

---

## Cómo se Detecta la Posición

- **Plugin `@capacitor/motion`**: escucha los eventos `accel` (acelerómetro, basado en `devicemotion`) y `orientation` (basado en `deviceorientation`). En Android no requiere permisos en el `AndroidManifest.xml`; en iOS 13+ el servicio solicita el permiso con `DeviceMotionEvent.requestPermission()`.
- **Vector de gravedad**: se usa `accelerationIncludingGravity` (m/s²), suavizado con un filtro paso bajo para evitar saltos en la lectura.
- **Inclinación**: ángulo entre la pantalla y la mesa, calculado a partir del eje `z`. Si es menor a 25°, el celular se considera **acostado** (boca arriba si `z > 0`, boca abajo si `z < 0`).
- **Giro sobre la pantalla**: `atan2(x, y)` en grados. Se divide en sectores de 45°:

| Giro              | Posición mostrada              |
| ----------------- | ------------------------------ |
| 0° ± 22.5°        | Vertical                       |
| ± 22.5° – 67.5°   | Diagonal (izquierda/derecha)   |
| ± 67.5° – 112.5°  | Horizontal (izquierda/derecha) |
| ± 112.5° – 157.5° | Diagonal invertida             |
| ± 157.5° – 180°   | Vertical invertido (de cabeza) |

- **Nivel de burbuja**: la burbuja se desplaza según los ejes `x` e `y`, por lo que siempre "flota" hacia el lado más alto del celular y queda al centro cuando está acostado sobre una superficie plana.

---

## Vista General del Proyecto

| Componente / Archivo    | Responsabilidad                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `services/sensor.ts`    | Servicio que registra los listeners de `@capacitor/motion` y expone lecturas, giro, inclinación y posición como _signals_. |
| `home/home.page.*`      | Pantalla principal: posición actual, botón pausar/reanudar, nivel de burbuja y lecturas de orientación y acelerómetro. |
| `app.routes.ts`         | Ruta `home` con carga diferida (`loadComponent`).                                                         |
| `main.ts`               | Arranque de la aplicación standalone (zoneless) con `provideIonicAngular` y el router.                   |
| `capacitor.config.ts`   | Configuración de Capacitor (`io.ionic.starter`) con directorio web `www`.                                 |
| `e2e/app.spec.ts`       | Prueba end-to-end básica que verifica que la pantalla principal cargue.                                   |

---

## Autor

Desarrollado por:

- **Ortiz Josué** · EPN · Periodo 2026B
