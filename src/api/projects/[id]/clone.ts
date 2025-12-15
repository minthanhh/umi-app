import { UmiApiRequest, UmiApiResponse } from '@umijs/max';
import prisma from 'lib/prisma';

// POST /api/projects/:id/clone - Clone a project with its tasks and members
export default async function (req: UmiApiRequest, res: UmiApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.params;
  const projectId = parseInt(id as string, 10);
  const {
    name,
    ownerId,
    includeTasks = true,
    includeMembers = true,
  } = req.body;

  if (isNaN(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    // Get original project with tasks and members
    const originalProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: includeTasks
          ? {
              select: {
                title: true,
                description: true,
                status: true,
                priority: true,
                dueDate: true,
                creatorId: true,
                assigneeId: true,
              },
            }
          : false,
        members: includeMembers
          ? {
              select: {
                userId: true,
                role: true,
              },
            }
          : false,
      },
    });

    if (!originalProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const newOwnerId = ownerId
      ? parseInt(ownerId, 10)
      : originalProject.ownerId;
    const newProjectName = name || `${originalProject.name} (Copy)`;

    // Create new project
    const newProject = await prisma.project.create({
      data: {
        name: newProjectName,
        description: originalProject.description,
        status: 'active',
        ownerId: newOwnerId,
      },
    });

    // Clone members if requested
    if (
      includeMembers &&
      originalProject.members &&
      originalProject.members.length > 0
    ) {
      const membersToCreate = originalProject.members.map((member) => ({
        userId: member.userId,
        projectId: newProject.id,
        role: member.userId === newOwnerId ? 'owner' : member.role,
      }));

      // Check if new owner is already in members list
      const ownerInMembers = membersToCreate.some(
        (m) => m.userId === newOwnerId,
      );
      if (!ownerInMembers) {
        membersToCreate.push({
          userId: newOwnerId,
          projectId: newProject.id,
          role: 'owner',
        });
      }

      await prisma.projectMember.createMany({
        data: membersToCreate,
        skipDuplicates: true,
      });
    } else {
      // Add owner as member
      await prisma.projectMember.create({
        data: {
          userId: newOwnerId,
          projectId: newProject.id,
          role: 'owner',
        },
      });
    }

    // Clone tasks if requested
    if (
      includeTasks &&
      originalProject.tasks &&
      originalProject.tasks.length > 0
    ) {
      const tasksToCreate = originalProject.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        status: 'todo', // Reset status for cloned tasks
        priority: task.priority,
        dueDate: task.dueDate,
        projectId: newProject.id,
        creatorId: newOwnerId,
        assigneeId: task.assigneeId,
      }));

      await prisma.task.createMany({
        data: tasksToCreate,
      });
    }

    // Fetch complete project with relations
    const clonedProject = await prisma.project.findUnique({
      where: { id: newProject.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    res.status(201).json({
      data: clonedProject,
      success: true,
      message: 'Project cloned successfully',
    });
  } catch (error) {
    console.error('Clone project error:', error);
    res.status(500).json({ error: 'Failed to clone project' });
  }
}
