import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getListCategoriesQueryKey,
  useListPackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  getListPackagesQueryKey,
  useListAddOns,
  useCreateAddOn,
  useUpdateAddOn,
  useDeleteAddOn,
  getListAddOnsQueryKey,
} from "@workspace/api-client-react";
import type { Category, Package, AddOn } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pencil, Plus } from "lucide-react";

export default function Packages() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-serif font-bold">Packages</h1>
      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
        </TabsList>
        <TabsContent value="packages" className="pt-4"><PackagesTab /></TabsContent>
        <TabsContent value="categories" className="pt-4"><CategoriesTab /></TabsContent>
        <TabsContent value="addons" className="pt-4"><AddOnsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function CategoriesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories, isLoading } = useListCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
  const create = useCreateCategory({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setForm({ name: "", description: "" }); toast({ title: "Category created" }); } } });
  const update = useUpdateCategory({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setEditing(null); toast({ title: "Category updated" }); } } });
  const remove = useDeleteCategory({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Category deleted" }); } } });

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "" }); setDialogOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description ?? "" }); setDialogOpen(true); };
  const submit = () => {
    const data = { name: form.name, description: form.description || undefined };
    if (editing) update.mutate({ id: editing.id, data });
    else create.mutate({ data });
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Category</Button></div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {categories?.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-4">
                <div>
                  <div className="font-medium">{c.name}</div>
                  {c.description && <div className="text-sm text-muted-foreground">{c.description}</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: c.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
            {categories?.length === 0 && <div className="text-center py-8 text-muted-foreground">No categories yet</div>}
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button disabled={!form.name} onClick={submit}>{editing ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackagesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: packages, isLoading } = useListPackages();
  const { data: categories } = useListCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState({ name: "", categoryId: "", description: "", price: "", includedEditedPhotos: "", estimatedDays: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
  const create = useCreatePackage({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Package created" }); } } });
  const update = useUpdatePackage({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setEditing(null); toast({ title: "Package updated" }); } } });
  const remove = useDeletePackage({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Package deleted" }); } } });

  const openCreate = () => { setEditing(null); setForm({ name: "", categoryId: "", description: "", price: "", includedEditedPhotos: "", estimatedDays: "" }); setDialogOpen(true); };
  const openEdit = (p: Package) => {
    setEditing(p);
    setForm({ name: p.name, categoryId: p.categoryId ? String(p.categoryId) : "", description: p.description ?? "", price: String(p.price), includedEditedPhotos: String(p.includedEditedPhotos), estimatedDays: String(p.estimatedDays) });
    setDialogOpen(true);
  };
  const submit = () => {
    const data = {
      name: form.name,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      description: form.description || undefined,
      price: Number(form.price),
      includedEditedPhotos: Number(form.includedEditedPhotos),
      estimatedDays: Number(form.estimatedDays),
    };
    if (editing) update.mutate({ id: editing.id, data });
    else create.mutate({ data });
  };

  const categoryName = (id?: number | null) => categories?.find((c) => c.id === id)?.name ?? "Uncategorized";

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Package</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages?.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <Badge variant="outline">{categoryName(p.categoryId)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <div className="text-2xl font-bold">${p.price.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{p.includedEditedPhotos} edited photos • {p.estimatedDays} days</div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={() => remove.mutate({ id: p.id })}><Trash2 className="h-3 w-3 mr-1 text-destructive" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {packages?.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No packages yet</p>}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Package" : "New Package"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div className="space-y-2"><Label>Edited Photos</Label><Input type="number" value={form.includedEditedPhotos} onChange={(e) => setForm({ ...form, includedEditedPhotos: e.target.value })} /></div>
              <div className="space-y-2"><Label>Est. Days</Label><Input type="number" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button disabled={!form.name || !form.price} onClick={submit}>{editing ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddOnsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: addOns, isLoading } = useListAddOns();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AddOn | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListAddOnsQueryKey() });
  const create = useCreateAddOn({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Add-on created" }); } } });
  const update = useUpdateAddOn({ mutation: { onSuccess: () => { invalidate(); setDialogOpen(false); setEditing(null); toast({ title: "Add-on updated" }); } } });
  const remove = useDeleteAddOn({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Add-on deleted" }); } } });

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "", price: "" }); setDialogOpen(true); };
  const openEdit = (a: AddOn) => { setEditing(a); setForm({ name: a.name, description: a.description ?? "", price: String(a.price) }); setDialogOpen(true); };
  const submit = () => {
    const data = { name: form.name, description: form.description || undefined, price: Number(form.price) };
    if (editing) update.mutate({ id: editing.id, data });
    else create.mutate({ data });
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Add-on</Button></div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {addOns?.map((a) => (
              <div key={a.id} className="flex justify-between items-center p-4">
                <div>
                  <div className="font-medium">{a.name}</div>
                  {a.description && <div className="text-sm text-muted-foreground">{a.description}</div>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">${a.price.toLocaleString()}</span>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate({ id: a.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
            {addOns?.length === 0 && <div className="text-center py-8 text-muted-foreground">No add-ons yet</div>}
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Add-on" : "New Add-on"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          </div>
          <DialogFooter><Button disabled={!form.name || !form.price} onClick={submit}>{editing ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
