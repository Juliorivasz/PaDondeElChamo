import { Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsuarioService } from '../usuario/usuario.service';
import { JwtService } from '@nestjs/jwt';
import { CajaService } from '../caja/caja.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private cajaService: CajaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usuarioService.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Usuario inactivo');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password, ...result } = user;
    return result;
  }

  async login(user: any, passwordInput?: string) {
    const payload = { email: user.email, sub: user.idUsuario, rol: user.rol };
    
    let weakPassword = false;
    if (passwordInput) {
       // Validación estricta: si falla alguna regla, es débil
       const isWeak = 
         passwordInput.length < 6 ||
         /admin/i.test(passwordInput) ||
         !/[A-Z]/.test(passwordInput) ||
         !/[a-z]/.test(passwordInput) ||
         !/[0-9]/.test(passwordInput);

       if (isWeak) {
         weakPassword = true;
       }
    }

    // [CAJA] Iniciar Arqueo/Sesión
    await this.cajaService.iniciarSesion(user);

    return {
      token: this.jwtService.sign(payload),
      nombre: user.nombre,
      rol: user.rol,
      weakPassword
    };
  }

  async renovarToken(user: any) {
    const payload = { email: user.email, sub: user.userId, rol: user.rol };
    return {
      token: this.jwtService.sign(payload),
      usuario: {
        email: user.email,
        rol: user.rol
      }
    };
  }

  async recuperarPassword(email: string) {
    const user = await this.usuarioService.findByEmail(email);
    if (!user) {
      // No revelar si el usuario existe o no
      return;
    }
    // TODO: Implementar lógica de envío de correo y generación de token
    // Por ahora solo simulamos
    console.log(`Solicitud de recuperación para: ${email}`);
  }

  async restablecerPassword(token: string, nuevaPassword: string) {
    // TODO: Implementar validación de token y cambio de contraseña
    console.log(`Restablecer password con token: ${token}`);
  }
}
