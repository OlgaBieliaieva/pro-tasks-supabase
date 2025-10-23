'use client'

import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  description: string
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])  

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then(setProjects)
  }, [])
  
  console.log(projects);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">TaskFlow Dashboard</h1>

      <div className="space-y-4">
        {projects.map((project) => (
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
  )
}