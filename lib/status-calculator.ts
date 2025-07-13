import { prisma } from "./prisma"
import { Status } from "@prisma/client"

export async function calculateSensorStatus(sensorId: string): Promise<Status> {
  const sensor = await prisma.sensor.findUnique({
    where: { id: sensorId },
  })

  if (!sensor || !sensor.lastSeen) {
    return Status.RED
  }

  const now = new Date()
  const lastSeenTime = new Date(sensor.lastSeen)
  const timeDifferenceMinutes = (now.getTime() - lastSeenTime.getTime()) / (1000 * 60)

  // Rouge : hors ligne après une journée (1440 minutes)
  if (timeDifferenceMinutes >= 1440) {
    return Status.RED
  }

  // Orange : en retard après 4 manques de données (4 x fréquence)
  if (timeDifferenceMinutes > sensor.frequency * 4) {
    return Status.ORANGE
  }

  // Vert : dans les temps (moins ou égal à 4x la fréquence et moins d'une journée)
  return Status.GREEN
}

export async function updateAllSensorStatuses() {
  const sensors = await prisma.sensor.findMany()

  for (const sensor of sensors) {
    const newStatus = await calculateSensorStatus(sensor.id)

    if (sensor.status !== newStatus) {
      await prisma.sensor.update({
        where: { id: sensor.id },
        data: { status: newStatus },
      })
    }
  }
}
