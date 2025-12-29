import { FastifyReply, FastifyRequest } from "fastify";
import { ZodSchema } from "zod";

export const validateBody = async <T>(
  request: FastifyRequest,
  reply: FastifyReply,
  schema: ZodSchema<T>
): Promise<T | null> => {
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    await reply.status(400).send({ error: parsed.error.flatten() });
    return null;
  }
  return parsed.data;
};

export const validateQuery = async <T>(
  request: FastifyRequest,
  reply: FastifyReply,
  schema: ZodSchema<T>
): Promise<T | null> => {
  const parsed = schema.safeParse(request.query);
  if (!parsed.success) {
    await reply.status(400).send({ error: parsed.error.flatten() });
    return null;
  }
  return parsed.data;
};
