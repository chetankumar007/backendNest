import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Document } from "./entities/document.entity";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    userId: string
  ): Promise<Document> {
    const document = this.documentsRepository.create({
      ...createDocumentDto,
      ownerId: userId,
    });

    return this.documentsRepository.save(document);
  }

  async findAll(userId: string, isAdmin: boolean): Promise<Document[]> {
    // Admins can see all documents
    if (isAdmin) {
      return this.documentsRepository.find({
        relations: ["owner"],
      });
    }

    // Regular users can see their own documents and public documents
    return this.documentsRepository.find({
      where: [{ ownerId: userId }, { isPublic: true }],
      relations: ["owner"],
    });
  }

  async findOne(
    id: string,
    userId: string,
    isAdmin: boolean
  ): Promise<Document> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ["owner"],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Check if user has access to this document
    if (!isAdmin && document.ownerId !== userId && !document.isPublic) {
      throw new ForbiddenException(
        "You do not have permission to access this document"
      );
    }

    return document;
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    userId: string,
    isAdmin: boolean
  ): Promise<Document> {
    const document = await this.findOne(id, userId, isAdmin);

    // Only the owner or an admin can update the document
    if (!isAdmin && document.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to update this document"
      );
    }

    const updatedDocument = this.documentsRepository.merge(
      document,
      updateDocumentDto
    );
    return this.documentsRepository.save(updatedDocument);
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const document = await this.findOne(id, userId, isAdmin);

    // Only the owner or an admin can delete the document
    if (!isAdmin && document.ownerId !== userId) {
      throw new ForbiddenException(
        "You do not have permission to delete this document"
      );
    }

    await this.documentsRepository.remove(document);
  }
}
