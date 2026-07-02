import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, addOnsTable } from "@workspace/db";
import {
  ListAddOnsResponse,
  CreateAddOnBody,
  CreateAddOnResponse,
  UpdateAddOnParams,
  UpdateAddOnBody,
  UpdateAddOnResponse,
  DeleteAddOnParams,
} from "@workspace/api-zod";
import { requireVendor } from "../lib/auth";

const router: IRouter = Router();
router.use(requireVendor);

function toNumericAddOn<T extends { price: string | number }>(a: T) {
  return { ...a, price: Number(a.price) };
}

router.get("/add-ons", async (_req, res): Promise<void> => {
  const addOns = await db.select().from(addOnsTable).orderBy(addOnsTable.name);
  res.json(ListAddOnsResponse.parse(addOns.map(toNumericAddOn)));
});

router.post("/add-ons", async (req, res): Promise<void> => {
  const parsed = CreateAddOnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [addOn] = await db
    .insert(addOnsTable)
    .values({ ...parsed.data, price: String(parsed.data.price) })
    .returning();
  res.status(201).json(CreateAddOnResponse.parse(toNumericAddOn(addOn)));
});

router.patch("/add-ons/:id", async (req, res): Promise<void> => {
  const params = UpdateAddOnParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAddOnBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { price, ...rest } = parsed.data;
  const [addOn] = await db
    .update(addOnsTable)
    .set({ ...rest, ...(price !== undefined ? { price: String(price) } : {}) })
    .where(eq(addOnsTable.id, params.data.id))
    .returning();
  if (!addOn) {
    res.status(404).json({ error: "Add-on not found" });
    return;
  }
  res.json(UpdateAddOnResponse.parse(toNumericAddOn(addOn)));
});

router.delete("/add-ons/:id", async (req, res): Promise<void> => {
  const params = DeleteAddOnParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [addOn] = await db.delete(addOnsTable).where(eq(addOnsTable.id, params.data.id)).returning();
  if (!addOn) {
    res.status(404).json({ error: "Add-on not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
