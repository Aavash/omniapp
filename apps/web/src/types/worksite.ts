export type WorkSite = {
  id?: number; // Optional because it's not required when creating a new work site
  name: string; // Name of the work site
  address: string; // Address of the work site
  city: string; // City where the work site is located
  state: string; // State where the work site is located
  zip_code: string; // Zip code of the work site
  contact_person: string; // Name of the contact person for the work site
  contact_phone: string; // Phone number of the contact person
  status: "Active" | "Inactive"; // Status of the work site (Active or Inactive)
};
