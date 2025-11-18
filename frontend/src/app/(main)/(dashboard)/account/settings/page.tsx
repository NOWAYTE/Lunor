import Integration from "~/components/settings/intergration"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"


export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-bold ">Settings</h1>
    <Tabs defaultValue="account">
        <TabsList>  
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium"></h2>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="security">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium"></h2>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="notifications">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium"></h2>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="integration">
            <div className="space-y-4">
                <Integration />
            </div>
        </TabsContent>
    </Tabs>
    </div>
  )
}
