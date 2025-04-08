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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Express } from "express";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("documents")
@Controller("documents")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new document" })
  @ApiResponse({ status: 201, description: "Document successfully created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
    return this.documentsService.create(createDocumentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all accessible documents" })
  @ApiResponse({ status: 200, description: "Return all accessible documents" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll(@Request() req) {
    return this.documentsService.findAll(req.user.id, req.user.isAdmin);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a document by id" })
  @ApiResponse({ status: 200, description: "Return the document" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user.id, req.user.isAdmin);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a document" })
  @ApiResponse({ status: 200, description: "Document successfully updated" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req
  ) {
    return this.documentsService.update(
      id,
      updateDocumentDto,
      req.user.id,
      req.user.isAdmin
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a document" })
  @ApiResponse({ status: 200, description: "Document successfully deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    return this.documentsService.remove(id, req.user.id, req.user.isAdmin);
  }

  @Post(":id/upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOperation({ summary: "Upload a file for a document" })
  @ApiResponse({ status: 200, description: "File uploaded successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  @ApiResponse({ status: 404, description: "Document not found" })
  uploadFile(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    return this.documentsService.uploadFile(
      id,
      file,
      req.user.id,
      req.user.isAdmin
    );
  }
}
