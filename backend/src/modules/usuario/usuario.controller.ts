import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Patch, Request } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FilterUsuarioDto } from './dto/filter-usuario.dto';
import { RolUsuario } from '../../enums/rol-usuario.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Public()
  @Get('roles')
  getRoles() {
    return Object.values(RolUsuario);
  }

  @Post('usuario/nuevo')
  @Roles('ADMIN')
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    // Restricción: No se puede crear un ADMIN por API
    if (createUsuarioDto.rol === RolUsuario.ADMIN) {
      throw new Error('No se puede crear un usuario con rol ADMIN');
    }
    return this.usuarioService.create(createUsuarioDto);
  }

  @Public()
  @Get('usuario/activos')
  findAllActive() {
    return this.usuarioService.findAllActive();
  }

  @Get('usuario/lista')
  @Roles('ADMIN')
  findAll(@Query() filterDto: FilterUsuarioDto) {
    return this.usuarioService.findAll(filterDto);
  }

  @Get('usuario/:id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usuarioService.findOne(+id);
  }

  @Patch('usuario/cambiarPassword')
  cambiarPassword(@Request() req, @Body() dto: { password: string }) {
    return this.usuarioService.cambiarPassword(req.user.userId, dto.password);
  }

  @Put('usuario/:id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(+id, updateUsuarioDto);
  }

  @Delete('usuario/:id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usuarioService.remove(+id);
  }
}
