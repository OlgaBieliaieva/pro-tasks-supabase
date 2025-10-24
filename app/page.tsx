"use client";

import { useEffect, useState } from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description: string;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);

  const session = useSession();
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!session) {
      router.push("/auth");
    }
  }, [session]); // eslint-disable-line

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data ?? []))
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setProjects([]);
      });
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {session && (
        <>
          <p className="mt-4">
            You are logged in as{" "}
            <span className="font-semibold italic">{session.user.email}</span>
          </p>
          <button onClick={() => supabase.auth.signOut()}>Logout</button>
        </>
      )}

      <div className="space-y-4">
        {projects.length > 0 &&
          projects.map((project) => (
            <div
              key={project.id}
              className="border p-4 rounded-xl shadow-sm bg-white"
            >
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-gray-600">{project.description}</p>
            </div>
          ))}
      </div>
    </main>
  );
}
