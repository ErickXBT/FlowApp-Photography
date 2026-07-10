import { useMemo, useState, useEffect } from "react";

import { Link } from "wouter";
import {
  useListCategories,
  useListPackages,
  useListTeamMembers,
  useListAddOns,
  useCreateClient,
  useCreateBooking,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { fmtIDR } from "@/lib/utils";

const steps = ["Category", "Package", "Date & Location", "Your Info", "Team & Add-ons", "Review"];

export default function BookWizard() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState<number | null>(null);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [packageId, setPackageId] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [clientOrigin, setClientOrigin] = useState<string>("local");
  const [teamMemberIds, setTeamMemberIds] = useState<number[]>([]);
  const [addOnIds, setAddOnIds] = useState<number[]>([]);
  const [specialRequest, setSpecialRequest] = useState("");
  const [moodboardLink, setMoodboardLink] = useState("");

  const queryParams = new URLSearchParams(window.location.search);
  const slug = queryParams.get("slug") || "studio-senja";
  const [availabilities, setAvailabilities] = useState<Array<{ selectedDate: string; status: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/landing/${slug}/availabilities`);
        if (res.ok) setAvailabilities(await res.json());
      } catch (e) {
        console.error("Failed to load availabilities", e);
      }
    };
    load();
  }, [slug]);

  const dateStatus = useMemo(() => {
    if (!eventDate) return "available";
    return availabilities.find((a) => a.selectedDate === eventDate)?.status ?? "available";
  }, [eventDate, availabilities]);

  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: allPackages, isLoading: loadingPackages } = useListPackages();
  const { data: teamMembers } = useListTeamMembers();
  const { data: addOns } = useListAddOns();

  const packages = useMemo(
    () => (allPackages ?? []).filter((p) => !categoryId || p.categoryId === categoryId),
    [allPackages, categoryId]
  );
  const selectedPackage = allPackages?.find((p) => p.id === packageId);
  const addOnTotal = (addOns ?? []).filter((a) => addOnIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
  const total = (selectedPackage?.price ?? 0) + addOnTotal;

  const createClient = useCreateClient();
  const createBooking = useCreateBooking();

  const submitting = createClient.isPending || createBooking.isPending;

  const canProceed = () => {
    switch (step) {
      case 0: return categoryId !== null;
      case 1: return packageId !== null;
      case 2: return eventDate.length > 0 && dateStatus !== "full_booking";
      case 3: return name.length > 0 && email.length > 0 && whatsapp.length > 0;
      default: return true;
    }
  };


  const handleSubmit = async () => {
    try {
      const client = await createClient.mutateAsync({
        data: { name, email, whatsapp, clientOrigin: clientOrigin as any },
      });
      const booking = await createBooking.mutateAsync({
        data: {
          clientId: client.id,
          categoryId: categoryId ?? undefined,
          packageId: packageId!,
          eventDate,
          locationName: locationName || undefined,
          locationAddress: locationAddress || undefined,
          mapsLink: mapsLink || undefined,
          clientOrigin: clientOrigin as any,
          specialRequest: specialRequest || undefined,
          moodboardLinks: moodboardLink ? [moodboardLink] : undefined,
          teamMemberIds: teamMemberIds.length ? teamMemberIds : undefined,
          addOnIds: addOnIds.length ? addOnIds : undefined,
        },
      });
      setBookingRef(booking.id);
      setSubmitted(true);
    } catch {
      // errors are surfaced via mutation state below
    }
  };

  if (submitted && bookingRef) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
        <h1 className="text-3xl font-serif font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you, {name}. Your session request has been received.
        </p>
        <Card>
          <CardContent className="p-6 space-y-2 text-left">
            <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono font-medium">#{bookingRef}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span>{selectedPackage?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(eventDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>{fmtIDR(total)}</span></div>
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">
          We will reach out on WhatsApp shortly to confirm your down payment and finalize the details.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Dashboard
        </Link>
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif font-bold">Book a Session</h1>
        <p className="text-muted-foreground">A few quick steps and you're set.</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className={`h-1.5 rounded-full transition-all ${i === step ? "w-10 bg-primary" : i < step ? "w-6 bg-primary/50" : "w-6 bg-muted"}`} />
        ))}
      </div>

      <Card>
        <CardContent className="p-8 space-y-6 min-h-[360px]">
          <h2 className="text-lg font-medium text-muted-foreground">Step {step + 1} of {steps.length} — {steps[step]}</h2>

          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loadingCategories && [1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
              {categories?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCategoryId(c.id); setPackageId(null); }}
                  className={`text-left border rounded-lg p-4 transition-colors hover:border-primary ${categoryId === c.id ? "border-primary ring-2 ring-primary" : ""}`}
                >
                  <div className="font-medium">{c.name}</div>
                  {c.description && <div className="text-sm text-muted-foreground mt-1">{c.description}</div>}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {loadingPackages && [1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
              {packages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPackageId(p.id)}
                  className={`w-full text-left border rounded-lg p-4 transition-colors hover:border-primary flex justify-between items-start ${packageId === p.id ? "border-primary ring-2 ring-primary" : ""}`}
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="text-sm text-muted-foreground mt-1">{p.description}</div>}
                    <div className="text-xs text-muted-foreground mt-1">{p.includedEditedPhotos} edited photos • {p.estimatedDays} days</div>
                  </div>
                  <div className="font-bold whitespace-nowrap">{fmtIDR(p.price)}</div>
                </button>
              ))}
              {packages.length === 0 && <p className="text-muted-foreground text-sm">No packages available for this category.</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                {eventDate && (
                  <div className="pt-2">
                    {dateStatus === "full_booking" && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold">
                        ⚠ Maaf, slot booking untuk tanggal ini sudah penuh (Full Booking). Silakan pilih tanggal lain.
                      </div>
                    )}
                    {dateStatus === "last_slot" && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs font-semibold">
                        ⚠ Sisa 1 slot untuk tanggal ini! Harap segera menyelesaikan booking Anda.
                      </div>
                    )}
                    {dateStatus === "available" && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs font-semibold">
                        ✓ Tanggal ini tersedia untuk booking.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Grand Ballroom" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="Full address" />
              </div>
              <div className="space-y-2">
                <Label>Maps Link</Label>
                <Input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Where are you joining from?</Label>
                <div className="flex flex-wrap gap-2">
                  {["local", "out_of_city", "out_of_island", "international"].map((o) => (
                    <Button key={o} type="button" size="sm" variant={clientOrigin === o ? "default" : "outline"} className="capitalize" onClick={() => setClientOrigin(o)}>
                      {o.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {teamMembers && teamMembers.length > 0 && (
                <div className="space-y-2">
                  <Label>Preferred Team (optional)</Label>
                  <div className="space-y-2">
                    {teamMembers.map((tm) => (
                      <label key={tm.id} className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                        <Checkbox
                          checked={teamMemberIds.includes(tm.id)}
                          onCheckedChange={(checked) =>
                            setTeamMemberIds(checked ? [...teamMemberIds, tm.id] : teamMemberIds.filter((id) => id !== tm.id))
                          }
                        />
                        <span className="flex-1">{tm.name}</span>
                        <Badge variant="secondary" className="capitalize">{tm.role.replace("_", " ")}</Badge>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {addOns && addOns.length > 0 && (
                <div className="space-y-2">
                  <Label>Add-ons (optional)</Label>
                  <div className="space-y-2">
                    {addOns.map((a) => (
                      <label key={a.id} className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
                        <Checkbox
                          checked={addOnIds.includes(a.id)}
                          onCheckedChange={(checked) =>
                            setAddOnIds(checked ? [...addOnIds, a.id] : addOnIds.filter((id) => id !== a.id))
                          }
                        />
                        <span className="flex-1">{a.name}</span>
                        <span className="font-medium">{fmtIDR(a.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Moodboard Link (optional)</Label>
                <Input value={moodboardLink} onChange={(e) => setMoodboardLink(e.target.value)} placeholder="Pinterest / Instagram link" />
              </div>
              <div className="space-y-2">
                <Label>Special Request (optional)</Label>
                <Textarea value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium">{selectedPackage?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{eventDate && new Date(eventDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{locationName || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">WhatsApp</span><span>{whatsapp}</span></div>
              {addOnIds.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Add-ons</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {addOns?.filter((a) => addOnIds.includes(a.id)).map((a) => <Badge key={a.id} variant="outline">{a.name}</Badge>)}
                  </div>
                </div>
              )}
              <div className="pt-3 border-t flex justify-between font-bold text-lg"><span>Total</span><span>{fmtIDR(total)}</span></div>
              {(createClient.isError || createBooking.isError) && (
                <p className="text-destructive text-sm">Something went wrong submitting your booking. Please try again.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Submitting..." : "Confirm Booking"}
          </Button>
        )}
      </div>
    </div>
  );
}
