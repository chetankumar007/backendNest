import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as fs from 'fs';
import * as path from 'path';
import { Document } from "./entities/document.entity";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { User } from "../users/entities/user.entity";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    user: User
  ): Promise<Document> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const document = this.documentsRepository.create({
      ...createDocumentDto,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      owner: user,
      ownerId: user.id,
    });

    return this.documentsRepository.save(document);
  }

  async findAll(user: User, query?: any): Promise<{ data: Document[], total: number, page: number, limit: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.documentsRepository.createQueryBuilder('document');
    
    // Apply access control
    if (!user.isAdmin) {
      // Regular users can only see their own documents and public documents
      queryBuilder.where('(document.ownerId = :userId OR document.isPublic = :isPublic)', 
        { userId: user.id, isPublic: true });
    }
    
    // Apply search if provided
    if (query?.search) {
      queryBuilder.andWhere(
        '(document.title ILIKE :search OR document.description ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }
    
    // Apply file type filter if provided
    if (query?.mimeType) {
      queryBuilder.andWhere('document.mimeType = :mimeType', { mimeType: query.mimeType });
    }
    
    // Apply sorting
    const sortBy = query?.sortBy || 'createdAt';
    const order = query?.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`document.${sortBy}`, order as 'ASC' | 'DESC');
    
    // Get total count
    const total = await queryBuilder.getCount();
    
    // Apply pagination
    queryBuilder.skip(skip).take(limit);
    
    // Get results
    const data = await queryBuilder.getMany();
    
    return {
      data,
      total,
      page: +page,
      limit: +limit,
    };
  }

  // Admin-specific method to get all documents with additional details
  async findAllAdmin(user: User, query?: any): Promise<{ data: Document[], total: number, page: number, limit: number }> {
    // Verify the user is an admin
    if (!user.isAdmin) {
      throw new ForbiddenException('Only admins can access this endpoint');
    }
    
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.documentsRepository.createQueryBuilder('document')
      .leftJoinAndSelect('document.owner', 'owner');
    
    // Apply search if provided
    if (query?.search) {
      queryBuilder.andWhere(
        '(document.title ILIKE :search OR document.description ILIKE :search OR owner.email ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }
    
    // Apply owner filter if provided
    if (query?.ownerId) {
      queryBuilder.andWhere('document.ownerId = :ownerId', { ownerId: query.ownerId });
    }
    
    // Apply date range filter if provided
    if (query?.startDate) {
      queryBuilder.andWhere('document.createdAt >= :startDate', { startDate: query.startDate });
    }
    
    if (query?.endDate) {
      queryBuilder.andWhere('document.createdAt <= :endDate', { endDate: query.endDate });
    }
    
    // Apply sorting
    const sortBy = query?.sortBy || 'createdAt';
    const order = query?.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Handle special sort cases
    if (sortBy === 'ownerName') {
      queryBuilder.orderBy('owner.firstName', order as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy(`document.${sortBy}`, order as 'ASC' | 'DESC');
    }
    
    // Get total count
    const total = await queryBuilder.getCount();
    
    // Apply pagination
    queryBuilder.skip(skip).take(limit);
    
    // Get results
    const data = await queryBuilder.getMany();
    
    return {
      data,
      total,
      page: +page,
      limit: +limit,
    };
  }

  async findOne(id: string, user: User): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ["owner"],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Check if user has access to this document
    if (!user.isAdmin && document.ownerId !== user.id && !document.isPublic) {
      throw new ForbiddenException(
        "You do not have permission to access this document"
      );
    }

    return document;
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    user: User
  ): Promise<Document> {
    const document = await this.findOne(id, user);

    // Only the owner or an admin can update the document
    if (!user.isAdmin && document.ownerId !== user.id) {
      throw new ForbiddenException(
        "You do not have permission to update this document"
      );
    }

    // Update document
    await this.documentsRepository.update(id, updateDocumentDto);
    
    // Return updated document
    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<{ message: string }> {
    const document = await this.findOne(id, user);

    // Only the owner or an admin can delete the document
    if (!user.isAdmin && document.ownerId !== user.id) {
      throw new ForbiddenException(
        "You do not have permission to delete this document"
      );
    }

    // Delete file from disk if it exists
    if (document.filePath) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (error) {
        console.error(`Error deleting file: ${error.message}`);
        // Continue with document deletion even if file deletion fails
      }
    }

    await this.documentsRepository.remove(document);
    return { message: `Document with ID ${id} has been deleted` };
  }

  async uploadFile(id: string, file: Express.Multer.File, user: User): Promise<Document> {
    const document = await this.findOne(id, user);
    
    // Check if user has permission to update this document
    if (!user.isAdmin && document.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to update this document');
    }
    
    // Delete old file if it exists
    if (document.filePath) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (error) {
        console.error(`Error deleting old file: ${error.message}`);
        // Continue with update even if old file deletion fails
      }
    }
    
    // Update document with file information
    document.fileName = file.filename;
    document.originalName = file.originalname;
    document.mimeType = file.mimetype;
    document.fileSize = file.size;
    document.filePath = file.path;
    
    return this.documentsRepository.save(document);
  }

  async getDocumentFile(id: string, user: User): Promise<{ path: string, fileName: string, mimeType: string }> {
    const document = await this.findOne(id, user);

    // Check if file exists
    if (!document.filePath || !fs.existsSync(document.filePath)) {
      throw new NotFoundException('File not found on server');
    }

    return {
      path: document.filePath,
      fileName: document.originalName || 'document',
      mimeType: document.mimeType,
    };
  }
}
