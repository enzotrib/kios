# KIOS — El instalador para Windows

Documento de funcionamiento del paquete descargable: qué es, cómo está armado,
en qué versiones de Windows corre, qué pasa cuando algo sale mal, qué se revisó
en materia de seguridad y por qué cada decisión terminó siendo la que es.

Está escrito para poder retomar el trabajo dentro de seis meses sin tener que
reconstruir el razonamiento, y para que cualquier otra persona que agarre el
repositorio entienda dónde están los cables.

---

## 1. Qué recibe el usuario

Un solo archivo: **`KIOS-1.0.0-setup.exe`**, de unos **127 MB**.

Lo descarga, lo ejecuta, sigue un asistente en castellano, crea su propia
contraseña, y termina con KIOS abierto y funcionando. No instala XAMPP, ni
Apache, ni MySQL, ni PHP. No configura nada. No hay una sola pantalla que le
pida un dato técnico.

Adentro del `.exe` viaja todo: el intérprete de PHP, el motor de la aplicación,
la base de datos y la ventana que la muestra.

---

## 2. Cómo está armado

Cuatro piezas apiladas:

| Pieza | Qué hace |
|---|---|
| **Laravel + React** | La aplicación de siempre, la misma que corre en la web |
| **NativePHP Desktop 2.2.1** | Empaqueta PHP, levanta un servidor local y lo conecta con Electron |
| **Electron 38.5** | La ventana: un Chromium que muestra la aplicación sin barra de direcciones |
| **electron-builder + NSIS** | Arma el `.exe` instalador |

Cuando el usuario abre KIOS, por dentro arranca un servidor PHP que escucha en
`127.0.0.1` en un puerto al azar, y la ventana de Electron le pide las páginas
a ese servidor. Es la misma aplicación web, sin internet y sin navegador a la
vista.

**El servidor escucha sólo en `127.0.0.1`.** No es accesible desde la red del
comercio ni desde afuera. Es un detalle importante y está verificado.

### Dónde queda cada cosa

