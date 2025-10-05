import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

export default function OrganizationPage() {
  // State for organization details
  const [organization, setOrganization] = useState({
    name: "Acme Corp",
    address: "123 Main St, New York, NY",
    contactEmail: "info@acmecorp.com",
    contactPhone: "+1 (555) 123-4567",
  });

  // State for subscription status
  const [isSubscribed, setIsSubscribed] = useState(false);

  // State to control the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Handle organization details update
  const handleUpdateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Organization details updated successfully!");
    setIsEditModalOpen(false); // Close the modal after updating
    // Add your update logic here (e.g., API call)
  };

  // Handle subscription payment
  const handleSubscribe = () => {
    setIsSubscribed(true);
    toast.success("Subscription activated successfully!");
    // Add your payment logic here (e.g., redirect to payment gateway)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Organization Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            View and manage your organization's details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <p className="text-sm">{organization.name}</p>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <p className="text-sm">{organization.address}</p>
          </div>
          <div className="space-y-2">
            <Label>Contact Email</Label>
            <p className="text-sm">{organization.contactEmail}</p>
          </div>
          <div className="space-y-2">
            <Label>Contact Phone</Label>
            <p className="text-sm">{organization.contactPhone}</p>
          </div>
          <Button onClick={() => setIsEditModalOpen(true)}>
            Edit Organization Details
          </Button>
        </CardContent>
      </Card>

      {/* Subscription Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription to activate premium features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subscription Status</Label>
            <p className="text-sm">
              {isSubscribed ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-yellow-600">Inactive</span>
              )}
            </p>
          </div>
          <Button onClick={() => setIsEditModalOpen(true)}>
            Manage Subscription
          </Button>
        </CardContent>
      </Card>

      {/* Edit Settings Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateOrganization} className="space-y-4">
            <div>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={organization.name}
                onChange={(e) =>
                  setOrganization({ ...organization, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={organization.address}
                onChange={(e) =>
                  setOrganization({ ...organization, address: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                value={organization.contactEmail}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    contactEmail: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={organization.contactPhone}
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    contactPhone: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Subscription Status</Label>
                <p className="text-sm">
                  {isSubscribed ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-yellow-600">Inactive</span>
                  )}
                </p>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={(checked) => setIsSubscribed(checked)}
              />
            </div>
            {!isSubscribed && (
              <Button onClick={handleSubscribe} className="w-full">
                Pay for Subscription
              </Button>
            )}
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
