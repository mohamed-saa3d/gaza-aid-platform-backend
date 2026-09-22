import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import { uploadSingleImage } from '../../shared/middlewares/upload.middleware';
import { useCache } from '../../shared/middlewares/cache.middleware';
import {
  createProject,
  deleteProject,
  getProject,
  getProjectStats,
  getProjects,
  updateProject,
} from './projects.controller';
import {
  createProjectSchema,
  updateProjectSchema,
} from './projects.validation';

export const projectsRoutes = Router();

projectsRoutes.get('/stats', getProjectStats);
projectsRoutes.get('/', useCache('projects', 60), getProjects);
projectsRoutes.get('/:id', useCache('projects', 60), getProject);
projectsRoutes.post('/', requireAdmin, uploadSingleImage('image'), validateRequest(createProjectSchema), createProject);
projectsRoutes.put('/:id', requireAdmin, uploadSingleImage('image'), validateRequest(updateProjectSchema), updateProject);
projectsRoutes.delete('/:id', requireAdmin, deleteProject);
