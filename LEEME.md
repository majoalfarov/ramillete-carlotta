# Ramillete espiritual para Carlotta

Página pública donde cualquiera ofrece misas, rosarios y comuniones por Carlotta (con su nombre o de forma anónima) y se suma el total.

## Cómo publicarlo en Netlify

Necesita subirse con GitHub o con la terminal. Arrastrar la carpeta a Netlify Drop NO funciona, porque Drop no activa la función que guarda las ofrendas.

### Opción A: con GitHub
1. Crea un repositorio nuevo en GitHub y sube todo el contenido de esta carpeta.
2. En Netlify: Add new site → Import an existing project → GitHub → elige el repositorio.
3. Deja la configuración como viene (Netlify lee `netlify.toml`) y dale Deploy.

### Opción B: con la terminal
```
npm install -g netlify-cli
cd ramillete-carlotta
npm install
netlify login
netlify deploy --prod
```

## Cambiar el link
En Netlify: Site configuration → Change site name → por ejemplo `ramillete-carlotta`. Te queda `ramillete-carlotta.netlify.app`.

## Borrar una ofrenda (si alguien se equivoca)
1. En Netlify: Site configuration → Environment variables → agrega `ADMIN_KEY` con una clave que solo tú sepas.
2. Vuelve a publicar (Deploys → Trigger deploy).
3. Abre tu link agregando `#admin` al final, por ejemplo `ramillete-carlotta.netlify.app/#admin`.
4. Escribe tu clave y toca "Borrar" dos veces en la ofrenda que quieras quitar.

## Notas
- Cada persona puede actualizar su ofrenda solo desde el mismo celular y navegador donde la hizo.
- Si alguien marca "anónimo", su nombre no se guarda.
- La página se actualiza sola cada 30 segundos.
