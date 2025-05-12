"use client";

import { useEffect, useState } from "react";

type KoboForm = {
  uid: string;
  name: string;
  date_created: string;
  deployment__submission_count: number;
};

export default function FormsPage() {
  const [forms, setForms] = useState<KoboForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForms() {
      try {
        const res = await fetch("/api/forms");
        if (!res.ok) throw new Error("Failed to fetch forms");
        const data = await res.json();
        setForms(data.results || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchForms();
  }, []);

  if (loading) return <div>Loading forms...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kobo Forms</h1>
      <table className="w-full border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">UID</th>
            <th className="text-left p-2">Created</th>
            <th className="text-left p-2">Submissions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form.uid} className="border-t">
              <td className="p-2">{form.name}</td>
              <td className="p-2">{form.uid}</td>
              <td className="p-2">
                {new Date(form.date_created).toLocaleDateString()}
              </td>
              <td className="p-2">{form.deployment__submission_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
