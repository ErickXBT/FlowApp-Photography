import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, teamMembersTable } from "@workspace/db";
import {
  ListTeamMembersResponse,
  CreateTeamMemberBody,
  CreateTeamMemberResponse,
  UpdateTeamMemberParams,
  UpdateTeamMemberBody,
  UpdateTeamMemberResponse,
  DeleteTeamMemberParams,
} from "@workspace/api-zod";
import { requireVendor } from "../lib/auth";

const router: IRouter = Router();
router.use(requireVendor);

router.get("/team", async (_req, res): Promise<void> => {
  const teamMembers = await db.select().from(teamMembersTable).orderBy(teamMembersTable.name);
  res.json(ListTeamMembersResponse.parse(teamMembers));
});

router.post("/team", async (req, res): Promise<void> => {
  const parsed = CreateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [member] = await db.insert(teamMembersTable).values(parsed.data).returning();
  res.status(201).json(CreateTeamMemberResponse.parse(member));
});

router.patch("/team/:id", async (req, res): Promise<void> => {
  const params = UpdateTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [member] = await db
    .update(teamMembersTable)
    .set(parsed.data)
    .where(eq(teamMembersTable.id, params.data.id))
    .returning();
  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }
  res.json(UpdateTeamMemberResponse.parse(member));
});

router.delete("/team/:id", async (req, res): Promise<void> => {
  const params = DeleteTeamMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [member] = await db.delete(teamMembersTable).where(eq(teamMembersTable.id, params.data.id)).returning();
  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
