import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
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
