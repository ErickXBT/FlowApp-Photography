import { useListClients } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Clients() {
  const { data: clients, isLoading, error } = useListClients();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    );
  }

  if (error || !clients) {
    return <div className="p-8 text-destructive">Failed to load clients</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif font-bold">Clients</h1>
        <Button>New Client</Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {clients.map(client => (
              <div key={client.id} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-lg">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.email} • {client.whatsapp}</div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{client.clientOrigin}</Badge>
                  <Link href={`/clients/${client.id}`} className="text-sm font-medium text-primary hover:underline">
                    View
                  </Link>
                </div>
              </div>
            ))}
            {clients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No clients found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
