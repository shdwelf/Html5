import { afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { encryptVaultFile, decryptVaultFile } from '../src/lib/vaultfile';
import { encryptVault, decryptVault } from '../tools/wiki-workspace/web/vault.mjs';

afterEach(() => vi.unstubAllGlobals());
describe('repository wiki / Haiku Workbench encrypted exchange', () => {
  const payload = { format: 'repository-wiki-vault', version: 1, pages: [{title:'日本語 — Toronto',body:'é 🍃'}], files: [] };
  it('WebCrypto decrypts a Workbench v1 envelope', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const blob = encryptVaultFile(payload, 'independent passphrase é 🍃');
    expect(await decryptVault(blob, 'independent passphrase é 🍃')).toEqual(payload);
  });
  it('Workbench decrypts the wiki WebCrypto envelope', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const blob = await encryptVault(payload, 'independent passphrase é 🍃');
    expect(decryptVaultFile(blob, 'independent passphrase é 🍃')).toEqual(payload);
    expect(() => decryptVaultFile(blob, 'wrong')).toThrow();
  });
});
