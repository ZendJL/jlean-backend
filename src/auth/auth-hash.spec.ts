/**
 * Tests unitarios — Auth: password hashing (Paso 2.1)
 * Verifica el comportamiento de bcrypt sin depender de la base de datos.
 * No importa AuthService directamente para mantener pureza del test.
 */
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

describe('Auth — Password Hashing (bcrypt)', () => {
  it('hashea una contraseña y el hash no es igual al texto plano', async () => {
    const plain = 'MiPassword123!';
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('hash round-trip: comparePassword retorna true para la contraseña correcta', async () => {
    const plain = 'SuperSecretPass456';
    const hash = await hashPassword(plain);
    const result = await comparePassword(plain, hash);
    expect(result).toBe(true);
  });

  it('comparePassword retorna false para contraseña incorrecta', async () => {
    const plain = 'CorrectPass';
    const wrong = 'WrongPass';
    const hash = await hashPassword(plain);
    const result = await comparePassword(wrong, hash);
    expect(result).toBe(false);
  });

  it('dos hashes del mismo plain son diferentes (salt único)', async () => {
    const plain = 'MismaContraseña';
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(hash1).not.toBe(hash2);
  });

  it('ambos hashes del mismo plain son válidos con comparePassword', async () => {
    const plain = 'MismaContraseña';
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(await comparePassword(plain, hash1)).toBe(true);
    expect(await comparePassword(plain, hash2)).toBe(true);
  });

  it('hash comienza con $2b$ (bcrypt v2b)', async () => {
    const hash = await hashPassword('test');
    expect(hash).toMatch(/^\$2b\$/);
  });

  it('contraseña vacía hashea pero no coincide con contraseña no vacía', async () => {
    const emptyHash = await hashPassword('');
    const result = await comparePassword('noEmpty', emptyHash);
    expect(result).toBe(false);
  });

  it('contraseña con caracteres especiales hashea y verifica correctamente', async () => {
    const plain = 'P@$$w0rd!#%^&*()';
    const hash = await hashPassword(plain);
    expect(await comparePassword(plain, hash)).toBe(true);
  });
});
