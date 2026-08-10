import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
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
projectsRoutes.get('/', getProjects);
projectsRoutes.get('/:id', getProject);
projectsRoutes.post('/', requireAdmin, validateRequest(createProjectSchema), createProject);
projectsRoutes.put('/:id', requireAdmin, validateRequest(updateProjectSchema), updateProject);
projectsRoutes.delete('/:id', requireAdmin, deleteProject);
