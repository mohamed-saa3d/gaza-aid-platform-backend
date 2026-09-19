import { ProjectStatus } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError } from '../../shared/errors/app-error';
import { projectSelect } from './projects.constants';
import { cloudinaryService } from '../../shared/services/cloudinary.service';
import type { CreateProjectInput, UpdateProjectInput } from './projects.types';

const calculateProgressPercentage = (collectedAmount: number, targetAmount: number): number => {
  if (targetAmount <= 0) {
    return 0;
  }

  return Number(((collectedAmount / targetAmount) * 100).toFixed(2));
};

const withBeneficiariesCount = <T extends { beneficiariesCount?: number | null }>(project: T) => ({
  ...project,
  beneficiariesCount: project.beneficiariesCount ?? 0,
});

export const projectsService = {
  async getProjects(
    page = 1,
    limit = 10,
    status?: ProjectStatus | 'ALL',
  ) {
    const where = {
      deletedAt: null,
      ...(status && status !== 'ALL' ? { status } : {}),
    };

    const [total, projects] = await Promise.all([
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
      data: projects.map((project: any) => ({
        ...withBeneficiariesCount(project),
        progressPercentage: calculateProgressPercentage(project.collectedAmount, project.targetAmount),
      })),
      total,
      page,
      limit,
    };
  },

  async getProjectById(id: string) {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: projectSelect,
    });

    if (!project) {
      throw new AppError('Project was not found', 404);
    }

    return {
      ...withBeneficiariesCount(project),
      progressPercentage: calculateProgressPercentage(project.collectedAmount, project.targetAmount),
    };
  },

  async getProjectPublicId(id: string) {
    const proj = await prisma.project.findUnique({ where: { id }, select: { imgPublicId: true } as any });
    return (proj as any)?.imgPublicId ?? null;
  },

  async getProjectStats() {
    const [total, completed] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({
        where: { deletedAt: null, status: ProjectStatus.COMPLETED },
      }),
    ]);

    return {
      totalProjects: total,
      completedProjects: completed,
      completionPercentage: total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2)),
    };
  },

  async createProject(input: CreateProjectInput) {
    const sanitizedInput = input;

    const category = await prisma.category.findUnique({
      where: { id: sanitizedInput.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError('Category was not found', 404);
    }

    const projectStatus = sanitizedInput.status ?? ProjectStatus.ACTIVE;

    const project = await prisma.project.create({
      data: {
        titleAr: sanitizedInput.titleAr.trim(),
        titleEn: sanitizedInput.titleEn.trim(),
        descriptionAr: sanitizedInput.descriptionAr.trim(),
        descriptionEn: sanitizedInput.descriptionEn.trim(),
        imgUrl: sanitizedInput.imgUrl,
        imgPublicId: sanitizedInput.imgPublicId,
        targetAmount: sanitizedInput.targetAmount,
        beneficiariesCount: sanitizedInput.beneficiariesCount,
        status: projectStatus,
        category: { connect: { id: sanitizedInput.categoryId } },
      } as any,
      select: projectSelect as any,
    });

    return withBeneficiariesCount(project);
  },

  async updateProject(input: UpdateProjectInput) {
    const sanitizedInput = input;

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
        updatedAt: true,
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

    try {
      const project = await prisma.project.update({
        where: {
          id: sanitizedInput.id,
          updatedAt: existingProject.updatedAt,
        },
        data: {
          ...(sanitizedInput.titleAr ? { titleAr: sanitizedInput.titleAr.trim() } : {}),
          ...(sanitizedInput.titleEn ? { titleEn: sanitizedInput.titleEn.trim() } : {}),
          ...(sanitizedInput.descriptionAr ? { descriptionAr: sanitizedInput.descriptionAr.trim() } : {}),
          ...(sanitizedInput.descriptionEn ? { descriptionEn: sanitizedInput.descriptionEn.trim() } : {}),
          ...(sanitizedInput.imgUrl !== undefined ? { imgUrl: sanitizedInput.imgUrl } : {}),
          ...(sanitizedInput.imgPublicId !== undefined ? { imgPublicId: sanitizedInput.imgPublicId } : {}),
          ...(sanitizedInput.targetAmount !== undefined ? { targetAmount: sanitizedInput.targetAmount } : {}),
          ...(sanitizedInput.beneficiariesCount !== undefined
            ? { beneficiariesCount: sanitizedInput.beneficiariesCount }
            : {}),
          ...(sanitizedInput.categoryId ? { category: { connect: { id: sanitizedInput.categoryId } } } : {}),
          status: updatedStatus,
        } as any,
        select: projectSelect as any,
      });

      return withBeneficiariesCount(project);
    } catch (error) {
      if (
        error instanceof AppError ||
        (error instanceof Error && error.name === 'PrismaClientKnownRequestError' &&
          (error as any).code === 'P2025')
      ) {
        throw new AppError('Project was not found or already modified during update', 409);
      }

      throw error;
    }
  },

  async deleteProject(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        collectedAmount: true,
        imgPublicId: true,
      },
    });

    if (!project) {
      throw new AppError('Project was not found', 404);
    }

    if (project.collectedAmount > 0) {
      throw new AppError('Cannot delete a project that has received donations.', 400);
    }

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // remove image from Cloudinary if present
    if (project.imgPublicId) {
      try {
        await cloudinaryService.deleteImage(project.imgPublicId);
      } catch (err) {
        // log and continue; do not fail deletion because of remote cleanup
        // eslint-disable-next-line no-console
        console.warn('Failed to delete Cloudinary image for project', project.id, err);
      }
    }

    return { id };
  },
};
