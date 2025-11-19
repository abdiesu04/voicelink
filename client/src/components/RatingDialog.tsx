import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, feedback?: string) => void;
}

export function RatingDialog({ open, onOpenChange, onSubmit }: RatingDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, rating <= 2 && feedback ? feedback : undefined);
      // Reset state
      setRating(0);
      setHoveredRating(0);
      setFeedback("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setRating(0);
    setHoveredRating(0);
    setFeedback("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-rating">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            How was your call?
          </DialogTitle>
          <DialogDescription className="text-center">
            Your feedback helps us improve Voztra
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Star Rating */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
                data-testid={`button-star-${star}`}
              >
                <Star
                  className={cn(
                    "h-10 w-10 transition-colors",
                    (hoveredRating >= star || rating >= star)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300 dark:text-slate-600"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Feedback for low ratings */}
          {rating > 0 && rating <= 2 && (
            <div className="w-full space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-medium text-foreground">
                Please tell us why
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What could we improve?"
                className="min-h-[100px] resize-none"
                data-testid="textarea-feedback"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-rating"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="flex-1 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90"
              data-testid="button-submit-rating"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
