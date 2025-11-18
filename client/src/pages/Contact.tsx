import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Upload, Loader2, ArrowLeft } from "lucide-react";

export default function Contact() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    navigate("/login");
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 dark:from-slate-950 dark:via-indigo-950 dark:to-violet-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a screenshot smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type (images only)
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      setScreenshot(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category for your request",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please provide a message",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('message', message);
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });

      // Reset form
      setCategory("");
      setMessage("");
      setScreenshot(null);
      
      // Reset file input
      const fileInput = document.getElementById('screenshot') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 dark:from-slate-950 dark:via-indigo-950 dark:to-violet-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/account")}
          className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Account
        </Button>

        <Card className="shadow-2xl border-2 border-white/30 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                  Get in touch with us
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-400">
                  We're here to help. Send us your questions or feedback.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger
                    id="category"
                    className="h-12 text-base font-medium bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400"
                    data-testid="select-category"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature-request" data-testid="option-feature-request">Feature request</SelectItem>
                    <SelectItem value="bug-report" data-testid="option-bug-report">Bug report</SelectItem>
                    <SelectItem value="language-request" data-testid="option-language-request">Language request</SelectItem>
                    <SelectItem value="billing" data-testid="option-billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="text-base font-medium bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  data-testid="textarea-message"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Screenshot (Optional)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-screenshot"
                  />
                  <label
                    htmlFor="screenshot"
                    className="flex-1 flex items-center justify-center gap-2 h-12 px-4 text-base font-medium bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    <Upload className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {screenshot ? screenshot.name : "Upload screenshot"}
                    </span>
                  </label>
                  {screenshot && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setScreenshot(null);
                        const fileInput = document.getElementById('screenshot') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      data-testid="button-remove-screenshot"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  PNG, JPG up to 5MB
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You can also email us directly at{" "}
            <a
              href="mailto:support@getvoztra.com"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              data-testid="link-email"
            >
              support@getvoztra.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
