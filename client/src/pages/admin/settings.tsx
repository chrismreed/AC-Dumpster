import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";

interface AppSetting {
  key: string;
  value: string;
  description: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [defaultRentalHours, setDefaultRentalHours] = useState("24");

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<AppSetting[]>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return response.json();
    },
  });

  // Set default rental hours from settings when loaded
  useEffect(() => {
    if (settings) {
      const defaultRentalSetting = settings.find(s => s.key === "default_rental_hours");
      if (defaultRentalSetting) {
        setDefaultRentalHours(defaultRentalSetting.value);
      }
    }
  }, [settings]);

  // Update settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; description: string }) => {
      const response = await apiRequest("POST", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingMutation.mutate({
      key: "default_rental_hours",
      value: defaultRentalHours,
      description: "Default rental duration displayed to customers"
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2c2c2c]">Settings</h1>
        <p className="text-neutral-600 mt-2">
          Configure your application settings and defaults.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rental Duration Settings</CardTitle>
          <CardDescription>
            Set the default rental duration that appears throughout your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultRentalHours">Default Rental Duration (hours)</Label>
            <Input
              id="defaultRentalHours"
              type="number"
              min="1"
              max="8760"
              value={defaultRentalHours}
              onChange={(e) => setDefaultRentalHours(e.target.value)}
              placeholder="24"
            />
            <p className="text-sm text-neutral-500">
              This value will be displayed in pricing cards and booking descriptions.
              For example: "24" will show as "24-hour rental included".
            </p>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={updateSettingMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateSettingMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}