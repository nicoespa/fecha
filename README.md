# Fecha

**¿Cuándo podemos juntarnos?** — Mandá un link, cada uno pinta cuándo puede en
la semana y el mejor horario aparece solo. Sin chats infinitos de "yo puedo acá".

Inspirado en When2Meet, pero rápido, lindo y en tiempo real.

## Cómo funciona

1. **Creá la junta** — elegís los días y la franja horaria, te da un link.
2. **Pasá el link** — cada uno entra, pone su nombre y pinta su disponibilidad
   arrastrando sobre la grilla (funciona con el dedo en el celular).
3. **Mirá la magia** — la grilla se ilumina donde coinciden y te marca el mejor
   horario, actualizándose en vivo a medida que responde la gente.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Redis** para el estado compartido (Upstash / Vercel KV), con escrituras
  atómicas por participante para que nadie se pise. Sin credenciales, cae a un
  store en memoria para desarrollo.

## Desarrollo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Sin variables de entorno corre con un store en
memoria (los datos viven mientras corra el server).

## Persistencia en producción

La app lee, en este orden, cualquiera de estos pares de variables de entorno:

| Variable URL             | Variable token             |
| ------------------------ | -------------------------- |
| `KV_REST_API_URL`        | `KV_REST_API_TOKEN`        |
| `UPSTASH_REDIS_REST_URL` | `UPSTASH_REDIS_REST_TOKEN` |

Configurá cualquiera de los dos (Vercel KV los inyecta solo al conectar el
store) y listo: el estado pasa a ser persistente y compartido.

## Deploy

Cualquier hosting de Next.js. Pensado para Vercel: importás el repo, conectás
un Redis/KV en la pestaña _Storage_ y deploya.
