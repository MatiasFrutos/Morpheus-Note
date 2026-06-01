<p align="center">
  <img src="./frontend/public/morpheus-note-icon.png" alt="Morpheus Note Logo" width="150" />
</p>

<h1 align="center">🌙 Morpheus Note</h1>

<p align="center">
  <strong>Mensajes que despiertan en el momento correcto.</strong>
</p>

<p align="center">
  Creá notas dormidas, programá cuándo se revelan y compartilas por código, link o QR.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/✨%20Estado-MVP%20funcional-635BFF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/🚀%20Sin%20login-Rápido%20y%20simple-06B6D4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/🗄️%20PostgreSQL-pgAdmin-4169E1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/🎯%20Experiencia-Interactiva-16A34A?style=for-the-badge" />
</p>

---

## ✨ Concepto

**Morpheus Note** es una aplicación web pública y sin login para crear mensajes que no se revelan inmediatamente.

El usuario crea una nota, define cuándo puede abrirse y la comparte mediante:

- 🔐 Código único.
- 🔗 Link directo.
- 📲 Código QR.

Hasta que llega el momento correcto, la nota permanece dormida.

Cuando despierta, el mensaje se muestra como una experiencia visual, con animaciones, páginas, imagen opcional y pistas progresivas.

---

## 🌙 Idea principal

> No todo mensaje necesita leerse ahora.  
> Algunos mensajes necesitan esperar su momento.

Morpheus Note convierte una nota común en una experiencia temporal:

- ✍️ Escribís el mensaje.
- 📅 Elegís fecha y hora.
- 🖼️ Podés agregar una imagen.
- 📖 Podés dividir el mensaje en páginas.
- 🧩 Podés sumar pistas progresivas.
- 🔑 Podés protegerlo con palabra clave.
- 📲 Lo compartís por QR, link o código.
- ⏳ La nota espera.
- 🌅 La nota despierta.

---

## 🚀 Características principales

### 🌘 Mensajes dormidos

Las notas permanecen bloqueadas hasta la fecha y hora configuradas.

### ⚡ Sin login

La experiencia está pensada para ser rápida, pública y sin fricción.

### 🔐 Código público

Cada nota genera un código único para abrirla.

### 🔗 Link compartible

Cada nota puede abrirse desde un enlace directo.

### 📲 QR automático

El sistema genera un código QR listo para compartir, imprimir o enviar.

### 📖 Mensaje paginado

El mensaje final puede dividirse en varias páginas, como una presentación interactiva.

### 🖼️ Imagen opcional

La nota puede incluir una imagen para acompañar el mensaje cuando despierte.

### 🧩 Pistas progresivas

Antes de que la nota despierte, pueden aparecer pistas configuradas por tiempo.

### ✅ Multiple choice

Cada pista puede tener opciones de respuesta y solo dos intentos.

### ⏳ Vencimiento configurable

La nota puede expirar después de un período definido.

### 🔥 Lectura única

Opcionalmente, una nota puede quedar bloqueada después de abrirse una vez.

---

## 🎬 Experiencia de uso

✍️ Crear nota  
→ 📅 Programar fecha y hora  
→ 🖼️ Agregar imagen o páginas  
→ 🧩 Activar pistas opcionales  
→ 📲 Compartir código, link o QR  
→ ⏳ Esperar el momento correcto  
→ 🌅 Despertar la nota  

---

## 🧩 Pistas progresivas

Las pistas progresivas convierten la espera en parte de la experiencia.

Una nota puede liberar pistas antes de despertar:

- ✨ Pista inicial.
- 📅 Pista 24 horas antes.
- 🕕 Pista 6 horas antes.
- ⏰ Pista 1 hora antes.

Cada pista puede tener una pregunta con opciones.

La persona que intenta resolverla dispone de dos intentos.

Esto permite crear experiencias para:

- 🎁 Sorpresas.
- 🎮 Juegos.
- 💌 Invitaciones.
- 🧠 Recuerdos.
- ✨ Mensajes personales.
- 🗺️ Búsquedas simbólicas.
- 🎉 Eventos privados.

---

## 📲 Compartir como experiencia

Morpheus Note no solo genera una nota.

