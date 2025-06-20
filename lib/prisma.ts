import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from '@prisma/adapter-neon'

// Déclare une variable globale pour stocker l'instance de Prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Fonction pour créer et configurer le client Prisma avec l'adaptateur Neon
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the environment variables.')
  }

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  })

  return new PrismaClient({
    adapter: adapter as any, // Type assertion pour contourner le problème de compatibilité
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Utilise l'instance globale si elle existe, sinon en crée une nouvelle.
export const prisma = globalThis.prisma ?? createPrismaClient()

// En développement, on sauvegarde l'instance dans la variable globale pour la réutiliser lors des rechargements.
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma
}
