import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { RolUsuario } from '../../enums/rol-usuario.enum';

import { FilterUsuarioDto } from './dto/filter-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    if (createUsuarioDto.password) {
      const salt = await bcrypt.genSalt();
      createUsuarioDto.password = await bcrypt.hash(createUsuarioDto.password, salt);
    }
    const usuario = this.usuarioRepository.create(createUsuarioDto);
    return this.usuarioRepository.save(usuario);
  }

  async findAll(filterDto: FilterUsuarioDto) {
    const { page = 1, limit = 10, search, rol, isActive, mostrarTodos } = filterDto;
    const query = this.usuarioRepository.createQueryBuilder('usuario');

    // Filtro por estado
    if (isActive !== undefined) {
      query.andWhere('usuario.isActive = :isActive', { isActive });
    } else if (!mostrarTodos) {
      // Si no se especifica estado ni mostrarTodos, mostrar solo activos
      query.andWhere('usuario.isActive = :isActive', { isActive: true });
    }

    // Filtro por rol
    if (rol) {
      query.andWhere('usuario.rol = :rol', { rol });
    }

    // Búsqueda por nombre o email
    if (search) {
      query.andWhere(
        '(usuario.nombre LIKE :search OR usuario.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Paginación
    query.skip((page - 1) * limit);
    query.take(limit);
    query.orderBy('usuario.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findAllActive() {
    return this.usuarioRepository.find({
      where: { isActive: true },
      order: { nombre: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.usuarioRepository.findOneBy({ idUsuario: id });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .where('usuario.email = :email', { email })
      .andWhere('usuario.isActive = :isActive', { isActive: true })
      .addSelect('usuario.password')
      .getOne();
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.findOne(id);
    if (!usuario) throw new Error('Usuario no encontrado');

    // Protección de Admin
    if (usuario.email === 'admin@admin.com') {
       // Si intenta cambiar rol o desactivar
       // @ts-ignore
       if (updateUsuarioDto.rol && updateUsuarioDto.rol !== RolUsuario.ADMIN) {
         throw new Error('No se puede cambiar el rol del super administrador');
       }
       // @ts-ignore
       if (updateUsuarioDto.isActive === false) {
         throw new Error('No se puede desactivar al super administrador');
       }
    }

    if (updateUsuarioDto.password) {
      const salt = await bcrypt.genSalt();
      updateUsuarioDto.password = await bcrypt.hash(updateUsuarioDto.password, salt);
    }
    await this.usuarioRepository.update(id, updateUsuarioDto);
    return this.findOne(id);
  }

  async cambiarPassword(userId: number, newPassword: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: userId }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt();
    usuario.password = await bcrypt.hash(newPassword, salt);

    return this.usuarioRepository.save(usuario);
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);
    if (!usuario) throw new Error('Usuario no encontrado');

    if (usuario.email === 'admin@admin.com') {
      throw new Error('No se puede eliminar al super administrador');
    }

    // Soft delete
    usuario.isActive = false;
    return this.usuarioRepository.save(usuario);
  }
}

