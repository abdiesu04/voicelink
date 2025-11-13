import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 pt-20 sm:pt-24 px-4 sm:px-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 p-6 sm:p-8">
          <div className="flex mb-4 gap-2 items-start">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
