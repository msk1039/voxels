import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function SandboxPage() {
  return (
    <div className="min-h-svh bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Sandbox</CardTitle>
            <CardDescription>Create without a target or campaign score.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="2d">
              <TabsList>
                <TabsTrigger value="2d">2D</TabsTrigger>
                <TabsTrigger value="3d">3D</TabsTrigger>
              </TabsList>
              <TabsContent value="2d" className="mt-4 grid gap-4 lg:grid-cols-[1fr_22rem]">
                <div className="flex min-h-[460px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
                  2D preview
                </div>
                <div className="space-y-3">
                  <Textarea className="min-h-40 font-mono" disabled />
                  <Button className="w-full" disabled>
                    Run equation
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="3d" className="mt-4 grid gap-4 lg:grid-cols-[1fr_22rem]">
                <div className="flex min-h-[460px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
                  3D preview
                </div>
                <div className="space-y-3">
                  <Textarea className="min-h-40 font-mono" disabled />
                  <Button className="w-full" disabled>
                    Run equation
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
