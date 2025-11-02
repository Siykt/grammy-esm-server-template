import { decryptWithPassword, encryptWithPassword } from '../../common/crypto.js'
import { Service } from '../../common/decorators/service.js'
import { prisma } from '../../common/prisma.js'

export interface UpsertCredentialInput {
  exchangeId: string
  apiKey: string
  apiSecret: string
  passphrase?: string
}

export interface Credential {
  exchangeId: string
  apiKey: string
  apiSecret: string
  passphrase?: string
}

@Service()
export class CredentialService {
  async upsert(input: UpsertCredentialInput): Promise<void> {
    const { exchangeId, apiKey, apiSecret, passphrase } = input
    await prisma.exchangeCredential.upsert({
      where: { exchangeId },
      create: {
        exchangeId,
        apiKeyEnc: encryptWithPassword(apiKey),
        apiSecretEnc: encryptWithPassword(apiSecret),
        passphraseEnc: passphrase ? encryptWithPassword(passphrase) : null,
      },
      update: {
        apiKeyEnc: encryptWithPassword(apiKey),
        apiSecretEnc: encryptWithPassword(apiSecret),
        passphraseEnc: passphrase ? encryptWithPassword(passphrase) : null,
      },
    })
  }

  async get(exchangeId: string): Promise<Credential | null> {
    const row = await prisma.exchangeCredential.findUnique({ where: { exchangeId } })
    if (!row)
      return null
    return {
      exchangeId,
      apiKey: decryptWithPassword(row.apiKeyEnc),
      apiSecret: decryptWithPassword(row.apiSecretEnc),
      passphrase: row.passphraseEnc ? decryptWithPassword(row.passphraseEnc) : undefined,
    }
  }
}
