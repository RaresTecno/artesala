// src/app/api/import-ics/route.js
import ICAL from "ical.js";

export const runtime = "edge"; // Cloudflare Workers/Edge

function parseICS(icsText) {
  const jcal = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents("vevent") || [];

  const items = vevents.map((sub) => {
    const ev = new ICAL.Event(sub);
    // Fechas
    const start = ev.startDate ? ev.startDate.toJSDate() : null;
    const end = ev.endDate ? ev.endDate.toJSDate() : null;

    // Campos habituales
    return {
      uid: ev.uid || null,
      summary: ev.summary || "",
      description: ev.description || "",
      location: ev.location || "",
      start: start ? start.toISOString() : null,
      end: end ? end.toISOString() : null,
      // Por si necesitas ampliar:
      // organizer: ev.component.getFirstPropertyValue('organizer') || null,
      // attendees: (ev.component.getAllProperties('attendee')||[]).map(p=>p.getFirstValue()),
    };
  });

  return items;
}

export async function POST(req) {
  try {
    let icsText = "";

    const ctype = req.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      const { url, ics } = await req.json();
      if (typeof ics === "string" && ics.trim()) {
        icsText = ics;
      } else if (typeof url === "string" && url.startsWith("http")) {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`No se pudo descargar el ICS (${r.status})`);
        icsText = await r.text();
      } else {
        return new Response(
          JSON.stringify({ error: "Envía { url } o { ics }" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }
    } else {
      // text/plain con el ICS en el body
      icsText = await req.text();
    }

    if (!icsText || !icsText.includes("BEGIN:VCALENDAR")) {
      return new Response(
        JSON.stringify({ error: "Contenido ICS inválido o vacío" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const events = parseICS(icsText);

    // TODO: aquí puedes mapear a tu estructura y guardar en Supabase.
    // Ejemplo orientativo (NO ejecuta nada):
    // for (const ev of events) {
    //   const { start, end } = ev;
    //   const sala_id = 1; // decide la sala según tus reglas
    //   // Inserta cabecera + tramos en tus tablas...
    // }

    return new Response(JSON.stringify({ ok: true, count: events.length, events }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
