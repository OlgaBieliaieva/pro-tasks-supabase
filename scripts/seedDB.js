import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function seedDB() {
  console.log('🌱 Seeding database...')

  // Створюємо користувача в auth.users
  const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: 'demo@example.com',
    password: 'demo123',
    email_confirm: true,
  })

  if (userError) {
    console.error('❌ Error creating user:', userError)
    return
  }

  const userId = user.user.id
  console.log('👤 Created user:', userId)

  // Створюємо профіль
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([
      {
        id: userId,
        name: 'Demo User',
        avatar_url: 'https://i.pravatar.cc/150?u=demo',
      },
    ])

  if (profileError) console.error('❌ Error creating profile:', profileError)
  else console.log('✅ Profile created!')

  //  Додаємо проект і задачі
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .insert([
      {
        name: 'Demo Project',
        description: 'This is a seeded demo project',
        owner_id: userId,
      },
    ])
    .select()
    .single()

  if (projectError) console.error('❌ Error creating project:', projectError)
  else console.log('📁 Project created:', project.id)

  const { error: tasksError } = await supabaseAdmin.from('tasks').insert([
    {
      title: 'Set up project',
      description: 'Initialize Next.js and Supabase',
      status: 'done',
      project_id: project.id,
      assigned_to: userId,
    },
    {
      title: 'Implement Auth',
      description: 'Add Supabase auth helpers for Next.js',
      status: 'todo',
      project_id: project.id,
      assigned_to: userId,
    },
  ])

  if (tasksError) console.error('❌ Error creating tasks:', tasksError)
  else console.log('✅ Tasks created successfully!')
}

seedDB()