Genera una pequeña pieza interactiva para compartir.

Cada nota puede entregarse como:

- 🔐 Código.
- 🔗 Link.
- 📲 QR.
- 🖼️ Mensaje visual.
- 📖 Presentación paginada.
- 🧩 Juego de pistas.

La idea es que abrir una nota no sea solo leer texto, sino vivir un momento.

---

## 🎯 Casos de uso

### 🎁 Sorpresas personales

Crear una nota para revelar un mensaje en una fecha especial.

### 🎮 Juegos entre amigos

Compartir pistas progresivas antes de liberar el mensaje final.

### 💌 Invitaciones

Enviar un QR con una nota que se desbloquea en un momento específico.

### 🪞 Mensajes al futuro

Escribir una nota para una versión futura de uno mismo.

### 🖼️ Recuerdos

Guardar un mensaje con imagen y abrirlo cuando llegue el momento indicado.

### 🎉 Eventos

Crear mensajes secretos, pistas o accesos simbólicos para encuentros privados.

---

## 🛠️ Stack técnico

### 🎨 Frontend

- HTML.
- CSS.
- JavaScript Vanilla.
- Lucide Icons.
- QRCode.js.
- Diseño responsive.
- Animaciones CSS.
- Interfaz clara y moderna.

### ⚙️ Backend

- Node.js.
- Express.
- PostgreSQL.
- pg.

### 🗄️ Base de datos

- PostgreSQL.
- Compatible con pgAdmin.

---

## 🧠 Módulos principales

### ✍️ Crear nota

Permite configurar el contenido principal de la experiencia.

Incluye:

- Título.
- Fecha.
- Hora.
- Páginas del mensaje.
- Imagen opcional.
- Configuración de acceso.
- Pistas progresivas opcionales.

### 🔐 Abrir nota

Permite intentar despertar una nota mediante código y palabra clave.

### 🌘 Nota dormida

Muestra el estado de espera, cuenta regresiva y pistas disponibles.

### 🌅 Nota despierta

Muestra el mensaje final en formato paginado, con imagen si fue cargada.

### ⏳ Nota expirada

Indica que la nota ya no está disponible.

---

## 🎨 Identidad visual

Morpheus Note usa una estética clara, moderna y suave.

La interfaz está pensada para sentirse:

- ✨ Simple.
- 🤝 Amigable.
- 🎨 Visual.
- 💭 Emocional.
- ⚡ Ligera.
- 📱 Responsive.
- 🌙 Cercana al usuario final.

El icono combina la idea de:

- 🌙 Morfeo.
- 💭 Sueño.
- 🏛️ Filosofía.
- ✉️ Mensajes.
- ⏳ Tiempo.

---

## ✨ Detalles visuales

La experiencia incluye:

- Iconografía moderna con Lucide.
- Animaciones suaves.
- Estados visuales para notas dormidas, despiertas y expiradas.
- Presentación clara del código, link y QR.
- Cards livianas.
- Interfaz responsive.
- Flujo simple y orientado al usuario final.

---

## 📌 Estado del proyecto

Morpheus Note se encuentra en etapa **MVP funcional**.

El objetivo principal es demostrar una experiencia original de mensajería temporal sin login, combinando:

- Mensajes programados.
- QR automático.
- Pistas progresivas.
- Multiple choice.
- Imagen opcional.
- Presentación paginada.
- Interacción visual.

---

## 🧭 Próximas mejoras posibles

- 📍 Modo ubicación.
- 🎙️ Audio opcional.
- 🌐 Vista pública de notas dormidas.
- 🧵 Modo historia.
- 🎂 Plantillas para cumpleaños, eventos y mensajes al futuro.
- 📲 Exportación visual del QR.
- 🕯️ Modo lectura ceremonial.
- 🖼️ Mejor compresión de imágenes.
- ☁️ Storage externo para archivos.
- 🧑‍💼 Panel de administración opcional.

---

## 👤 Autor

Desarrollado por **Matias Isaac Frutos Gonzalez**.

Proyecto conceptual, técnico y visual orientado a experiencias digitales simples, públicas y memorables.

---

## © Derechos reservados

© 2026 Matias Isaac Frutos Gonzalez.  
Todos los derechos reservados.
