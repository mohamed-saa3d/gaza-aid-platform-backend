import { Prisma, ProjectStatus } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';

const projectSelect = {
  id: true,
  titleAr: true,
  titleEn: true,
  descriptionAr: true,
  descriptionEn: true,
  imageUrl: true,
  targetAmount: true,
  collectedAmount: true,
  status: true,
  category: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

type CreateProjectInput = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl?: string;
  targetAmount: number;
  status: ProjectStatus;
  categoryId: string;
};

type UpdateProjectInput = {
  id: string;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string | null;
  targetAmount?: number;
  status?: ProjectStatus;
  categoryId?: string;
};

const calculateProgressPercentage = (collectedAmount: number, targetAmount: number): number => {
  if (targetAmount <= 0) {
    return 0;
  }

  return Number(((collectedAmount / targetAmount) * 100).toFixed(2));
};

export const projectsService = {
  async getProjects(
    page = 1,
    limit = 10,
    status?: ProjectStatus | 'ALL',
  ) {
    const where = status && status !== 'ALL'
      ? { status }
      : {};

    const [total, projects] = await prisma.$transaction([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: projectSelect,
      }),
    ]);

    return {
      data: projects.map((project) => ({
        ...project,
        progressPercentage: calculateProgressPercentage(project.collectedAmount, project.targetAmount),
      })),
      total,
      page,
      limit,
    };
  },

  async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      select: projectSelect,
    });

    if (!project) {
      throw new AppError('Project was not found', 404);
    }

    return {
      ...project,
      progressPercentage: calculateProgressPercentage(project.collectedAmount, project.targetAmount),
    };
  },

  async getProjectStats() {
    const total = await prisma.project.count();
    const completed = await prisma.project.count({
      where: { status: ProjectStatus.COMPLETED },
    });

    return {
      totalProjects: total,
      completedProjects: completed,
      completionPercentage: total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2)),
    };
  },

  async createProject(input: CreateProjectInput) {
    const { collectedAmount, raisedAmount, ...sanitizedInput } = input as CreateProjectInput & {
      collectedAmount?: unknown;
      raisedAmount?: unknown;
    };

    const category = await prisma.category.findUnique({
      where: { id: sanitizedInput.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError('Category was not found', 404);
    }

    return prisma.project.create({
      data: {
        titleAr: sanitizedInput.titleAr.trim(),
        titleEn: sanitizedInput.titleEn.trim(),
        descriptionAr: sanitizedInput.descriptionAr.trim(),
        descriptionEn: sanitizedInput.descriptionEn.trim(),
        imageUrl: sanitizedInput.imageUrl,
        targetAmount: sanitizedInput.targetAmount,
        status: sanitizedInput.status,
        category: { connect: { id: sanitizedInput.categoryId } },
      },
      select: projectSelect,
    });
  },

  async updateProject(input: UpdateProjectInput) {
    const { collectedAmount, raisedAmount, ...sanitizedInput } = input as UpdateProjectInput & {
      collectedAmount?: unknown;
      raisedAmount?: unknown;
    };

    if (sanitizedInput.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: sanitizedInput.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new AppError('Category was not found', 404);
      }
    }

    const existingProject = await prisma.project.findUnique({
      where: { id: sanitizedInput.id },
      select: {
        collectedAmount: true,
        targetAmount: true,
        status: true,
      },
    });

    if (!existingProject) {
      throw new AppError('Project was not found', 404);
    }

    const updatedTargetAmount = sanitizedInput.targetAmount ?? existingProject.targetAmount;
    const shouldComplete = existingProject.collectedAmount >= updatedTargetAmount;
    const updatedStatus = shouldComplete
      ? ProjectStatus.COMPLETED
      : sanitizedInput.status ?? existingProject.status;

    return prisma.project.update({
      where: { id: sanitizedInput.id },
      data: {
        ...(sanitizedInput.titleAr ? { titleAr: sanitizedInput.titleAr.trim() } : {}),
        ...(sanitizedInput.titleEn ? { titleEn: sanitizedInput.titleEn.trim() } : {}),
        ...(sanitizedInput.descriptionAr ? { descriptionAr: sanitizedInput.descriptionAr.trim() } : {}),
        ...(sanitizedInput.descriptionEn ? { descriptionEn: sanitizedInput.descriptionEn.trim() } : {}),
        ...(sanitizedInput.imageUrl !== undefined ? { imageUrl: sanitizedInput.imageUrl } : {}),
        ...(sanitizedInput.targetAmount !== undefined ? { targetAmount: sanitizedInput.targetAmount } : {}),
        ...(sanitizedInput.categoryId ? { category: { connect: { id: sanitizedInput.categoryId } } } : {}),
        status: updatedStatus,
      },
      select: projectSelect,
    });
  },

  async deleteProject(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        collectedAmount: true,
      },
    });

    if (!project) {
      throw new AppError('Project was not found', 404);
    }

    if (project.collectedAmount > 0) {
      throw new AppError('Cannot delete a project that has received donations.', 400);
    }

    await prisma.project.delete({ where: { id } });
    return { id };
  },
};
