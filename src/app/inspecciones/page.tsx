import { LoadingState } from "@/components/loading-state";
import { inspections } from "@/lib/data/inspections";

async function getInspections() {

  //si se pone una API en un futuro

  return inspections;
}

export default async function InspeccionesPage() {
  let data;

  try {
    data = await getInspections();
  } catch (error) {
    return <LoadingState status="error" message="No se pudieron cargar las inspecciones." />;
  }

  if (!data || data.length === 0) {
    return <LoadingState status="empty" />;
  }

  return (
    <main>
      <h1>Inspecciones registradas</h1>
      <ul>
        {data.map((inspection) => (
          <li key={inspection.id}>
            <a href={`/inspecciones/${inspection.id}`}>
              <strong>{inspection.location}</strong> — {inspection.date}
              <br />
              {inspection.statusLabel} · {inspection.inspector} · {inspection.findings} hallazgos
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}