| Qué | Dónde |
|---|---|
| El programa | `%LOCALAPPDATA%\Programs\kios\` |
| La base de datos | `%APPDATA%\kios\database\database.sqlite` |
| Imágenes, recibos, adjuntos | `%APPDATA%\kios\storage\` |
| La clave de cifrado | `%APPDATA%\kios\storage\app\clave-de-aplicacion` |

La separación no es cosmética: **el programa se puede borrar y reinstalar sin
tocar los datos**. Desinstalar y volver a instalar no borra las ventas.

### La base de datos: SQLite, no MySQL

En la web KIOS usa MySQL. En el escritorio usa SQLite, que es un archivo. No
hay un servicio que instalar, ni un puerto que abrir, ni un usuario y una
contraseña de base de datos que alguien tenga que inventar.

Esto obligó a revisar que el SQL de la aplicación no dependiera de MySQL. Se
revisaron las 21 migraciones, los seeders y las consultas de los controladores.
**Apareció un solo problema real**, en la consulta del POS que ordena las
colecciones:

```sql
-- MySQL lo acepta; SQLite lee "category" como el nombre de una columna
CASE WHEN collection_type = "category" THEN 1 ...
```

En SQLite las comillas dobles delimitan identificadores, no texto. La consulta
no fallaba: devolvía un orden equivocado, en silencio. Se pasó a comillas
simples, que es lo que dice el estándar y que los dos motores entienden igual.

---

## 3. Versiones de Windows que soporta

Lo define Electron 38, que va con Chromium 140:

| Versión | Soporte |
|---|---|
| **Windows 11** (cualquiera) | Sí |
| **Windows 10 de 64 bits, 1809 (build 17763) o posterior** | Sí |
| Windows 10 de 32 bits | No — el paquete es x64 |
| Windows 10 anterior a 1809 | No |
| Windows 8.1, 8, 7 | No — Electron los dejó de soportar en la versión 23 |
| Windows Server 2019 y 2022 | Sí, aunque no es el escenario pensado |

En la práctica: **cualquier máquina que haya recibido actualizaciones de
Windows en los últimos años**. Una PC de kiosco con Windows 10 al día entra sin
problema.

Se instala **para el usuario, sin pedir permisos de administrador**. Una PC de
comercio muchas veces tiene una cuenta sin privilegios, y pedir la contraseña
de administrador es exactamente el momento en que la instalación se frena y
queda para otro día.

---

## 4. El asistente de instalación

Son dos asistentes distintos y conviene no confundirlos.

**El primero es el de Windows** (NSIS): la ventana que copia los archivos. Está
configurado así:

- **Asistido, no silencioso.** Muestra el progreso y avisa antes de reemplazar
  una versión ya instalada (ver la sección 5), en vez de hacerlo callado.
- **No pregunta la carpeta.** Una decisión menos para alguien que sólo quiere
  vender en su kiosco.
- **En castellano** (`es_ES`, código de idioma 1034).
- **Abre KIOS al terminar.**
- **Con nuestras imágenes**, no la azul genérica de NSIS.

**El segundo es el de KIOS**, y aparece la primera vez que se abre el programa:
nombre del comercio, dirección, moneda, y el usuario y contraseña del
administrador. Cuando termina, ya hay un producto y un proveedor de prueba
cargados para poder vender algo en el acto.

### Las imágenes

NSIS trae de fábrica un fondo azul con una flecha y unas formas geométricas que
no tienen nada que ver con el producto. Se reemplazó por tres imágenes propias,
generadas desde el ícono de KIOS:

| Archivo | Medida | Dónde aparece |
|---|---|---|
| `installerSidebar.bmp` | 164×314 | Franja lateral de bienvenida y de cierre |
| `installerHeader.bmp` | 150×57 | Encabezado de las pantallas del medio |
| `uninstallerSidebar.bmp` | 164×314 | Desinstalador |

Están en `resources/installer/`. Tienen que ser **BMP de 24 bits sin comprimir**
y respetar esas medidas exactas: con cualquier otro formato NSIS corta la
compilación.

electron-builder las busca en la carpeta `build/` del proyecto de Electron, que
vive dentro de `vendor/` y se regenera con cada `composer update`. Por eso las
copia `scripts/instalador-windows.php`, que corre **antes de cada compilación**
y también después de un `composer install`. Sin eso, las imágenes propias se
pierden la primera vez que alguien actualiza las dependencias, y nadie se entera
hasta ver el instalador ya publicado.

Un detalle que se notaba: el ícono tiene su propio cuadro de fondo. Sobre un
lienzo de otro color se veía el borde del cuadro. El color se muestrea del
propio ícono —`rgb(11, 11, 11)`— y el cuadro desaparece.

### Todo en castellano

El asistente de KIOS son 9 pantallas. Se tradujeron **las 109 frases visibles**,
una por una, revisando cada archivo entero. Traducir "por muestreo" —abrir el
asistente, ver qué quedó en inglés, arreglar eso— deja siempre un resto:
mensajes de error que sólo aparecen cuando algo falla, textos de ayuda que están
abajo de todo, el nombre de un botón que sólo se ve en un caso.

También se sacó la marca ajena: el asistente venía de InfoShop y decía InfoShop.

### Sin internet

El asistente cargaba Tailwind y Alpine desde CDN. Un comercio con la conexión
caída —o una PC que todavía no tiene wifi configurado, que es el caso normal el
día que se instala algo— veía el asistente sin estilos y sin funcionar.

Ahora los dos archivos son locales. El CSS es `public/css/installer.css`: 176
clases reimplementadas con los tokens de KIOS, con tema claro y oscuro. **La
instalación completa funciona sin conexión.**

---

## 5. Si el usuario reinstala estando ya instalado

Es una pregunta razonable y la respuesta es que **sí, avisa** — pero hubo que
agregarlo.

De fábrica, el instalador de electron-builder detecta la versión anterior y la
reemplaza **sin decir nada**. Sí avisa si KIOS está abierto ("KIOS está activa.
Haz clic en Aceptar para cerrarla"), y la cierra él mismo en vez de fallar a
mitad de camino dejando archivos mezclados de dos versiones. Pero de la
instalación previa, ni una palabra.

Alguien que reinstala sin acordarse de que ya lo tenía se queda con la duda de
si acaba de borrar las ventas del comercio. Así que ahora, antes de tocar nada,
aparece:

> Ya hay una versión de KIOS instalada en esta computadora.
>
> Si continuás, se reemplaza por esta.
>
> Tus datos no se tocan: las ventas, los productos, los clientes y los usuarios
> quedan como están.
>
> Aceptar para actualizar, Cancelar para salir.

Está en `resources/installer/installer.nsh`. electron-builder incluye ese
archivo solo, por el nombre, si aparece en la carpeta `build/` del proyecto de
Electron: lo copia el mismo script que copia las imágenes.

**Y es verdad que los datos no se tocan.** Viven en `%APPDATA%\kios` y el
instalador escribe en `%LOCALAPPDATA%\Programs\kios`. Reinstalar es reemplazar
el programa; las ventas, los productos y los usuarios siguen donde estaban. Al
abrir, KIOS ve que ya está instalado y va derecho al login, sin repetir el
asistente.

Para empezar de cero hay que borrar la carpeta de datos a mano. Es a propósito:
no puede haber un botón fácil que borre la facturación de un comercio.

---

## 6. Qué pasa cuando algo sale mal

### La base de datos se corrompe

Es el escenario realista en un kiosco: se corta la luz con una venta a medio
grabar. SQLite es un archivo, y un archivo a medio escribir queda inconsistente.

Al instalar, KIOS revisa el archivo antes de usarlo:

1. Verifica los primeros 16 bytes, que en un archivo SQLite válido dicen siempre
   `SQLite format 3`. Hizo falta porque `PRAGMA integrity_check` responde `ok`
   ante un archivo diminuto con basura adentro.
2. Corre `PRAGMA integrity_check`.
3. Si algo no cierra, **aparta el archivo dañado con una copia de respaldo** y
   arranca uno limpio.
4. Si la migración falla igual por corrupción, aparta y reintenta una vez.

Apartar el archivo tiene una vuelta de tuerca de Windows: `rename()` sobre un
archivo abierto **devuelve `false` sin decir nada**. La recuperación parecía
funcionar y no recuperaba. Se reprodujo el caso y se resolvió cerrando la
conexión, copiando a un respaldo y **vaciando el archivo en su lugar** en vez de
renombrarlo, verificando después que quedó en cero bytes.

Hay cinco pruebas automatizadas que cubren esto, incluida la de la conexión
abierta.

### No hay usuario y no se puede entrar

Pasó de verdad: la aplicación abría directo en el login, sin ningún usuario
creado, y no había forma de entrar. Sin barra de direcciones no se puede
escribir `/install` a mano. El usuario queda encerrado.

Se resolvió por el lado correcto: **si no hay una cuenta usable, la aplicación
no está instalada**, aunque figure la marca de instalado. Cualquier pantalla
lleva al asistente. El acceso está garantizado por construcción, no por
acordarse de un caso.

### Los registros

Cuando algo falla, el detalle queda en:

```
%APPDATA%\kios\storage\logs\laravel-AAAA-MM-DD.log
```

El paso de preparación de la base deja anotado qué conexión usó, qué ruta, si el
archivo existía y cuántos bytes tenía. Sin eso, un problema de base de datos en
la máquina de otra persona es indiagnosticable.

---

## 7. Revisión de seguridad

Se revisó el paquete descargable como si fuera de otro: abriendo el `.exe` ya
compilado y mirando qué había adentro.

### Lo que se encontró y se corrigió

**1. La clave de cifrado viajaba adentro del paquete.** *(Grave)*

Todas las copias salen del mismo instalador, así que todas compartían la misma
clave, y el repositorio es público. Cualquiera que abriera el instalador podía
firmar cookies de sesión válidas para la instalación de cualquier otro comercio.

Corregido: la clave se sacó del paquete y la genera la aplicación en el primer
arranque en la máquina del comercio, distinta por instalación. Se guarda junto a
la base, en la carpeta de datos del usuario. En la web no cambia nada: ahí la
escribe el asistente en el `.env`.

**2. El paquete llevaba mis credenciales de desarrollo.** *(Grave)*

El usuario y la contraseña de mi base local y los datos del correo saliente
viajaban en el `.env` empaquetado. En el escritorio ni se usan —la conexión
apunta al SQLite propio—, así que sólo servían para regalarlas.

Corregido: se excluyen del paquete.

**3. Cuatro rutas del asistente quedaban abiertas después de instalar.** *(Grave
en la versión web)*

El asistente no pide credenciales, no puede: se usa cuando todavía no hay ningún
usuario. Terminada la instalación, sus rutas seguían accesibles. La peor era
`/install/database/save`, que reescribe las credenciales de la base en el `.env`
sin preguntar nada: en un comercio publicado en un dominio, cualquiera podía
apuntar la aplicación a una base suya y quedarse con el sistema.
`/install/database/test` dejaba usar el servidor del comercio para probar
credenciales de MySQL contra cualquier host, y `/install/settings/save`
reescribía nombre, URL y zona horaria.

En el escritorio el alcance es menor, porque el servidor sólo escucha en
`127.0.0.1`. En la web, no.

Corregido: el corte va sobre el grupo entero de rutas, no método por método
—así fue como quedaron sin cubrir cuatro de trece—. La única excepción es la
pantalla final, habilitada por una marca de sesión que deja el propio proceso de
instalación.

**4. El registro público de usuarios estaba abierto.** *(Corregido antes)*

`/register` y `/api/auth/register` permitían que cualquiera se diera de alta con
acceso al POS. Ahora está apagado por defecto y se enciende con
`REGISTRATION_ENABLED=true`, para la versión en la nube. En un comercio los
usuarios los crea el administrador.

### Lo que se revisó y está bien

- **El servidor escucha sólo en `127.0.0.1`.** No es accesible desde la red.
- **`APP_DEBUG` va en `false`** en el paquete. Con `true`, además del riesgo de
  filtrar rutas y configuración en las pantallas de error, la aplicación
  directamente no arranca (ver más abajo).
- **Las contraseñas se guardan con bcrypt**, 12 vueltas.
- **La ruta destructiva del asistente está protegida.** `/install/process` corre
  `migrate:fresh` —borra todo— y ya verificaba que la aplicación no estuviera
  instalada.
- **La contraseña del administrador la elige el usuario**, mínimo 8 caracteres,
  con confirmación. No hay ninguna contraseña por defecto ni ningún usuario de
  fábrica.

### Lo que queda pendiente y hay que decir

**El instalador no está firmado.** Windows muestra el aviso de SmartScreen
("Windows protegió su PC") y hay que hacer clic en "Más información" → "Ejecutar
de todas formas". Para publicarlo en serio hacen falta:

- un certificado de firma de código (SignPath lo da gratis a proyectos de código
  abierto con repositorio público, que es el caso), o
- publicarlo en la Microsoft Store.

Mientras no esté firmado, **una parte de la gente que lo descargue no lo va a
instalar**. Es el punto más importante de la lista.

**Los datos no están cifrados en disco.** La base SQLite se puede abrir con
cualquier visor de SQLite por alguien con acceso a la máquina. Es lo normal en
una aplicación de escritorio —el modelo de amenaza es quien tiene la PC—, pero
conviene saberlo antes de que alguien lo pregunte.

---

## 8. Bitácora: qué costó que funcione

Esta sección existe porque la mayor parte del trabajo no fue escribir el
instalador, sino encontrar por qué no andaba. Sin esto, el próximo que toque
esto repite los mismos días.

### PHP 8.4 al lado de XAMPP

El paquete de NativePHP trae PHP 8.4. XAMPP tiene 8.2.12, que además queda sin
soporte el 31/12/2026. Se instaló 8.4.25 al lado, en `C:\xampp\php84`, sin tocar
el de XAMPP.

Cargarlo como módulo de Apache falló con `ERROR_PROC_NOT_FOUND`: el Apache de
XAMPP es de octubre de 2023 y no conoce los símbolos de 8.4. Apache siguió con
8.2 y el desarrollo pasó a `artisan serve` con 8.4. Compilar con el PHP
equivocado rompe de formas que no se entienden, así que el `PATH` se antepone
explícitamente.

También hizo falta activar el **Modo de desarrollador** de Windows: la
compilación crea enlaces simbólicos y sin eso corta con `Cannot create symbolic
link`.

### Pantalla negra, primera vez

La aplicación instalaba, abría, y mostraba una ventana negra.

Causa: `APP_DEBUG=true` viajaba en el paquete. **NativePHP no reescribe las
rutas de almacenamiento ni de base de datos cuando el modo de depuración está
encendido.** Las dos quedaban apuntando adentro de la carpeta del programa, de
sólo lectura para un usuario normal, y la aplicación moría apenas intentaba
escribir una sesión.

Corregido sacando `APP_ENV`, `APP_DEBUG` y `APP_URL` del paquete, para que
Laravel use sus valores por defecto. Es una de esas dependencias que no está
escrita en ningún lado y se descubre a los golpes.

### La base se corrompía sola

Después de instalar, la base quedaba inutilizable con `SQLSTATE[HY000]: General
error: 11 database disk image is malformed`, siempre.

Causa: NativePHP arranca un worker de colas por defecto, que escribía en el
mismo archivo SQLite mientras corrían las migraciones. Dos procesos escribiendo
el mismo archivo.

Corregido dejando la lista de workers vacía. KIOS no usa colas: la cola está en
`sync`, todo se procesa en el momento.

### Pantalla negra, segunda vez — la que costó

Volvió la pantalla negra después de que la primera versión empaquetada ya
funcionaba.

Estuve un buen rato mirando el asistente, convencido de que el problema estaba
ahí. **No estaba.** El archivo `public/hot`, de 17 bytes, se estaba empaquetando.

Ese archivo es la marca que deja el servidor de desarrollo de Vite. Cuando
existe, Laravel manda el JavaScript a buscar a `http://[::1]:5173` en vez de a
los archivos compilados. En la máquina del usuario ese servidor no existe. El
HTML llegaba bien —respondía 200, con el `<div id="app">` y todo— pero sin una
sola línea de JavaScript. Una página en blanco, técnicamente correcta.

