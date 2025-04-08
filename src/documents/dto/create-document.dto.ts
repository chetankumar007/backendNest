import { IsNotEmpty, IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDocumentDto {
  @ApiProperty({ example: "Project Proposal", description: "Document title" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: "Document description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "This is a proposal for the new project...", description: "Document content" })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: "https://storage.example.com/file.pdf",
    description: "URL to the document file"
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ 
    example: false, 
    default: false,
    description: "Whether the document is publicly accessible" 
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
