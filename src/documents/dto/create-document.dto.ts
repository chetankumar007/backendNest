import { IsNotEmpty, IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDocumentDto {
  @ApiProperty({ example: "Project Proposal" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: "This is a proposal for the new project..." })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: "https://storage.example.com/file.pdf",
    required: false,
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
