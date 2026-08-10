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
      data: projects,
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

    return project;
  },

  async createProject(input: CreateProjectInput) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError('Category was not found', 404);
    }

    return prisma.project.create({
      data: {
        titleAr: input.titleAr.trim(),
        titleEn: input.titleEn.trim(),
        descriptionAr: input.descriptionAr.trim(),
        descriptionEn: input.descriptionEn.trim(),
        imageUrl: input.imageUrl,
        targetAmount: input.targetAmount,
        status: input.status,
        category: { connect: { id: input.categoryId } },
      },
      select: projectSelect,
    });
  },

  async updateProject(input: UpdateProjectInput) {
    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new AppError('Category was not found', 404);
      }
    }

    return prisma.project.update({
      where: { id: input.id },
      data: {
        ...(input.titleAr ? { titleAr: input.titleAr.trim() } : {}),
        ...(input.titleEn ? { titleEn: input.titleEn.trim() } : {}),
        ...(input.descriptionAr ? { descriptionAr: input.descriptionAr.trim() } : {}),
        ...(input.descriptionEn ? { descriptionEn: input.descriptionEn.trim() } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.targetAmount !== undefined ? { targetAmount: input.targetAmount } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      },
      select: projectSelect,
    });
  },

  async deleteProject(id: string) {
    await prisma.project.delete({ where: { id } });
    return { id };
  },
};
