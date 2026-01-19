import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() req) {
    const user = await this.authService.validateUser(req.email, req.password);
    return this.authService.login(user, req.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('renovarToken')
  async renovarToken(@Request() req) {
    return this.authService.renovarToken(req.user);
  }

  @Post('recuperar-password')
  async recuperarPassword(@Body('email') email: string) {
    return this.authService.recuperarPassword(email);
  }

  @Post('restablecer-password')
  async restablecerPassword(@Body() body) {
    return this.authService.restablecerPassword(body.token, body.nuevaPassword);
  }
}
