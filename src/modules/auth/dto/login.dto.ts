import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
    @ApiProperty({
        description: 'The email of the user',
        example: 'john@gmail.com'
    })
    @IsEmail()
    email!: string;
    @ApiProperty({
        description: 'The password of the user',
        example: 'password123'
    })
    @IsNotEmpty()
    password!: string;
}
