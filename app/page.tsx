"use client";

import { useEffect, useState } from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description: string;
}

type ProjectResponse = Project | { error: string };

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const session = useSession();
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!session) router.push("/auth");
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

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description);
    setModalOpen(true);
  };

  const saveProject = async () => {
    if (!name) return alert("Project name is required!");
    setLoading(true);

    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";
      const method = editingProject ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data: ProjectResponse = await res.json();

      if ("error" in data) {
        throw new Error(data.error);
      }

      if (!editingProject) {
        setProjects([...projects, data]);
      } else {
        setProjects((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      }

      setName("");
      setDescription("");
      setModalOpen(false);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete project");
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {session && (
        <div className="flex gap-4 mb-4 items-center">
          <p>
            You are logged in as{" "}
            <span className="font-semibold italic">{session.user.email}</span>
          </p>
          <button
            className="text-blue-600 underline"
            onClick={() => supabase.auth.signOut()}
          >
            Logout
          </button>
        </div>
      )}

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6 hover:bg-blue-700"
        onClick={() => {
          setEditingProject(null);
          setName("");
          setDescription("");
          setModalOpen(true);
        }}
      >
        Add Project
      </button>

      {projects.length > 0 ? (
        <ul className="grid gap-4">
          {projects.map((project) => (
            <li
              key={project.id}
              className="border p-4 rounded-xl shadow-sm bg-white flex justify-between items-start"
            >
              <div>
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <p className="text-gray-600">{project.description}</p>
              </div>
              <div>
                <button
                  className="text-blue-600 underline"
                  onClick={() => openEditModal(project)}
                >
                  Edit
                </button>
                <button
                  className="px-2 py-1 text-red-600 hover:underline"
                  onClick={() => deleteProject(project.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no projects yet.</p>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 relative">
            <h2 className="text-xl font-bold mb-4">
              {editingProject ? "Edit Project" : "New Project"}
            </h2>

            <input
              type="text"
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded mb-2 w-full"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border p-2 rounded mb-4 w-full"
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={saveProject}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
