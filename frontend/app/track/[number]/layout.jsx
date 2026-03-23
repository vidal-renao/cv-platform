export async function generateMetadata({ params }) {
  const number = decodeURIComponent(params.number || '');
  return {
    title: number ? `Rastreo ${number}` : 'Rastrear Envío',
    description: `Consulta el estado actualizado de tu envío ${number} en tiempo real. Sin necesidad de cuenta.`,
    robots: { index: false, follow: true },
  };
}

export default function TrackLayout({ children }) {
  return children;
}
