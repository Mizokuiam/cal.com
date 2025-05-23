import type { Prisma } from "@prisma/client";
import type { NextApiRequest } from "next";

import { HttpError } from "@calcom/lib/http-error";
import { defaultResponder } from "@calcom/lib/server/defaultResponder";
import { SelectedCalendarRepository } from "@calcom/lib/server/repository/selectedCalendar";
import prisma from "@calcom/prisma";

import {
  schemaSelectedCalendarBodyParams,
  schemaSelectedCalendarPublic,
} from "~/lib/validations/selected-calendar";

/**
 * @swagger
 * /selected-calendars:
 *   post:
 *     summary: Creates a new selected calendar
 *     parameters:
 *      - in: query
 *        name: apiKey
 *        schema:
 *          type: string
 *        required: true
 *        description: Your API Key
 *     requestBody:
 *       description: Create a new selected calendar
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - integration
 *               - externalId
 *             properties:
 *               integration:
 *                 type: string
 *                 description: The integration name
 *               externalId:
 *                 type: string
 *                 description: The external ID of the integration
 *     tags:
 *     - selected-calendars
 *     responses:
 *       201:
 *         description: OK, selected calendar created
 *       400:
 *        description: Bad request. SelectedCalendar body is invalid.
 *       401:
 *        description: Authorization information is missing or invalid.
 */
async function postHandler(req: NextApiRequest) {
  const { userId, isSystemWideAdmin } = req;
  const { userId: bodyUserId, ...body } = schemaSelectedCalendarBodyParams.parse(req.body);
  const args: {
    data: Prisma.SelectedCalendarUncheckedCreateInput;
  } = {
    data: { ...body, userId },
  };

  if (!isSystemWideAdmin && bodyUserId)
    throw new HttpError({ statusCode: 403, message: `ADMIN required for userId` });

  if (isSystemWideAdmin && bodyUserId) {
    const where: Prisma.UserWhereInput = { id: bodyUserId };
    await prisma.user.findFirstOrThrow({ where });
    args.data.userId = bodyUserId;
  }

  const data = await SelectedCalendarRepository.create(args.data);

  return {
    selected_calendar: schemaSelectedCalendarPublic.parse(data),
    message: "Selected Calendar created successfully",
  };
}

export default defaultResponder(postHandler);
