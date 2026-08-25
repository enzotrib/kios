<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Restablece la contraseña de un usuario desde la consola.
 *
 * Sirve para el caso tipico de "se perdio la clave del administrador": no hace
 * falta tocar la base a mano ni tener acceso al correo. En cPanel se corre
 * igual desde la Terminal o desde un cron job de una sola ejecucion.
 *
 *   php artisan user:password enzotrib@gmail.com
 *   php artisan user:password enzotrib@gmail.com nuevaClave123
 *   php artisan user:password --list
 */
class ResetUserPassword extends Command
{
    protected $signature = 'user:password
                            {email? : Correo o nombre de usuario}
                            {password? : Clave nueva (si se omite, se pide por pantalla)}
                            {--list : Solo lista los usuarios existentes}';

    protected $description = 'Restablece la contraseña de un usuario';

    public function handle(): int
    {
        if ($this->option('list') || !$this->argument('email')) {
            $this->listUsers();

            if ($this->option('list')) {
                return self::SUCCESS;
            }
        }

        $identifier = $this->argument('email') ?: $this->ask('Correo o nombre de usuario');

        // Se busca por email o por user_name: en este sistema se puede entrar con cualquiera
        $user = User::where('email', $identifier)
            ->orWhere('user_name', $identifier)
            ->first();

        if (!$user) {
            $this->error("No existe ningun usuario con \"{$identifier}\".");
            return self::FAILURE;
        }

        $password = $this->argument('password') ?: $this->secret('Clave nueva');

        if (strlen((string) $password) < 6) {
            $this->error('La clave debe tener al menos 6 caracteres.');
            return self::FAILURE;
        }

        $user->password = Hash::make($password);
        $user->save();

        $this->info("Listo. Clave actualizada para {$user->name} <{$user->email}> (rol: {$user->user_role}).");

        if (!$user->is_active) {
            $this->warn('Ojo: este usuario esta DESACTIVADO, asi que todavia no va a poder entrar.');
        }

        return self::SUCCESS;
    }

    private function listUsers(): void
    {
        $users = User::select('id', 'name', 'email', 'user_name', 'user_role', 'is_active')->get();

        if ($users->isEmpty()) {
            $this->warn('No hay usuarios cargados.');
            return;
        }

        $this->table(
            ['ID', 'Nombre', 'Correo', 'Usuario', 'Rol', 'Activo'],
            $users->map(fn ($u) => [
                $u->id, $u->name, $u->email, $u->user_name, $u->user_role, $u->is_active ? 'si' : 'NO',
            ])
        );
    }
}
