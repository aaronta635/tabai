import type { ActorType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logEvent(input: {
  name: string;
  actorType: ActorType;
  actorId?: string;
  teacherId?: string;
  props?: Prisma.InputJsonValue;
}) {
  return prisma.event.create({
    data: {
      name: input.name,
      actorType: input.actorType,
      actorId: input.actorId,
      teacherId: input.teacherId,
      propsJson: input.props ?? {},
    },
  });
}
