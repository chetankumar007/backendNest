import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Query,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { Response } from "express";
import { createReadStream } from "fs";
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/enums/role.enum";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import * as path from "path";
import * as fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags("documents")
@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: "Upload a new document" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        title: {
          type: "string",
        },
        description: {
          type: "string",
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        // Allow common document and image types
        const allowedMimeTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
          "image/jpeg",
          "image/png",
          "image/gif",
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error("Unsupported file type"), false);
        }
      },
    }),
  )
  @ApiResponse({ status: 201, description: "Document successfully created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.create(createDocumentDto, file, req.user);
  }

  @Get()
  @ApiOperation({ summary: "Get all documents (with pagination and filtering)" })
  @ApiResponse({ status: 200, description: "Return all accessible documents" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth()
  async findAll(
    @Request() req,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("mimeType") mimeType?: string,
    @Query("sortBy") sortBy?: string,
    @Query("order") order?: "asc" | "desc",
  ) {
    return this.documentsService.findAll(req.user, {
      page,
      limit,
      search,
      mimeType,
      sortBy,
      order,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get document by ID" })
  @ApiResponse({ status: 200, description: "Return the document" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiBearerAuth()
  async findOne(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update document metadata" })
  @ApiResponse({ status: 200, description: "Document successfully updated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiBearerAuth()
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.update(id, updateDocumentDto, req.user);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a document" })
  @ApiResponse({ status: 200, description: "Document successfully deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiBearerAuth()
  async remove(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.documentsService.remove(id, req.user);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Download a document" })
  @ApiResponse({ status: 200, description: "File downloaded successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiBearerAuth()
  async download(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.documentsService.getDocumentFile(id, req.user);
    
    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    });
    
    const fileStream = createReadStream(file.path);
    return new StreamableFile(fileStream);
  }

  @Get(":id/view")
  @ApiOperation({ summary: "View a document in browser" })
  @ApiResponse({ status: 200, description: "File viewed successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiBearerAuth()
  async view(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.documentsService.getDocumentFile(id, req.user);
    
    res.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
    });
    
    const fileStream = createReadStream(file.path);
    return new StreamableFile(fileStream);
  }

  @Get("admin/all")
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Admin: Get all documents with extended filtering options" })
  @ApiResponse({ status: 200, description: "Return all documents" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access - Admin only" })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  async findAllAdmin(
    @Request() req,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
    @Query("ownerId") ownerId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("sortBy") sortBy?: string,
    @Query("order") order?: "asc" | "desc",
  ) {
    return this.documentsService.findAllAdmin(req.user, {
      page,
      limit,
      search,
      ownerId,
      startDate,
      endDate,
      sortBy,
      order,
    });
  }
}
