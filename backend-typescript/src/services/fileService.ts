import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class FileService {
  async getProjectFiles(projectId: string): Promise<any[]> {
    return prisma.file.findMany({
      where: { projectId },
      orderBy: { path: "asc" },
    });
  }

  async getFile(projectId: string, filePath: string): Promise<any | null> {
    return prisma.file.findUnique({
      where: {
        projectId_path: {
          projectId,
          path: filePath,
        },
      },
    });
  }

  async createFile(
    projectId: string,
    path: string,
    content: string,
    encoding: string = "utf-8"
  ): Promise<any> {
    const size = Buffer.byteLength(content, encoding as BufferEncoding);
    return prisma.file.create({
      data: {
        projectId,
        path,
        content,
        encoding,
        size,
      },
    });
  }

  async updateFile(projectId: string, filePath: string, content: string): Promise<any> {
    const size = Buffer.byteLength(content, "utf-8");
    return prisma.file.upsert({
      where: {
        projectId_path: {
          projectId,
          path: filePath,
        },
      },
      update: {
        content,
        size,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        path: filePath,
        content,
        encoding: "utf-8",
        size,
      },
    });
  }

  async deleteFile(projectId: string, filePath: string): Promise<void> {
    await prisma.file.delete({
      where: {
        projectId_path: {
          projectId,
          path: filePath,
        },
      },
    });
  }

  async getFileTree(projectId: string): Promise<any> {
    const files = await this.getProjectFiles(projectId);

    // Build tree structure
    const tree: any = {};

    for (const file of files) {
      const parts = file.path.split("/");
      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (!current[part]) {
          current[part] = isLast ? { type: "file", ...file } : { type: "dir", children: {} };
        }

        if (!isLast) {
          current = current[part].children;
        }
      }
    }

    return tree;
  }
}

export const fileService = new FileService();
