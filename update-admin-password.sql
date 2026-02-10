-- Actualizar el usuario admin con el hash correcto de la contraseña
UPDATE users 
SET password = '$2b$10$0lhZepZcVk9GEZNP2SrtTOD3omzCYUl556ykkJbmAvvtGiZwa1sKG'
WHERE email = 'admin@demo.com';

-- Verificar que el usuario existe
SELECT id, email, role, "tenantId" FROM users WHERE email = 'admin@demo.com';
