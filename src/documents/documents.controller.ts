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
} from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
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
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
    return this.documentsService.create(createDocumentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all accessible documents" })
  @ApiResponse({ status: 200, description: "Return all accessible documents" })
  findAll(@Request() req) {
    return this.documentsService.findAll(req.user.id, req.user.isAdmin);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a document by id" })
  @ApiResponse({ status: 200, description: "Return the document" })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  findOne(@Param("id") id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user.id, req.user.isAdmin);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a document" })
  @ApiResponse({ status: 200, description: "Document successfully updated" })
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  update(
    @Param("id") id: string,
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
  @ApiResponse({ status: 404, description: "Document not found" })
  @ApiResponse({ status: 403, description: "Forbidden access" })
  remove(@Param("id") id: string, @Request() req) {
    return this.documentsService.remove(id, req.user.id, req.user.isAdmin);
  }
}
