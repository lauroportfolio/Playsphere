import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: "bg-primary-500 hover:bg-primary-600",
        },
      }}
      forceRedirectUrl="/redirect-after-login"
      fallbackRedirectUrl="/"
    />
  );
}
