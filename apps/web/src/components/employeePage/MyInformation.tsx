import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Edit,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/auth";

export function UserInformationPage() {
  const { userData } = useAuth();
  const [user, setUser] = useState({
    full_name: userData.full_name,
    email: userData.email,
    phone_number: userData.phone_number,
    phone_number_ext: +1,
    address: userData.address,
    pay_type: userData.pay_type,
    payrate: userData.payrate,
  });

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Call your API to update user information
      // await updateUserInfo(user);
      toast.success("Your information has been updated.");
    } catch (error) {
      toast.error("Failed to update information. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Information</h1>
      </div>

      {/* User Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Full Name Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              <User className="h-6 w-6 inline-block mr-2 text-blue-600" />
              Full Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user.full_name}</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="mt-4 w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={user.full_name}
                    onChange={(e) =>
                      handleInputChange("full_name", e.target.value)
                    }
                    placeholder="Enter your full name"
                  />
                  <Button onClick={handleSubmit} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Email Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              <Mail className="h-6 w-6 inline-block mr-2 text-blue-600" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user.email}</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="mt-4 w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                  />
                  <Button onClick={handleSubmit} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Phone Number Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              <Phone className="h-6 w-6 inline-block mr-2 text-blue-600" />
              Phone Number
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {user.phone_number} (Ext: {user.phone_number_ext})
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="mt-4 w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={user.phone_number}
                    onChange={(e) =>
                      handleInputChange("phone_number", e.target.value)
                    }
                    placeholder="Enter your phone number"
                  />
                  <Label htmlFor="phone_number_ext">Extension</Label>
                  <Input
                    id="phone_number_ext"
                    value={user.phone_number_ext}
                    onChange={(e) =>
                      handleInputChange("phone_number_ext", e.target.value)
                    }
                    placeholder="Enter extension"
                  />
                  <Button onClick={handleSubmit} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              <MapPin className="h-6 w-6 inline-block mr-2 text-blue-600" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user.address}</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="mt-4 w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={user.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Enter your address"
                  />
                  <Button onClick={handleSubmit} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Pay Type Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              <Briefcase className="h-6 w-6 inline-block mr-2 text-blue-600" />
              Pay Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{user.pay_type}</p>
          </CardContent>
        </Card>

        {/* Pay Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">
              <DollarSign className="h-6 w-6 inline-block mr-2 text-blue-600" />
              Pay Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">${user.payrate.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UserInformationPage;
