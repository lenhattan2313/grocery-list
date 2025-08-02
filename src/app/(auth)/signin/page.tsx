import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleLogo } from "@/components/ui/google-logo";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Grocery App</CardTitle>
          <CardDescription>
            Sign in to manage your shopping lists and recipes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form
              action={async () => {
                "use server";
                try {
                  await signIn("google", { redirectTo: "/" });
                } catch (error) {
                  console.error("Sign in error:", error);
                  throw error;
                }
              }}
            >
              <Button
                type="submit"
                className="w-full"
                size="lg"
                variant="outline"
                aria-label="Continue with Google"
              >
                <GoogleLogo className="mr-2 h-5 w-5" />
                Continue with Google
              </Button>
            </form>
            {process.env.NODE_ENV === "development" && (
              <form
                action={async () => {
                  "use server";
                  await signIn("credentials", { redirectTo: "/" });
                }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  variant="default"
                  aria-label="Continue as Demo User"
                >
                  Continue as Demo User
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
