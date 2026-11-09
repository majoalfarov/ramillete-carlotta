import { getStore } from "@netlify/blobs";

// Guarda cada ofrenda como un registro aparte en Netlify Blobs.
// GET    /api/ofrendas            -> lista pública (sin tokens)
// POST   /api/ofrendas            -> crea o actualiza la ofrenda propia (id + token)
// DELETE /api/ofrendas?id=...     -> borra una ofrenda (requiere header x-admin-key = ADMIN_KEY)

const KEYS = ["misas", "rosarios", "comuniones"];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function count(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 9999) : 0;
}

function text(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function validId(v) {
  return typeof v === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(v);
}

function publicView(o) {
  const { token, ...rest } = o;
  return rest;
}

export default async (req) => {
  const store = getStore({ name: "ramillete", consistency: "strong" });

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
    return json(items.filter(Boolean).map(publicView));
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Datos no válidos." }, 400); }

    const id = body.id, token = body.token;
    if (!validId(id) || !validId(token)) return json({ error: "Datos no válidos." }, 400);

    const anonimo = body.anonimo === true;
    const nombre = anonimo ? "" : text(body.nombre, 60);
    const vals = {};
    KEYS.forEach((k) => (vals[k] = count(body[k])));

    if (!anonimo && !nombre) return json({ error: "Escribe tu nombre o marca la opción de anónimo." }, 400);
    if (!vals.misas && !vals.rosarios && !vals.comuniones)
      return json({ error: "Agrega al menos una misa, un rosario o una comunión." }, 400);

    const prev = await store.get(id, { type: "json" });
    if (prev && prev.token !== token) return json({ error: "Esta ofrenda solo se puede editar desde el celular donde se hizo." }, 403);

    const record = {
      id, token, nombre, anonimo, ...vals,
      intencion: text(body.intencion, 280),
      creada: prev?.creada || Date.now(),
      ts: Date.now(),
    };
    await store.setJSON(id, record);
    return json(publicView(record));
  }

  if (req.method === "DELETE") {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey || req.headers.get("x-admin-key") !== adminKey) return json({ error: "Clave incorrecta." }, 401);
    const id = new URL(req.url).searchParams.get("id");
    if (!validId(id)) return json({ error: "Datos no válidos." }, 400);
    await store.delete(id);
    return json({ ok: true });
  }

  return json({ error: "Método no permitido." }, 405);
};

export const config = { path: "/api/ofrendas" };
