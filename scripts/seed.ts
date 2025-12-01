import { prisma } from 'lib/prisma';
import mock from 'mockjs';

async function main() {
  console.log('🌱 Starting seed...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleaned existing data\n');

  // Create Users
  console.log('👥 Creating users...');
  const users = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const firstName = mock.Random.first();
      const lastName = mock.Random.last();
      return prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          avatar: `https://i.pravatar.cc/150?u=${mock.Random.guid()}`,
        },
      });
    }),
  );
  console.log(`✅ Created ${users.length} users\n`);

  // Create Projects
  console.log('📁 Creating projects...');
  const projectNames = [
    'E-Commerce Platform',
    'Mobile App Redesign',
    'API Gateway',
    'Customer Dashboard',
    'Analytics Engine',
  ];

  const projects = await Promise.all(
    projectNames.map((name, i) =>
      prisma.project.create({
        data: {
          name,
          description: mock.Random.paragraph(2),
          status: ['active', 'active', 'active', 'completed', 'archived'][i],
          ownerId: users[i % users.length].id,
        },
      }),
    ),
  );
  console.log(`✅ Created ${projects.length} projects\n`);

  // Create Project Members
  console.log('👥 Adding project members...');
  const memberPromises: Promise<unknown>[] = [];

  for (const project of projects) {
    // Add owner as member
    memberPromises.push(
      prisma.projectMember.create({
        data: {
          userId: project.ownerId,
          projectId: project.id,
          role: 'owner',
        },
      }),
    );

    // Add 2-4 random members to each project
    const memberCount = mock.Random.integer(2, 4);
    const availableUsers = users.filter((u) => u.id !== project.ownerId);
    const selectedUsers = mock.Random.shuffle(availableUsers).slice(0, memberCount);

    for (const user of selectedUsers) {
      memberPromises.push(
        prisma.projectMember.create({
          data: {
            userId: user.id,
            projectId: project.id,
            role: ['admin', 'member', 'member', 'viewer'][mock.Random.integer(0, 3)],
          },
        }),
      );
    }
  }

  await Promise.all(memberPromises);
  console.log(`✅ Added project members\n`);

  // Create Tasks
  console.log('📋 Creating tasks...');
  const taskTitles = [
    'Setup project structure',
    'Design database schema',
    'Implement authentication',
    'Create API endpoints',
    'Build UI components',
    'Write unit tests',
    'Setup CI/CD pipeline',
    'Code review',
    'Performance optimization',
    'Documentation',
    'Bug fixes',
    'Security audit',
    'Deploy to staging',
    'User acceptance testing',
    'Production deployment',
  ];

  const statuses = ['todo', 'in_progress', 'review', 'done'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  const tasks = await Promise.all(
    projects.flatMap((project) =>
      Array.from({ length: mock.Random.integer(5, 8) }, () => {
        const projectMembers = users.slice(0, mock.Random.integer(3, 6));
        const creator = projectMembers[mock.Random.integer(0, projectMembers.length - 1)];
        const assignee =
          mock.Random.boolean() ?
            projectMembers[mock.Random.integer(0, projectMembers.length - 1)]
          : null;

        return prisma.task.create({
          data: {
            title: taskTitles[mock.Random.integer(0, taskTitles.length - 1)],
            description: mock.Random.paragraph(1),
            status: statuses[mock.Random.integer(0, statuses.length - 1)],
            priority: priorities[mock.Random.integer(0, priorities.length - 1)],
            dueDate:
              mock.Random.boolean() ?
                new Date(Date.now() + mock.Random.integer(1, 30) * 24 * 60 * 60 * 1000)
              : null,
            projectId: project.id,
            creatorId: creator.id,
            assigneeId: assignee?.id || null,
          },
        });
      }),
    ),
  );
  console.log(`✅ Created ${tasks.length} tasks\n`);

  // Create Comments
  console.log('💬 Creating comments...');
  const commentTemplates = [
    'This looks good to me!',
    'Can we discuss this in the next standup?',
    'I have some concerns about the implementation.',
    'Great progress on this task!',
    "Let's prioritize this for the next sprint.",
    'Need more details on the requirements.',
    'Updated the documentation.',
    'Fixed the issue mentioned above.',
    'Waiting for design review.',
    'This is blocked by another task.',
  ];

  const comments = await Promise.all(
    tasks
      .filter(() => mock.Random.boolean())
      .flatMap((task) =>
        Array.from({ length: mock.Random.integer(1, 4) }, () =>
          prisma.comment.create({
            data: {
              content: commentTemplates[mock.Random.integer(0, commentTemplates.length - 1)],
              taskId: task.id,
              authorId: users[mock.Random.integer(0, users.length - 1)].id,
            },
          }),
        ),
      ),
  );
  console.log(`✅ Created ${comments.length} comments\n`);

  // Summary
  console.log('📊 Seed Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Projects: ${projects.length}`);
  console.log(`   Tasks: ${tasks.length}`);
  console.log(`   Comments: ${comments.length}`);
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
