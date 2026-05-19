import { IProject, IProjectDocument } from '@/project/@types/project';
import { projectSchema } from '@/project/db/definitions/project';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';

export interface IProjectModel extends Model<IProjectDocument> {
  getProject(_id: string): Promise<IProjectDocument>;
  createProject(name: string): Promise<IProjectDocument>;
  updateProject({
    _id,
    input,
    userId,
  }: {
    _id: string;
    input: IProject;
    userId: string;
  }): Promise<IProjectDocument>;
  removeProject(ProjectId: string): Promise<{ ok: number }>;
}

export const loadProjectClass = (
  models: IModels,
  subdomain: string,
) => {
  class Project {
    public static async getProject(_id: string) {
      const Project = await models.Project.findById(_id);

      if (!Project) {
        throw new Error('Project not found');
      }

      return Project;
    }

    public static async createProject(name: string): Promise<IProjectDocument> {
      const project = await models.Project.create({ name });

      // Create default statuses for the project
      if (project) {
        await models.OpptyStatus.generateDefaultOpptyStatus(project._id);
        await models.ContractStatus.generateDefaultContractStatus(project._id);
      }

      return project;
    }

    public static async updateProject({
      _id,
      input,
      userId,
    }: {
      _id: string;
      input: IProject;
      userId: string;
    }) {
      const status = await models.OpptyStatus.exists({ projectId: _id });

      if (!status) {
        await models.OpptyStatus.generateDefaultOpptyStatus(_id);
      }

      const contractStatus = await models.ContractStatus.exists({ projectId: _id });

      if (!contractStatus) {
        await models.ContractStatus.generateDefaultContractStatus(_id);
      }

      const updatedProject = await models.Project.findOneAndUpdate(
        { _id },
        { $set: { ...input } },
        { new: true },
      );

      return updatedProject;
    }

    /**
     * Remove block
     */
    public static async removeProject(ProjectId: string[]) {
      return models.Project.deleteOne({ _id: { $in: ProjectId } });
    }
  }

  projectSchema.loadClass(Project);

  return projectSchema;
};
