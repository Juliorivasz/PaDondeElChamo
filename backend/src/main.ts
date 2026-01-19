import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UsuarioService } from './modules/usuario/usuario.service';
import { RolUsuario } from './enums/rol-usuario.enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  
  const usuarioService = app.get(UsuarioService);
  const usuariosResponse = await usuarioService.findAll({ rol: RolUsuario.ADMIN });
  
  if (usuariosResponse.data.length === 0) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️  ADMIN_EMAIL o ADMIN_PASSWORD no están configurados. Omitiendo creación de usuario administrador.');
    } else {
      console.log('No se encontró ningún usuario ADMIN. Creando administrador por defecto...');
      await usuarioService.create({
        nombre: 'Admin',
        email: adminEmail,
        password: adminPassword,
        rol: RolUsuario.ADMIN,
      });
      console.log(`✅ Administrador creado exitosamente: ${adminEmail}`);
    }
  } else {
    console.log(`ℹ️  Ya existe un usuario ADMIN en el sistema. Omitiendo creación.`);
  }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`🚀 Aplicación ejecutándose en: http://localhost:${port}`);
}
bootstrap();
