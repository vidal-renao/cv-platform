'use client';

export default function TrackingTimeline({ events }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold mb-4">Tracking</h2>

      <div className="relative border-l-2 border-gray-200 ml-4">
        {events.map((event) => (
          <div key={event.id} className="mb-6 ml-4 relative">

            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 mt-1" />

            <div>
              <p className="font-medium">
                {event.status}
              </p>

              {event.note && (
                <p className="text-sm text-gray-600">{event.note}</p>
              )}

              <p className="text-xs text-gray-400">
                {new Date(event.created_at).toLocaleString()}
              </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}