La fecha del archivo, 29/8 01:09, caía justo entre la versión que funcionaba y
las que no.

Corregido: la preparación previa a cada compilación borra `public/hot` antes de
compilar. Y quedó una lección de método: cuando alguien dice "la primera versión
andaba", esa es la pista más valiosa que hay, no una impresión a descartar.

### Dos compilaciones a la vez

Error mío: lancé dos compilaciones simultáneas. Se pisaron y destruyeron los
`node_modules` de Electron (`cross-env` no reconocido como comando). **Una sola
compilación por vez.**

---

## 9. Cómo se compila

```bash
# Con PHP 8.4 al frente del PATH, no el de XAMPP
export PATH="/c/xampp/php84:$PATH"
php artisan native:build win x64
```

Queda en `nativephp/electron/dist/KIOS-1.0.0-setup.exe`.

Antes de compilar corre sola la preparación previa:

1. Borrar `public/hot` — si queda, la aplicación abre en negro.
2. `php scripts/instalador-windows.php` — configuración e imágenes del
   instalador, que viven en `vendor/` y se pierden con cada `composer update`.
3. `npm run build` — compilar el front.
4. `php artisan view:cache` — arranque más rápido.

**Una compilación por vez.**

---

## 10. Lo que sigue

Por orden de importancia:

1. **Firmar el instalador.** Es lo que más frena descargas hoy. SignPath es
   gratis para proyectos de código abierto con repositorio público.
2. **Actualizaciones automáticas.** Hoy, para actualizar, hay que descargar y
   reinstalar. Electron tiene el mecanismo; falta un lugar donde publicar.
3. **Respaldo de la base a un clic**, desde adentro de la aplicación. Los datos
   de un comercio viven en un solo archivo y no hay copia de seguridad.
4. **El aviso del enlace de `public/storage`** durante el empaquetado: afecta a
   las imágenes subidas que quedan adentro del paquete.
5. Unos 104 mensajes en inglés que todavía quedan en los controladores de PHP
   —los avisos de "guardado", "eliminado" y demás—, y tres pantallas de acceso
   que siguen con el diseño original de Breeze.
