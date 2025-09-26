import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface AddNewsUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddNewsUrlModal: React.FC<AddNewsUrlModalProps> = ({
  isOpen,
  onClose
}) => {
  const [newsUrl, setNewsUrl] = useState('');
  const [generateSignal, setGenerateSignal] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!newsUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a news article URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/dashboard/news/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: newsUrl, 
          generate_signal: generateSignal 
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "News URL Added",
          description: "The news article has been successfully added for analysis.",
        });
        
        // Reset form and close modal
        setNewsUrl('');
        setGenerateSignal(false);
        onClose();
      } else {
        toast({
          title: "Failed to Add News URL",
          description: result.error?.message || "An error occurred while adding the news URL.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting news URL:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetAndClose = () => {
    setNewsUrl('');
    setGenerateSignal(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add News URL</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="newsUrl" className="text-sm font-medium">
              News Article URL
            </label>
            <div className="flex items-center gap-2 mt-1">
              <label htmlFor="generateSignal" className="text-sm font-medium">
                Generate Signal
              </label>
              <Checkbox 
                id="generateSignal" 
                checked={generateSignal} 
                onCheckedChange={(checked) => setGenerateSignal(checked === 'indeterminate' ? false : checked)} 
              />
            </div>
            <Input 
              id="newsUrl" 
              type="url" 
              value={newsUrl} 
              onChange={(e) => setNewsUrl(e.target.value)} 
              placeholder="https://example.com/news-article" 
              className="mt-1" 
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={resetAndClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!newsUrl}
            >
              Add News
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};