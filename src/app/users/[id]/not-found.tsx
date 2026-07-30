import NotFoundView from "@/components/Layout/NotFoundView";

export default function UserNotFound() {
  return (
    <NotFoundView
      title="User not found"
      description="Sorry, this user doesn't exist or may have been removed."
      homeHref="/users"
      homeLabel="Browse users"
    />
  );
}
